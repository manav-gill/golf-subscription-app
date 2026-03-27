const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  strokes: { type: Number, required: true },
  courseName: { type: String, required: true },
  datePlayed: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Score', scoreSchema);
