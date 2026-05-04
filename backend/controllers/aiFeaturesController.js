const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const { ensureUserOrganizationById } = require("../services/organizationBootstrapService");
const {
  generateFollowUpMessage,
  answerMeetingQuestion
} = require("../services/aiService");

const getOrg = async (userId) => {
  const user = await ensureUserOrganizationById(userId);
  return user?.organization || null;
};

const normalizeText = (value = "") => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const tokenize = (value = "") => normalizeText(value)
  .split(" ")
  .filter((token) => token.length > 2);

const scoreMatch = (queryTokens, text = "") => {
  if (!queryTokens.length || !text) return 0;
  const normalized = normalizeText(text);
  let score = 0;

  for (const token of queryTokens) {
    if (normalized.includes(token)) score += 2;
  }

  const uniqueHits = new Set(queryTokens.filter((token) => normalized.includes(token)));
  score += uniqueHits.size;

  return score;
};

const buildSearchDocument = (meeting, decisions = [], tasks = []) => {
  const decisionText = decisions.map((decision) => `${decision.decision || ""} ${decision.context || ""}`).join(" ");
  const taskText = tasks.map((task) => `${task.title || ""} ${task.description || ""} ${task.owner || ""}`).join(" ");

  return [
    meeting.title,
    meeting.summary,
    meeting.transcript,
    (meeting.topics || []).map((topic) => `${topic.title || ""} ${topic.content || ""}`).join(" "),
    decisionText,
    taskText
  ].join(" ");
};

