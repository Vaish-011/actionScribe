const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },

  googleId: {
    type: String,
    sparse: true
  },

  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization"
  },

  role: {
    type: String,
    enum: ["admin", "manager", "member"],
    default: "member"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);