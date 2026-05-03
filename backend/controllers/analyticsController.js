const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const {
  getAccessContext,
  buildMeetingFilter,
  buildTaskFilter
} = require("../services/accessScopeService");

exports.getTeamDashboard = async (req, res) => {
  try {
    const context = await getAccessContext(req.userId);
    if (!context) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const memberMeetingIds = (await Meeting.find(buildMeetingFilter(context)).select("_id"))
      .map((m) => m._id);
    const taskScope = buildTaskFilter(context, memberMeetingIds);

    const [totalMeetings, totalTasks, completedTasks, pendingTasks, tasks] = await Promise.all([
      Meeting.countDocuments(buildMeetingFilter(context)),
      Task.countDocuments(taskScope),
      Task.countDocuments({ ...taskScope, status: "completed" }),
      Task.countDocuments({
        ...taskScope,
        status: { $in: ["pending", "in-progress", "blocked"] }
      }),
      Task.find(taskScope).populate("assignedTo", "name")
    ]);

    const tasksPerMemberMap = {};
    for (const task of tasks) {
      const key = task.assignedTo?.name || task.owner || "Unassigned";
      tasksPerMemberMap[key] = (tasksPerMemberMap[key] || 0) + 1;
    }

    const tasksPerMember = Object.entries(tasksPerMemberMap).map(([name, count]) => ({ name, count }));
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      metrics: {
        totalMeetings,
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate
      },
      charts: {
        tasksPerMember,
        meetingFrequencyHint: "Use meetingDate for time-series visualization"
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};