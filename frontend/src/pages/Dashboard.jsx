import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import CreateMeeting from "../components/CreateMeeting";
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

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [insights, setInsights] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [followUpMap, setFollowUpMap] = useState({});
  const [loadingFollowUpId, setLoadingFollowUpId] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch (error) {
      setTasks([]);
      toast.error(error?.response?.data?.error || "Failed to load tasks");
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await API.get("/meetings");
      setMeetings(res.data);
      if (!selectedMeetingId && res.data.length > 0) {
        setSelectedMeetingId(res.data[0]._id);
      }
    } catch (error) {
      setMeetings([]);
      toast.error(error?.response?.data?.error || "Failed to load meetings");
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await API.get("/analytics/dashboard");
      setMetrics(res.data.metrics);
    } catch (error) {
      setMetrics(null);
      toast.error(error?.response?.data?.error || "Failed to load team metrics");
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await API.get("/ai/insights");
      setInsights(res.data);
    } catch (error) {
      setInsights(null);
      toast.error(error?.response?.data?.error || "Failed to load insights");
    }
  };

  const refreshWorkspace = () => {
    fetchTasks();
    fetchMetrics();
    fetchMeetings();
    fetchInsights();
  };

  const completeTask = async (id) => {
    try {
      await API.patch(`/tasks/${id}/complete`);
      refreshWorkspace();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update task");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/tasks/${id}/status`, { status });
      refreshWorkspace();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update task status");
    }
  };

  const runSmartSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await API.get(`/ai/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res.data.results || []);
    } catch (error) {
      setSearchResults([]);
      toast.error(error?.response?.data?.error || "Search failed");
    }
  };

  const askMeetingQuestion = async () => {
    if (!selectedMeetingId || !chatQuestion.trim()) {
      return;
    }

    try {
      const res = await API.post(`/ai/chat/${selectedMeetingId}`, {
        question: chatQuestion
      });
      setChatAnswer(res.data.answer || "No answer available");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Meeting chat failed");
    }
  };

  const generateFollowUp = async (taskId) => {
    try {
      setLoadingFollowUpId(taskId);
      const res = await API.post(`/ai/follow-up/${taskId}`);
      setFollowUpMap((prev) => ({
        ...prev,
        [taskId]: res.data.followUpMessage || "No follow-up generated"
      }));
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to generate follow-up");
    } finally {
      setLoadingFollowUpId("");
    }
  };

  const exportTasksCsv = async () => {
    try {
      const res = await API.get("/ai/export/tasks.csv", { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", "tasks-export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success("Task export downloaded");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to export tasks");
    }
  };

  useEffect(() => {
    refreshWorkspace();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runSmartSearch();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const groupedTasks = {
    pending: tasks.filter((task) => task.status === "pending"),
    "in-progress": tasks.filter((task) => task.status === "in-progress"),
    completed: tasks.filter((task) => task.status === "completed"),
    blocked: tasks.filter((task) => task.status === "blocked")
  };

  const statusBadge = {
    pending: "bg-amber-100 text-amber-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-emerald-100 text-emerald-800",
    blocked: "bg-rose-100 text-rose-800"
  };

  const previewMeetings = meetings.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">

        <section className="mb-6">
          <CreateMeeting refresh={refreshWorkspace} />
        </section>

        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Meetings</p><p className="text-2xl font-bold dark:text-white">{metrics.totalMeetings}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Tasks</p><p className="text-2xl font-bold dark:text-white">{metrics.totalTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Completed</p><p className="text-2xl font-bold dark:text-white">{metrics.completedTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Pending</p><p className="text-2xl font-bold dark:text-white">{metrics.pendingTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"><p className="text-xs uppercase tracking-wide text-gray-500">Productivity</p><p className="text-2xl font-bold dark:text-white">{metrics.completionRate}%</p></div>
          </div>
        )}

        <section className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold dark:text-white">Smart Search</h2>
              <button onClick={runSmartSearch} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg">Search</button>
            </div>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2 mb-3"
              placeholder="Search across all meetings (e.g. marketing discussion)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults([]);
              }}
            />
            <div className="space-y-2 max-h-52 overflow-auto">
              {searchResults.length === 0 && <p className="text-sm text-gray-500">No search results yet.</p>}
              {searchResults.map((meeting) => (
                <div key={meeting._id} className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                  <p className="font-semibold dark:text-white">{meeting.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{cleanSummaryText(meeting.summary) || "No summary available"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold dark:text-white">AI Insights</h2>
              <button onClick={fetchInsights} className="text-sm text-indigo-600 dark:text-indigo-300">Refresh</button>
            </div>
            {insights ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3 dark:text-white">
                  <p className="font-semibold">Most assigned</p>
                  <p>{insights?.frequentTasks?.mostAssignedPerson || "N/A"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3 dark:text-white">
                  <p className="font-semibold">Overdue tasks</p>
                  <p>{insights?.delayedTasks?.length || 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3 dark:text-white">
                  <p className="font-semibold">Productivity score</p>
                  <p>{insights?.productivityScore ?? 0}%</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Insights unavailable.</p>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold mb-3 dark:text-white">Meeting History</h2>
            <div className="space-y-2 max-h-72 overflow-auto">
              {previewMeetings.length === 0 && <p className="text-sm text-gray-500">No meetings yet.</p>}
              {previewMeetings.map((meeting) => (
                <button
                  key={meeting._id}
                  onClick={() => setSelectedMeetingId(meeting._id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition ${selectedMeetingId === meeting._id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-gray-200 dark:border-gray-600"}`}
                >
                  <p className="font-semibold dark:text-white">{meeting.title}</p>
                  <p className="text-xs text-gray-500">{new Date(meeting.meetingDate || meeting.createdAt).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold dark:text-white">Meeting Assistant Chat</h2>
              <button onClick={exportTasksCsv} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded-lg">Export Tasks CSV</button>
            </div>
            <div className="grid md:grid-cols-[220px,1fr] gap-3 mb-3">
              <select
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2"
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
              >
                <option value="">Select meeting</option>
                {meetings.map((meeting) => (
                  <option key={meeting._id} value={meeting._id}>{meeting.title}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="Ask: What tasks were assigned to Rahul?"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                />
                <button onClick={askMeetingQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">Ask</button>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3 min-h-24 text-sm dark:text-white">
              {chatAnswer || "Assistant response will appear here."}
            </div>
          </div>
        </section>

        <h2 className="text-xl dark:text-white font-bold mt-6 mb-3">
          Task Board
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <div key={status} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 dark:text-white">{status}</h3>
              {statusTasks.length === 0 && <p className="text-sm text-gray-500">No tasks</p>}
              {statusTasks.map((task) => (
                <div key={task._id} className="bg-slate-50 dark:bg-gray-700 text-black dark:text-white border border-slate-200 dark:border-gray-600 p-3 mb-3 rounded-lg">
                  <p className="font-semibold">{task.title || task.task}</p>
                  <div className="flex items-center gap-2 my-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadge[task.status] || "bg-gray-100 text-gray-700"}`}>{task.status}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-800">{task.priority || "medium"}</span>
                  </div>
                  <p className="text-sm">Owner: {task.owner || "Unassigned"}</p>
                  <p className="text-sm mb-2">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "Not set"}</p>
                  <select
                    className="w-full p-2 text-sm rounded text-black"
                    value={task.status}
                    onChange={(e) => updateStatus(task._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  {task.status !== "completed" && (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded mt-2 w-full"
                      onClick={() => completeTask(task._id)}
                    >
                      Mark Complete
                    </button>
                  )}

                  <button
                    className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded mt-2 w-full disabled:opacity-60"
                    onClick={() => generateFollowUp(task._id)}
                    disabled={loadingFollowUpId === task._id}
                  >
                    {loadingFollowUpId === task._id ? "Generating..." : "Generate Follow-Up"}
                  </button>

                  {followUpMap[task._id] && (
                    <div className="mt-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-2 whitespace-pre-wrap">
                      {followUpMap[task._id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

export default Dashboard;