const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const passport = require("./config/passport");

const app = express();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const taskRoutes = require("./routes/taskRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiFeaturesRoutes = require("./routes/aiFeaturesRoutes");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use("/api", apiLimiter);
app.use("/uploads", express.static("uploads"));
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiFeaturesRoutes);
app.get("/", (req, res) => {
  res.send("AI Meeting Tracker API Running");
});

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");
  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
})
.catch(err => console.log(err));