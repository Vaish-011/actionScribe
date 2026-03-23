const Organization = require("../models/Organization");
const User = require("../models/User");

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
        role: role || "member"
      });
      await invitedUser.save();
    } else {
      // Update existing user
      invitedUser.organization = organization._id;
      invitedUser.role = role || "member";
      await invitedUser.save();
    }

    // Add to organization members
    organization.members.push({
      user: invitedUser._id,
      role: role || "member",
      joinedAt: new Date()
    });
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