exports.generateFollowUp = async (req, res) => {
  try {
    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const task = await Task.findOne({ _id: req.params.taskId, organization }).populate("meetingId", "summary");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const message = await generateFollowUpMessage({
      assignee: task.owner || "Team member",
      taskTitle: task.title,
      deadline: task.deadline,
      meetingSummary: task.meetingId?.summary || ""
    });

    res.json({ taskId: task._id, followUpMessage: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.chatWithMeeting = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meeting = await Meeting.findOne({ _id: req.params.meetingId, organization });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const answer = await answerMeetingQuestion({
      transcript: meeting.transcript,
      summary: meeting.summary,
      question
    });

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.chatWithOrgMemory = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const queryTokens = tokenize(question);
    const meetings = await Meeting.find({ organization })
      .populate({ path: "decisions", select: "decision context status createdAt meeting createdBy", populate: { path: "createdBy", select: "name email" } })
      .sort({ createdAt: -1 });

    const tasks = await Task.find({ organization }).populate("meetingId", "title meetingDate createdAt");

    const taskByMeeting = new Map();
    for (const task of tasks) {
      const key = String(task.meetingId?._id || task.meetingId || "");
      if (!taskByMeeting.has(key)) taskByMeeting.set(key, []);
      taskByMeeting.get(key).push(task);
    }

    const scoredMeetings = meetings.map((meeting) => {
      const meetingTasks = taskByMeeting.get(String(meeting._id)) || [];
      const meetingDecisions = Array.isArray(meeting.decisions) ? meeting.decisions : [];
      const text = buildSearchDocument(meeting, meetingDecisions, meetingTasks);
      const score = scoreMatch(queryTokens, text);

      const timeline = [
        ...(meetingDecisions || []).map((decision) => ({
          type: "decision",
          date: decision.createdAt || meeting.createdAt,
          title: decision.decision,
          context: decision.context || ""
        })),
        ...meetingTasks.map((task) => ({
          type: "task",
          date: task.createdAt || meeting.createdAt,
          title: task.title,
          context: task.description || ""
        }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      return {
        meeting,
        meetingTasks,
        meetingDecisions,
        score,
        timeline
      };
    }).filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const contextText = scoredMeetings.length
      ? scoredMeetings.map((item) => {
          const relatedDecisions = item.meetingDecisions.slice(0, 3).map((decision) => `Decision: ${decision.decision}`).join("\n");
          const relatedTasks = item.meetingTasks.slice(0, 3).map((task) => `Task: ${task.title}`).join("\n");
          return [
            `Meeting: ${item.meeting.title}`,
            `Summary: ${item.meeting.summary || ""}`,
            relatedDecisions,
            relatedTasks
          ].filter(Boolean).join("\n");
        }).join("\n\n")
      : "No matching org memory was found.";

    const answer = await answerMeetingQuestion({
      transcript: contextText,
      summary: contextText,
      question
    });

    res.json({
      answer,
      query: question,
      results: scoredMeetings.map((item) => ({
        _id: item.meeting._id,
        title: item.meeting.title,
        summary: item.meeting.summary,
        meetingDate: item.meeting.meetingDate || item.meeting.createdAt,
        score: item.score,
        decisions: item.meetingDecisions,
        tasks: item.meetingTasks,
        timeline: item.timeline
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchMeetings = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query is required" });
    }

    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const queryTokens = tokenize(q);

    const meetings = await Meeting.find({ organization })
      .populate({ path: "decisions", select: "decision context status createdAt createdBy", populate: { path: "createdBy", select: "name email" } })
      .sort({ createdAt: -1 });

    const tasks = await Task.find({ organization }).populate("meetingId", "title meetingDate createdAt");

    const taskByMeeting = new Map();
    for (const task of tasks) {
      const key = String(task.meetingId?._id || task.meetingId || "");
      if (!taskByMeeting.has(key)) taskByMeeting.set(key, []);
      taskByMeeting.get(key).push(task);
    }

    const results = meetings.map((meeting) => {
      const meetingTasks = taskByMeeting.get(String(meeting._id)) || [];
      const meetingDecisions = Array.isArray(meeting.decisions) ? meeting.decisions : [];
      const searchText = buildSearchDocument(meeting, meetingDecisions, meetingTasks);
      const score = scoreMatch(queryTokens, searchText);

      const relatedMeetings = meetings
        .filter((other) => other._id.toString() !== meeting._id.toString())
        .map((other) => ({
          _id: other._id,
          title: other.title,
          score: scoreMatch(queryTokens, buildSearchDocument(other, other.decisions || [], taskByMeeting.get(String(other._id)) || []))
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const timeline = [
        ...meetingDecisions.map((decision) => ({
          type: "decision",
          date: decision.createdAt || meeting.createdAt,
          title: decision.decision,
          context: decision.context || ""
        })),
        ...meetingTasks.map((task) => ({
          type: "task",
          date: task.createdAt || meeting.createdAt,
          title: task.title,
          context: task.description || ""
        }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      return {
        _id: meeting._id,
        title: meeting.title,
        summary: meeting.summary,
        meetingDate: meeting.meetingDate,
        participants: meeting.participants,
        topics: meeting.topics,
        decisions: meetingDecisions,
        tasks: meetingTasks,
        score,
        relatedMeetings,
        timeline
      };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({
      query: q,
      results,
      summary: results.length
        ? `Found ${results.length} relevant meetings with linked decisions, tasks, and related discussions.`
        : "No matching org memory found."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const tasks = await Task.find({ organization });
    const overdueTasks = tasks.filter(
      (task) => task.deadline && task.status !== "completed" && new Date(task.deadline) < new Date()
    );

    const assigneeCounts = {};
    for (const task of tasks) {
      const person = task.owner || "Unassigned";
      assigneeCounts[person] = (assigneeCounts[person] || 0) + 1;
    }

    const mostAssigned = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1])[0] || ["None", 0];
    const completionRate = tasks.length ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100) : 0;

    res.json({
      frequentTasks: { mostAssignedPerson: mostAssigned[0], totalAssigned: mostAssigned[1] },
      delayedTasks: overdueTasks.map((task) => ({ id: task._id, title: task.title, owner: task.owner })),
      productivityScore: completionRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKnowledgeGraph = async (req, res) => {
  try {
    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const meetings = await Meeting.find({ organization })
      .populate("createdBy", "name email")
      .populate({ path: "decisions", populate: { path: "createdBy", select: "name email" } })
      .sort({ createdAt: -1 });

    const tasks = await Task.find({ organization })
      .populate("meetingId", "title")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    const nodes = [];
    const edges = [];
    const nodeIndex = new Map();

    const upsertNode = (node) => {
      if (!nodeIndex.has(node.id)) {
        nodeIndex.set(node.id, true);
        nodes.push(node);
      }
    };

    const addEdge = (source, target, label) => {
      if (!source || !target) return;
      edges.push({
        id: `${source}-${target}-${label}`,
        source,
        target,
        label
      });
    };

    for (const meeting of meetings) {
      const meetingId = `meeting-${meeting._id}`;
      upsertNode({
        id: meetingId,
        label: meeting.title,
        type: "meeting",
        meta: {
          summary: meeting.summary || "",
          date: meeting.meetingDate || meeting.createdAt
        }
      });

      if (meeting.createdBy) {
        const personId = `person-${meeting.createdBy._id}`;
        upsertNode({
          id: personId,
          label: meeting.createdBy.name,
          type: "person",
          meta: { email: meeting.createdBy.email || "" }
        });
        addEdge(personId, meetingId, "created");
      }

      for (const participant of meeting.participants || []) {
        const participantId = participant.email ? `participant-${participant.email}` : `participant-${participant.name}`;
        upsertNode({
          id: participantId,
          label: participant.name || participant.email || "Participant",
          type: "person",
          meta: { email: participant.email || "" }
        });
        addEdge(participantId, meetingId, "attended");
      }

      for (const decision of meeting.decisions || []) {
        const decisionId = `decision-${decision._id}`;
        upsertNode({
          id: decisionId,
          label: decision.decision,
          type: "decision",
          meta: {
            context: decision.context || "",
            status: decision.status || "accepted"
          }
        });
        addEdge(meetingId, decisionId, "produced");

        if (decision.createdBy) {
          const creatorId = `person-${decision.createdBy._id}`;
          upsertNode({
            id: creatorId,
            label: decision.createdBy.name,
            type: "person",
            meta: { email: decision.createdBy.email || "" }
          });
          addEdge(creatorId, decisionId, "recorded");
        }
      }
    }

    for (const task of tasks) {
      const taskId = `task-${task._id}`;
      upsertNode({
        id: taskId,
        label: task.title,
        type: "task",
        meta: {
          status: task.status || "pending",
          priority: task.priority || "medium",
          deadline: task.deadline || null
        }
      });

      if (task.meetingId) {
        addEdge(`meeting-${task.meetingId._id}`, taskId, "derived from");
      }

      if (task.assignedTo) {
        const assigneeId = `person-${task.assignedTo._id}`;
        upsertNode({
          id: assigneeId,
          label: task.assignedTo.name,
          type: "person",
          meta: { email: task.assignedTo.email || "" }
        });
        addEdge(assigneeId, taskId, "assigned to");
      } else if (task.owner) {
        const ownerId = `owner-${task.owner}`;
        upsertNode({
          id: ownerId,
          label: task.owner,
          type: "person",
          meta: { email: "" }
        });
        addEdge(ownerId, taskId, "owned by");
      }
    }

    const counts = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      nodes,
      edges,
      summary: {
        meetings: counts.meeting || 0,
        decisions: counts.decision || 0,
        tasks: counts.task || 0,
        people: counts.person || 0,
        relations: edges.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportTasksCsv = async (req, res) => {
  try {
    const organization = await getOrg(req.userId);
    if (!organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const tasks = await Task.find({ organization }).populate("meetingId", "title");
    const rows = ["Task Title,Owner,Deadline,Priority,Status,Meeting"];
    for (const task of tasks) {
      rows.push([
        `"${(task.title || "").replace(/"/g, '""')}"`,
        `"${(task.owner || "").replace(/"/g, '""')}"`,
        `"${task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""}"`,
        `"${task.priority || ""}"`,
        `"${task.status || ""}"`,
        `"${(task.meetingId?.title || "").replace(/"/g, '""')}"`
      ].join(","));
    }

    const csv = rows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=tasks-export.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};