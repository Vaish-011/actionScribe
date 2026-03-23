const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { ensureUserOrganization } = require("../services/organizationBootstrapService");

const buildTokenAndUserResponse = (user) => {
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization
    }
  };
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    await ensureUserOrganization(user);

    res.status(201).json({
      message: "User created successfully",
      ...buildTokenAndUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Use Google login for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    await ensureUserOrganization(user);

    res.json(buildTokenAndUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const isGoogleConfigured = () => Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

exports.googleAuth = (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      error: "Google login is not configured on the server"
    });
  }
  return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

exports.googleAuthCallback = (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      error: "Google login is not configured on the server"
    });
  }

  passport.authenticate("google", { session: false }, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: "Google authentication failed" });
    }

    ensureUserOrganization(user)
      .then((updatedUser) => {
        const payload = buildTokenAndUserResponse(updatedUser);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/auth/callback?token=${payload.token}`);
      })
      .catch((bootstrapError) => {
        return res.status(500).json({ error: bootstrapError.message });
      });
  })(req, res, next);
};