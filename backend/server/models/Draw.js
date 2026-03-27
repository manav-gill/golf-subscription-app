const mongoose = require('mongoose');

const drawSchema = new mongoose.Schema({
  month: { type: String, required: true }, // e.g., "October 2023"
  prize: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Draw', drawSchema);
