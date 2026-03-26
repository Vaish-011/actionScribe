import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import toast from "react-hot-toast";

function Calendar() {
  const [tasks, setTasks] = useState([]);

  const loadTasks = async () => {
    try {
      const res = await API.get("/tasks");
      setTasks(res.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load calendar tasks");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const groupedByDate = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      const key = task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Deadline";
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const sortedKeys = Object.keys(groupedByDate).sort((a, b) => {
    if (a === "No Deadline") return 1;
    if (b === "No Deadline") return -1;
    return new Date(a) - new Date(b);
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Task Calendar</h1>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedKeys.map((date) => (
            <section key={date} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="font-semibold mb-3 dark:text-white">{date}</h2>
              <div className="space-y-2">
                {groupedByDate[date].map((task) => (
                  <div key={task._id} className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-sm dark:text-gray-100">
                    <p className="font-medium">{task.title || task.task}</p>
                    <p>Owner: {task.owner || "Unassigned"}</p>
                    <p>Status: {task.status || "pending"}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {sortedKeys.length === 0 && <p className="text-sm text-gray-500">No tasks found for calendar.</p>}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
