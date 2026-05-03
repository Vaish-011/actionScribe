const mongoose = require("mongoose");
const User = require("../models/User");

const getAccessContext = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.organization) {
    return null;
  }

  return {
    user,
    organization: user.organization,
    role: user.role
  };
};

const isPrivilegedRole = (role) => role === "admin" || role === "manager";

const buildMeetingFilter = ({ organization, role, user }, extra = {}) => {
  if (isPrivilegedRole(role)) {
    return { organization, ...extra };
  }

  return {
    organization,
    createdBy: user._id,
    ...extra
  };
};

const buildTaskFilter = ({ organization, role, user }, memberMeetingIds = [], extra = {}) => {
  if (isPrivilegedRole(role)) {
    return { organization, ...extra };
  }

  const meetingIds = memberMeetingIds
    .filter(Boolean)
    .map((id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id)));

  return {
    organization,
    $or: [
      { assignedTo: user._id },
      { meetingId: { $in: meetingIds } }
    ],
    ...extra
  };
};

module.exports = {
  getAccessContext,
  isPrivilegedRole,
  buildMeetingFilter,
  buildTaskFilter
};
