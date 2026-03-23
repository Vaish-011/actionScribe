import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import CreateMeeting from "../components/CreateMeeting";
import toast from "react-hot-toast";

function Dashboard() {

  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch (error) {
      setTasks([]);
      toast.error(error?.response?.data?.error || "Failed to load tasks");
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

  const completeTask = async (id) => {
    try {
      await API.patch(`/tasks/${id}/complete`);
      fetchTasks();
      fetchMetrics();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update task");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/tasks/${id}/status`, { status });
      fetchTasks();
      fetchMetrics();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update task status");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchMetrics();
  }, []);

  const groupedTasks = {
    pending: tasks.filter((task) => task.status === "pending"),
    "in-progress": tasks.filter((task) => task.status === "in-progress"),
    completed: tasks.filter((task) => task.status === "completed"),
    blocked: tasks.filter((task) => task.status === "blocked")
  };


  
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">

      <Navbar />

      <div className="max-w-4xl mx-auto p-6">

        <CreateMeeting refresh={fetchTasks} />

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded p-3 shadow"><p className="text-xs">Meetings</p><p className="text-xl font-bold">{metrics.totalMeetings}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 shadow"><p className="text-xs">Tasks</p><p className="text-xl font-bold">{metrics.totalTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 shadow"><p className="text-xs">Done</p><p className="text-xl font-bold">{metrics.completedTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 shadow"><p className="text-xs">Pending</p><p className="text-xl font-bold">{metrics.pendingTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded p-3 shadow"><p className="text-xs">Completion</p><p className="text-xl font-bold">{metrics.completionRate}%</p></div>
          </div>
        )}

        <h2 className="text-xl dark:text-white font-bold mt-6 mb-3">
          Task Board
        </h2>

        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <div key={status} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 dark:text-white">{status}</h3>
              {statusTasks.map((task) => (
                <div key={task._id} className="bg-white dark:bg-gray-700 text-black dark:text-white shadow p-3 mb-3 rounded">
                  <p className="font-semibold">{task.title || task.task}</p>
                  <p className="text-sm">Owner: {task.owner || "Unassigned"}</p>
                  <p className="text-sm">Priority: {task.priority || "medium"}</p>
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