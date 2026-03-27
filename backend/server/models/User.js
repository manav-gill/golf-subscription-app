const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  charity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', default: null },
  contribution_percentage: { type: Number, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
