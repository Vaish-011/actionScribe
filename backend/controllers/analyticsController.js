const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const {
  getAccessContext,
  buildMeetingFilter,
  buildTaskFilter
} = require("../services/accessScopeService");

const getDaysBetween = (from, to) => Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

const getRiskScore = (task, now = new Date()) => {
  let score = 0;

  if (task.status === "blocked") score += 45;
  if (task.status === "in-progress") score += 10;
  if (task.priority === "urgent") score += 25;
  if (task.priority === "high") score += 15;

  if (task.deadline) {
    const deadline = new Date(task.deadline);
    const daysToDeadline = getDaysBetween(now, deadline);
    if (daysToDeadline < 0) score += 50;
    else if (daysToDeadline <= 2) score += 35;
    else if (daysToDeadline <= 5) score += 20;
  }

  if (task.createdAt) {
    const ageDays = getDaysBetween(new Date(task.createdAt), now);
    if (ageDays >= 14 && task.status !== "completed") score += 20;
    else if (ageDays >= 7 && task.status !== "completed") score += 10;
  }

  return Math.min(score, 100);
};

exports.getTeamDashboard = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const memberMeetingIds = (await Meeting.find(buildMeetingFilter(context)).select("_id"))
      .map((m) => m._id);
    const taskScope = buildTaskFilter(context, memberMeetingIds);

    const [totalMeetings, totalTasks, completedTasks, pendingTasks, tasks, meetings] = await Promise.all([
      Meeting.countDocuments(buildMeetingFilter(context)),
      Task.countDocuments(taskScope),
      Task.countDocuments({ ...taskScope, status: "completed" }),
      Task.countDocuments({
        ...taskScope,
        status: { $in: ["pending", "in-progress", "blocked"] }
      }),
      Task.find(taskScope).populate("assignedTo", "name").populate("meetingId", "title meetingDate createdAt"),
      Meeting.find(buildMeetingFilter(context)).select("title meetingDate createdAt")
    ]);

    const tasksPerMemberMap = {};
    const workloadMap = {};
    const now = new Date();
    const riskTasks = [];

    for (const task of tasks) {
      const key = task.assignedTo?.name || task.owner || "Unassigned";
      tasksPerMemberMap[key] = (tasksPerMemberMap[key] || 0) + 1;

      workloadMap[key] = workloadMap[key] || { name: key, total: 0, overdue: 0, blocked: 0, riskScore: 0 };
      workloadMap[key].total += 1;
      if (task.status === "blocked") workloadMap[key].blocked += 1;
      if (task.deadline && task.status !== "completed" && new Date(task.deadline) < now) workloadMap[key].overdue += 1;
      workloadMap[key].riskScore += getRiskScore(task, now);

      const riskScore = getRiskScore(task, now);
      if (riskScore >= 35) {
        riskTasks.push({
          id: task._id,
          title: task.title,
          owner: key,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          riskScore,
          meetingTitle: task.meetingId?.title || ""
        });
      }
    }

    const tasksPerMember = Object.entries(tasksPerMemberMap).map(([name, count]) => ({ name, count }));
    const workload = Object.values(workloadMap)
      .map((member) => ({
        ...member,
        averageRisk: member.total ? Math.round(member.riskScore / member.total) : 0
      }))
      .sort((a, b) => b.averageRisk - a.averageRisk || b.overdue - a.overdue || b.total - a.total);

    const overloadedPeople = workload.filter((member) => member.total >= 4 || member.overdue > 0 || member.averageRisk >= 35).slice(0, 5);
    const bottlenecks = tasks
      .filter((task) => task.status === "blocked" || (task.status === "in-progress" && task.deadline && new Date(task.deadline) < now))
      .map((task) => ({
        id: task._id,
        title: task.title,
        owner: task.assignedTo?.name || task.owner || "Unassigned",
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        meetingTitle: task.meetingId?.title || ""
      }))
      .slice(0, 8);

    const meetingEffectiveness = meetings.length
      ? Math.min(100, Math.round((completedTasks / Math.max(totalMeetings, 1)) * 25 + (completedTasks / Math.max(totalTasks, 1)) * 75))
      : 0;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      metrics: {
        totalMeetings,
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        meetingEffectiveness,
        productivityScore: completionRate
      },
      charts: {
        tasksPerMember,
        meetingFrequencyHint: "Use meetingDate for time-series visualization",
        workload,
        overloadedPeople
      },
      execution: {
        bottlenecks,
        riskTasks,
        overloadedPeople,
        meetingEffectiveness,
        decisionVelocity: totalMeetings ? Math.round((completedTasks / totalMeetings) * 10) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};