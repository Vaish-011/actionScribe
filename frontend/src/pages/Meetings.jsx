import { useEffect, useMemo, useState } from "react";
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

  const loadMeetings = async () => {
    try {
      const res = await API.get("/meetings");
      setMeetings(res.data || []);
      if (res.data?.length && !selectedMeeting) {
        setSelectedMeeting(res.data[0]);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load meetings");
    }
  };

  const openMeeting = async (meetingId) => {
    try {
      const res = await API.get(`/meetings/${meetingId}`);
      setSelectedMeeting(res.data);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load meeting details");
    }
  };

  const deleteMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to delete this meeting? This action cannot be undone.")) {
      return;
    }

    try {
      await API.delete(`/meetings/${meetingId}`);
      toast.success("Meeting deleted successfully");
      setMeetings(meetings.filter(m => m._id !== meetingId));
      
      // If deleted meeting was selected, clear selection
      if (selectedMeeting?._id === meetingId) {
        setSelectedMeeting(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete meeting");
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const decisions = useMemo(() => selectedMeeting?.decisions || [], [selectedMeeting]);
  const topics = useMemo(() => selectedMeeting?.topics || [], [selectedMeeting]);
  const tasks = useMemo(() => selectedMeeting?.tasks || [], [selectedMeeting]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid lg:grid-cols-3 gap-4">
        <section className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold mb-3 dark:text-white">Meeting History</h2>
          <div className="space-y-2 max-h-[70vh] overflow-auto">
            {meetings.length === 0 && <p className="text-sm text-gray-500">No meetings found.</p>}
            {meetings.map((meeting) => (
              <button
                key={meeting._id}
                onClick={() => openMeeting(meeting._id)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition ${selectedMeeting?._id === meeting._id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-gray-200 dark:border-gray-600"}`}
              >
                <p className="font-semibold dark:text-white">{meeting.title}</p>
                <p className="text-xs text-gray-500">{new Date(meeting.meetingDate || meeting.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          {!selectedMeeting ? (
            <p className="text-sm text-gray-500">Select a meeting to view details.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold dark:text-white">{selectedMeeting.title}</h2>
                  <p className="text-sm text-gray-500">{new Date(selectedMeeting.meetingDate || selectedMeeting.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => deleteMeeting(selectedMeeting._id)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition font-medium"
                >
                  Delete
                </button>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                <h3 className="font-semibold mb-1 dark:text-white">Summary</h3>
                <p className="text-sm dark:text-gray-100 whitespace-pre-wrap">{cleanSummaryText(selectedMeeting.summary) || "No summary available"}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                  <h3 className="font-semibold mb-2 dark:text-white">Decisions</h3>
                  {decisions.length === 0 && <p className="text-sm text-gray-500">No decisions extracted.</p>}
                  <ul className="space-y-2">
                    {decisions.map((decision, index) => (
                      <li key={`${decision.decision}-${index}`} className="text-sm dark:text-gray-100">
                        <span className="font-medium">{decision.decision}</span>
                        {decision.context ? <span className="text-gray-500 dark:text-gray-300"> - {decision.context}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                  <h3 className="font-semibold mb-2 dark:text-white">Topics</h3>
                  {topics.length === 0 && <p className="text-sm text-gray-500">No topics extracted.</p>}
                  <ul className="space-y-2">
                    {topics.map((topic, index) => (
                      <li key={`${topic.title}-${index}`} className="text-sm dark:text-gray-100">
                        <p className="font-medium">{topic.title}</p>
                        <p className="text-gray-500 dark:text-gray-300">{topic.content}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-gray-700 p-3">
                <h3 className="font-semibold mb-2 dark:text-white">Tasks from this Meeting</h3>
                {tasks.length === 0 && <p className="text-sm text-gray-500">No tasks available.</p>}
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm dark:text-gray-100">
                      <p className="font-medium">{task.title || task.task}</p>
                      <p>Owner: {task.owner || "Unassigned"}</p>
                      <p>Status: {task.status || "pending"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Meetings;
