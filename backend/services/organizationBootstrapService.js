const Organization = require("../models/Organization");
const User = require("../models/User");

const ensureUserOrganization = async (user) => {
  if (!user) {
    return null;
  }

  if (user.organization) {
    return user;
  }

  const safeName = user.name?.trim() || user.email?.split("@")[0] || "Workspace";
  const organization = await Organization.create({
    name: `${safeName}'s Workspace`,
    createdBy: user._id,
    members: [
      {
        user: user._id,
        role: "admin",
        joinedAt: new Date()
      }
    ]
  });

  user.organization = organization._id;
  user.role = user.role || "admin";
  await user.save();

  return user;
};

const ensureUserOrganizationById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  return ensureUserOrganization(user);
};

module.exports = {
  ensureUserOrganization,
  ensureUserOrganizationById
};