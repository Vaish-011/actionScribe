import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import toast from "react-hot-toast";

function Insights() {
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState(null);

  const loadInsights = async () => {
    try {
      const [dashboardRes, insightsRes] = await Promise.all([
        API.get("/analytics/dashboard"),
        API.get("/ai/insights")
      ]);
      setMetrics(dashboardRes.data.metrics || null);
      setInsights(insightsRes.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load insights");
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold dark:text-white">AI Insights Center</h1>
          <button onClick={loadInsights} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">Refresh</button>
        </div>

        {metrics && (
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Meetings</p><p className="text-2xl font-bold dark:text-white">{metrics.totalMeetings}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Tasks</p><p className="text-2xl font-bold dark:text-white">{metrics.totalTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold dark:text-white">{metrics.completedTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold dark:text-white">{metrics.pendingTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Completion Rate</p><p className="text-2xl font-bold dark:text-white">{metrics.completionRate}%</p></div>
          </section>
        )}

        <section className="grid lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-2 dark:text-white">Frequent Tasks</h2>
            {insights ? (
              <div className="text-sm dark:text-gray-100">
                <p>Most assigned: <span className="font-medium">{insights?.frequentTasks?.mostAssignedPerson || "N/A"}</span></p>
                <p>Total assignments: {insights?.frequentTasks?.totalAssigned || 0}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold mb-2 dark:text-white">Delayed Tasks</h2>
            {insights?.delayedTasks?.length ? (
              <div className="grid md:grid-cols-2 gap-2">
                {insights.delayedTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                    <p className="font-medium text-rose-900">{task.title}</p>
                    <p className="text-rose-700">Owner: {task.owner || "Unassigned"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No delayed tasks found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Insights;
