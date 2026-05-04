import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import toast from "react-hot-toast";

const cleanSummaryText = (raw = "") => {
  if (!raw) return "";
  return raw
    .replace(/\*\*/g, "")
    .replace(/^\s*here'?s\s+a\s+clear\s+and\s+concise\s+summary\s+of\s+the\s+meeting\s+transcript\s*:?\s*/i, "")
    .replace(/^\s*here'?s\s+a\s+concise\s+summary\s*:?\s*/i, "")
    .replace(/^\s*meeting\s+summary\s*:?\s*/i, "")
    .trim();
};

function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meetingDraft, setMeetingDraft] = useState({ title: "", summary: "" });
  const [taskDrafts, setTaskDrafts] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [decisionDraft, setDecisionDraft] = useState({ decision: "", context: "" });
  const [editingDecisionId, setEditingDecisionId] = useState("");
  const [decisionHistory, setDecisionHistory] = useState({});
  const [savingDecision, setSavingDecision] = useState(false);

  const syncDrafts = (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingDraft({
      title: meeting?.title || "",
      summary: meeting?.summary || ""
    });
    setTaskDrafts((meeting?.tasks || []).map((task) => ({
      ...task,
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""
    })));
    setDecisions(Array.isArray(meeting?.decisions) ? meeting.decisions : []);
    setDecisionDraft({ decision: "", context: "" });
    setEditingDecisionId("");
    setDecisionHistory({});
    setIsEditing(false);
  };

  const loadDecisions = async (meetingId) => {
    try {
      const res = await API.get(`/decisions/meeting/${meetingId}`);
      setDecisions(res.data || []);
    } catch (error) {
      setDecisions([]);
      toast.error(error?.response?.data?.message || "Failed to load decisions");
    }
  };

  const loadMeetings = async () => {
    try {
      const res = await API.get("/meetings");
      const list = res.data || [];
      setMeetings(list);

      if (!selectedMeeting && list.length) {
        const detail = await API.get(`/meetings/${list[0]._id}`);
        syncDrafts(detail.data);
        await loadDecisions(list[0]._id);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load meetings");
    }
  };

  const openMeeting = async (meetingId) => {
    try {
      const res = await API.get(`/meetings/${meetingId}`);
      syncDrafts(res.data);
      await loadDecisions(meetingId);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load meeting details");
    }
  };

  const startEditing = () => {
    if (!selectedMeeting) return;

    setMeetingDraft({
      title: selectedMeeting.title || "",
      summary: selectedMeeting.summary || ""
    });
    setTaskDrafts((selectedMeeting.tasks || []).map((task) => ({
      ...task,
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""
    })));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (selectedMeeting) {
      setMeetingDraft({
        title: selectedMeeting.title || "",
        summary: selectedMeeting.summary || ""
      });
      setTaskDrafts((selectedMeeting.tasks || []).map((task) => ({
        ...task,
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""
      })));
    }
    setIsEditing(false);
  };

  const updateTaskDraft = (taskId, field, value) => {
    setTaskDrafts((current) => current.map((task) => (
      task._id === taskId ? { ...task, [field]: value } : task
    )));
  };

  const saveEdits = async () => {
    if (!selectedMeeting) return;

    try {
      setSaving(true);

      const updatedMeeting = await API.patch(`/meetings/${selectedMeeting._id}`, {
        title: meetingDraft.title,
        summary: meetingDraft.summary
      });

      const updatedTasks = await Promise.all(
        taskDrafts.map((task) => API.patch(`/tasks/${task._id}`, {
          title: task.title,
          description: task.description,
          owner: task.owner,
          priority: task.priority,
          status: task.status,
          deadline: task.deadline || null
        }))
      );

      const refreshedMeeting = {
        ...updatedMeeting.data,
        tasks: updatedTasks.map((response) => response.data)
      };

      syncDrafts(refreshedMeeting);
      await loadMeetings();
      toast.success("Meeting and tasks updated successfully");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const createDecision = async () => {
    if (!selectedMeeting || !decisionDraft.decision.trim()) {
      toast.error("Enter a decision first");
      return;
    }

    try {
      setSavingDecision(true);
      await API.post("/decisions", {
        meetingId: selectedMeeting._id,
        decision: decisionDraft.decision,
        context: decisionDraft.context
      });
      setDecisionDraft({ decision: "", context: "" });
      await loadDecisions(selectedMeeting._id);
      toast.success("Decision added");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add decision");
    } finally {
      setSavingDecision(false);
    }
  };

  const saveDecision = async (decisionId) => {
    const draft = decisionHistory[decisionId]?.draft;
    if (!draft?.decision?.trim()) {
      toast.error("Decision text cannot be empty");
      return;
    }

    try {
      setSavingDecision(true);
      await API.patch(`/decisions/${decisionId}`, {
        updates: {
          decision: draft.decision,
          context: draft.context,
          status: draft.status
        },
        reason: draft.reason
      });
      setEditingDecisionId("");
      setDecisionHistory((current) => {
        const next = { ...current };
        delete next[decisionId];
        return next;
      });
      await loadDecisions(selectedMeeting._id);
      toast.success("Decision updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update decision");
    } finally {
      setSavingDecision(false);
    }
  };

  const loadDecisionHistory = async (decisionId) => {
    try {
      const res = await API.get(`/decisions/${decisionId}/history`);
      setDecisionHistory((current) => ({
        ...current,
        [decisionId]: {
          history: res.data || [],
          draft: current[decisionId]?.draft || null,
          open: true
        }
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load history");
    }
  };

  const deleteMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to delete this meeting? This action cannot be undone.")) {
      return;
    }

    try {
      await API.delete(`/meetings/${meetingId}`);
      toast.success("Meeting deleted successfully");

      const updated = meetings.filter(m => m._id !== meetingId);
      setMeetings(updated);

      if (selectedMeeting?._id === meetingId) {
        if (updated.length) {
          const detail = await API.get(`/meetings/${updated[0]._id}`);
          syncDrafts(detail.data);
        } else {
          setSelectedMeeting(null);
          setMeetingDraft({ title: "", summary: "" });
          setTaskDrafts([]);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete meeting");
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const topics = selectedMeeting?.topics || [];
  const meetingSummary = isEditing ? meetingDraft.summary : selectedMeeting?.summary;
  const meetingTitle = isEditing ? meetingDraft.title : selectedMeeting?.title;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid lg:grid-cols-3 gap-4">

        {/* LEFT: MEETING LIST */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold mb-3 dark:text-white">Meeting History</h2>

          <div className="space-y-2 max-h-[70vh] overflow-auto">
            {meetings.length === 0 && (
              <p className="text-sm text-gray-500">No meetings found.</p>
            )}

            {meetings.map((meeting) => (
              <button
                key={meeting._id}
                onClick={() => openMeeting(meeting._id)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                  selectedMeeting?._id === meeting._id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <p className="font-semibold dark:text-white">{meeting.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(meeting.meetingDate || meeting.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* RIGHT: DETAILS */}
        <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">

          {!selectedMeeting ? (
            <p className="text-sm text-gray-500">Select a meeting to view details.</p>
          ) : (
            <div className="space-y-4">

              {/* HEADER */}
              <div className="flex items-start justify-between">
                <div>
                  {isEditing ? (
                    <input
                      className="text-xl font-bold bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-black dark:text-white w-full max-w-xl"
                      value={meetingDraft.title}
                      onChange={(e) => setMeetingDraft((current) => ({ ...current, title: e.target.value }))}
                    />
                  ) : (
                    <h2 className="text-xl font-bold dark:text-white">
                      {meetingTitle}
                    </h2>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(selectedMeeting.meetingDate || selectedMeeting.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdits}
                        disabled={saving}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-md text-sm transition font-medium"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 disabled:opacity-60 text-white rounded-md text-sm transition font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startEditing}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition font-medium"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => deleteMeeting(selectedMeeting._id)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                <h3 className="font-semibold mb-1 dark:text-white">Summary</h3>
                {isEditing ? (
                  <textarea
                    className="w-full min-h-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white p-2 text-sm"
                    value={meetingDraft.summary}
                    onChange={(e) => setMeetingDraft((current) => ({ ...current, summary: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm dark:text-gray-100 whitespace-pre-wrap">
                    {cleanSummaryText(meetingSummary) || "No summary available"}
                  </p>
                )}
              </div>

              {/* TASKS */}
              <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                <h3 className="font-semibold mb-2 dark:text-white">Tasks</h3>

                {taskDrafts.length === 0 && (
                  <p className="text-sm text-gray-500">No tasks available.</p>
                )}

                <div className="space-y-3">
                  {taskDrafts.map((task) => (
                    <div key={task._id} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 space-y-2">
                      {isEditing ? (
                        <>
                          <input
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                            value={task.title || ""}
                            onChange={(e) => updateTaskDraft(task._id, "title", e.target.value)}
                            placeholder="Task title"
                          />
                          <textarea
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                            value={task.description || ""}
                            onChange={(e) => updateTaskDraft(task._id, "description", e.target.value)}
                            placeholder="Task description"
                            rows={2}
                          />
                          <div className="grid md:grid-cols-2 gap-2">
                            <input
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                              value={task.owner || ""}
                              onChange={(e) => updateTaskDraft(task._id, "owner", e.target.value)}
                              placeholder="Owner"
                            />
                            <input
                              type="date"
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                              value={task.deadline || ""}
                              onChange={(e) => updateTaskDraft(task._id, "deadline", e.target.value)}
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-2">
                            <select
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                              value={task.priority || "medium"}
                              onChange={(e) => updateTaskDraft(task._id, "priority", e.target.value)}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                            <select
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                              value={task.status || "pending"}
                              onChange={(e) => updateTaskDraft(task._id, "status", e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-medium dark:text-white">{task.title || task.task}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{task.description || "No description"}</p>
                          <div className="text-sm text-gray-500 dark:text-gray-300 space-y-1">
                            <p>Owner: {task.owner || "Unassigned"}</p>
                            <p>Status: {task.status || "pending"}</p>
                            <p>Priority: {task.priority || "medium"}</p>
                            <p>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "None"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* TOPICS ONLY */}
              <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                <h3 className="font-semibold mb-2 dark:text-white">Topics</h3>

                {topics.length === 0 && (
                  <p className="text-sm text-gray-500">No topics extracted.</p>
                )}

                <ul className="space-y-2">
                  {topics.map((topic, index) => (
                    <li
                      key={`${topic.title}-${index}`}
                      className="text-sm dark:text-gray-100"
                    >
                      <p className="font-medium">{topic.title}</p>
                      <p className="text-gray-500 dark:text-gray-300">
                        {topic.content}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* DECISIONS */}
              <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold dark:text-white">Decision Registry</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                    {decisions.length} total
                  </span>
                </div>

                <div className="grid md:grid-cols-[1fr_auto] gap-2 mb-3">
                  <input
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-3 py-2 text-sm"
                    placeholder="Decision statement"
                    value={decisionDraft.decision}
                    onChange={(e) => setDecisionDraft((current) => ({ ...current, decision: e.target.value }))}
                  />
                  <button
                    onClick={createDecision}
                    disabled={savingDecision}
                    className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
                  >
                    Add Decision
                  </button>
                </div>
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-3 py-2 text-sm mb-3"
                  placeholder="Context / rationale"
                  rows={2}
                  value={decisionDraft.context}
                  onChange={(e) => setDecisionDraft((current) => ({ ...current, context: e.target.value }))}
                />

                {decisions.length === 0 ? (
                  <p className="text-sm text-gray-500">No decisions recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {decisions.map((decision) => {
                      const editState = decisionHistory[decision._id]?.draft || {
                        decision: decision.decision || "",
                        context: decision.context || "",
                        status: decision.status || "accepted",
                        reason: ""
                      };
                      const history = decisionHistory[decision._id]?.history || [];
                      const isOpen = Boolean(decisionHistory[decision._id]?.open);

                      return (
                        <div key={decision._id} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 space-y-2">
                          {editingDecisionId === decision._id ? (
                            <>
                              <input
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                                value={editState.decision}
                                onChange={(e) => setDecisionHistory((current) => ({
                                  ...current,
                                  [decision._id]: { ...current[decision._id], draft: { ...editState, decision: e.target.value } }
                                }))}
                              />
                              <textarea
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                                rows={2}
                                value={editState.context}
                                onChange={(e) => setDecisionHistory((current) => ({
                                  ...current,
                                  [decision._id]: { ...current[decision._id], draft: { ...editState, context: e.target.value } }
                                }))}
                              />
                              <div className="grid md:grid-cols-2 gap-2">
                                <select
                                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                                  value={editState.status}
                                  onChange={(e) => setDecisionHistory((current) => ({
                                    ...current,
                                    [decision._id]: { ...current[decision._id], draft: { ...editState, status: e.target.value } }
                                  }))}
                                >
                                  <option value="accepted">Accepted</option>
                                  <option value="proposed">Proposed</option>
                                  <option value="deferred">Deferred</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                <input
                                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-3 py-2 text-sm"
                                  placeholder="Why changed?"
                                  value={editState.reason}
                                  onChange={(e) => setDecisionHistory((current) => ({
                                    ...current,
                                    [decision._id]: { ...current[decision._id], draft: { ...editState, reason: e.target.value } }
                                  }))}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveDecision(decision._id)}
                                  disabled={savingDecision}
                                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm"
                                >
                                  Save Change
                                </button>
                                <button
                                  onClick={() => setEditingDecisionId("")}
                                  className="px-3 py-1.5 rounded-md bg-gray-500 hover:bg-gray-600 text-white text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium dark:text-white">{decision.decision}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{decision.context || "No context"}</p>
                                  <p className="text-xs text-gray-500 mt-1">Status: {decision.status || "accepted"}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingDecisionId(decision._id);
                                    setDecisionHistory((current) => ({
                                      ...current,
                                      [decision._id]: {
                                        ...current[decision._id],
                                        draft: {
                                          decision: decision.decision || "",
                                          context: decision.context || "",
                                          status: decision.status || "accepted",
                                          reason: ""
                                        }
                                      }
                                    }));
                                  }}
                                  className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                                >
                                  Edit
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  const nextOpen = !isOpen;
                                  setDecisionHistory((current) => ({
                                    ...current,
                                    [decision._id]: {
                                      ...current[decision._id],
                                      open: nextOpen,
                                      history: current[decision._id]?.history || []
                                    }
                                  }));
                                  if (!history.length) {
                                    loadDecisionHistory(decision._id);
                                  }
                                }}
                                className="text-sm text-indigo-600 dark:text-indigo-300"
                              >
                                {isOpen ? "Hide history" : "Show history"}
                              </button>

                              {isOpen && (
                                <div className="rounded-md bg-slate-50 dark:bg-gray-700 p-2 text-xs space-y-2">
                                  {history.length === 0 ? (
                                    <p className="text-gray-500">No change history yet.</p>
                                  ) : (
                                    history.map((entry, index) => (
                                      <div key={`${decision._id}-${index}`} className="border border-gray-200 dark:border-gray-600 rounded p-2">
                                        <p className="font-medium text-gray-800 dark:text-gray-100">
                                          {entry.reason || "Updated decision"}
                                        </p>
                                        <p className="text-gray-500">{entry.changedAt ? new Date(entry.changedAt).toLocaleString() : "Unknown time"}</p>
                                        <p className="text-gray-500">By: {entry.changedBy?.name || entry.changedBy?.email || "Unknown"}</p>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </section>
      </div>
    </div>
  );
}

export default Meetings;