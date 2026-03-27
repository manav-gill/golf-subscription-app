const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  draw: { type: mongoose.Schema.Types.ObjectId, ref: 'Draw', required: true },
  charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
  amountDonated: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Winner', winnerSchema);
