import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import toast from "react-hot-toast";

function Insights() {
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [execution, setExecution] = useState(null);

  const loadInsights = async () => {
    try {
      const [dashboardRes, insightsRes] = await Promise.all([
        API.get("/analytics/dashboard"),
        API.get("/ai/insights")
      ]);
      setMetrics(dashboardRes.data.metrics || null);
      setExecution(dashboardRes.data.execution || null);
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
          <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Meetings</p><p className="text-2xl font-bold dark:text-white">{metrics.totalMeetings}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Tasks</p><p className="text-2xl font-bold dark:text-white">{metrics.totalTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold dark:text-white">{metrics.completedTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold dark:text-white">{metrics.pendingTasks}</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Completion Rate</p><p className="text-2xl font-bold dark:text-white">{metrics.completionRate}%</p></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"><p className="text-xs text-gray-500">Meeting ROI</p><p className="text-2xl font-bold dark:text-white">{metrics.meetingEffectiveness ?? 0}%</p></div>
          </section>
        )}

        {execution && (
          <section className="grid lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-2 dark:text-white">Risk Detection</h2>
              <p className="text-sm text-gray-500 mb-2">High-risk tasks and overdue work.</p>
              <div className="space-y-2 max-h-72 overflow-auto">
                {execution.riskTasks?.length ? execution.riskTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                    <p className="font-medium text-rose-900">{task.title}</p>
                    <p className="text-rose-700">Risk: {task.riskScore}</p>
                    <p className="text-rose-700">Owner: {task.owner}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">No high-risk tasks.</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-2 dark:text-white">Workload</h2>
              <div className="space-y-2 max-h-72 overflow-auto">
                {execution.overloadedPeople?.length ? execution.overloadedPeople.map((person) => (
                  <div key={person.name} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="font-medium text-amber-900">{person.name}</p>
                    <p className="text-amber-700">Tasks: {person.total}</p>
                    <p className="text-amber-700">Overdue: {person.overdue}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">No overloaded people detected.</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold mb-2 dark:text-white">Bottlenecks</h2>
              <div className="space-y-2 max-h-72 overflow-auto">
                {execution.bottlenecks?.length ? execution.bottlenecks.slice(0, 4).map((task) => (
                  <div key={task.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                    <p className="font-medium text-blue-900">{task.title}</p>
                    <p className="text-blue-700">Meeting: {task.meetingTitle || "N/A"}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">No bottlenecks detected.</p>}
              </div>
            </div>
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
