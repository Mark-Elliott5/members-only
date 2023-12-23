const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema({
  user: { type: String, required: true },
  date: { type: Date, required: true },
  content: { type: String, required: true },
});

module.exports = mongoose.model('Message', MessageSchema);
