const User = require("../models/User");

const allowRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Access denied for this role" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
};

module.exports = { allowRoles };