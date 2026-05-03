const Organization = require("../models/Organization");
const User = require("../models/User");

const validRoles = new Set(["admin", "manager", "member"]);

exports.createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;

    const organization = new Organization({
      name,
      description,
      createdBy: req.userId,
      members: [{
        user: req.userId,
        role: "admin",
        joinedAt: new Date()
      }]
    });

    await organization.save();

    // Update user with organization
    await User.findByIdAndUpdate(req.userId, {
      organization: organization._id,
      role: "admin"
    });

    res.status(201).json({
      message: "Organization created successfully",
      organization
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Workspace name is required" });
    }

    const user = await User.findById(req.userId);
    if (!user || !user.organization) {
      return res.status(400).json({ error: "User not part of any organization" });
    }

    const organization = await Organization.findById(user.organization);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const memberInfo = organization.members.find((m) => m.user.toString() === req.userId);
    if (!memberInfo || memberInfo.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update workspace settings" });
    }

    organization.name = name.trim();
    if (typeof description === "string") {
      organization.description = description;
    }

    await organization.save();

    res.json({
      message: "Workspace updated successfully",
      organization
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrganization = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.organization) {
      return res.status(400).json({ error: "User not part of any organization" });
    }

    const organization = await Organization.findById(user.organization)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json(organization);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const inviteRole = role || "member";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!validRoles.has(inviteRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findById(req.userId);
    if (!user || !user.organization) {
      return res.status(400).json({ error: "User not part of any organization" });
    }

    const organization = await Organization.findById(user.organization);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Check if user is admin
    const memberInfo = organization.members.find(m => m.user.toString() === req.userId);
    if (!memberInfo || memberInfo.role !== "admin") {
      return res.status(403).json({ error: "Only admins can invite members" });
    }

    // Check if user already exists
    let invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      // Create user with invitation
      invitedUser = new User({
        name: email.split('@')[0], // temporary name
        email,
        organization: organization._id,
        role: inviteRole
      });
      await invitedUser.save();
    } else {
      if (
        invitedUser.organization &&
        invitedUser.organization.toString() !== organization._id.toString()
      ) {
        return res.status(409).json({
          error: "User already belongs to another organization"
        });
      }

      // Update existing user in the same organization (or no organization yet)
      invitedUser.organization = organization._id;
      invitedUser.role = inviteRole;
      await invitedUser.save();
    }

    const existingMember = organization.members.find(
      (m) => m.user.toString() === invitedUser._id.toString()
    );

    if (existingMember) {
      existingMember.role = inviteRole;
      if (!existingMember.joinedAt) {
        existingMember.joinedAt = new Date();
      }
    } else {
      organization.members.push({
        user: invitedUser._id,
        role: inviteRole,
        joinedAt: new Date()
      });
    }

    await organization.save();

    res.json({
      message: "Member invited successfully",
      organization
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { memberId, role } = req.body;

    if (!validRoles.has(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findById(req.userId);
    if (!user || !user.organization) {
      return res.status(400).json({ error: "User not part of any organization" });
    }

    const organization = await Organization.findById(user.organization);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Check if user is admin
    const memberInfo = organization.members.find(m => m.user.toString() === req.userId);
    if (!memberInfo || memberInfo.role !== "admin") {
      return res.status(403).json({ error: "Only admins can update roles" });
    }

    // Update member role
    const memberToUpdate = organization.members.find(m => m.user.toString() === memberId);
    if (!memberToUpdate) {
      return res.status(404).json({ error: "Member not found in organization" });
    }

    memberToUpdate.role = role;
    await organization.save();

    // Update user role
    await User.findByIdAndUpdate(memberId, { role });

    res.json({
      message: "Member role updated successfully",
      organization
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({ error: "Member id is required" });
    }

    const user = await User.findById(req.userId);
    if (!user || !user.organization) {
      return res.status(400).json({ error: "User not part of any organization" });
    }

    const organization = await Organization.findById(user.organization);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const memberInfo = organization.members.find((m) => m.user.toString() === req.userId);
    if (!memberInfo || memberInfo.role !== "admin") {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    if (memberId === req.userId) {
      return res.status(400).json({ error: "You cannot remove yourself from the workspace" });
    }

    const memberToRemoveIndex = organization.members.findIndex(
      (m) => m.user.toString() === memberId
    );

    if (memberToRemoveIndex === -1) {
      return res.status(404).json({ error: "Member not found in organization" });
    }

    organization.members.splice(memberToRemoveIndex, 1);
    await organization.save();

    await User.findByIdAndUpdate(memberId, {
      organization: null,
      role: "member"
    });

    res.json({
      message: "Member removed successfully",
      organization
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};