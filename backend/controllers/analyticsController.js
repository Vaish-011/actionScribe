const Meeting = require("../models/Meeting");
const Task = require("../models/Task");
const { ensureUserOrganizationById } = require("../services/organizationBootstrapService");

exports.getTeamDashboard = async (req, res) => {
  try {
    const user = await ensureUserOrganizationById(req.userId);
    if (!user || !user.organization) {
      return res.status(400).json({ error: "User must belong to an organization" });
    }

    const organization = user.organization;

    const [totalMeetings, totalTasks, completedTasks, pendingTasks, tasks] = await Promise.all([
      Meeting.countDocuments({ organization }),
      Task.countDocuments({ organization }),
      Task.countDocuments({ organization, status: "completed" }),
      Task.countDocuments({ organization, status: { $in: ["pending", "in-progress", "blocked"] } }),
      Task.find({ organization }).populate("assignedTo", "name")
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