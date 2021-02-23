const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 20,
  },
  password: String,
  createdBy: String,
  description: {
    type: String,
    maxlength: 120,
    required: true,
  },
  tags: {
    type: [String],
    maxlength: 4,
  },
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
