const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/meetings", meetingRoutes);
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