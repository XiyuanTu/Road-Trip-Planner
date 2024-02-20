const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  hashPassword: {
    type: String,
    required: true,
  },
  logEntries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LogEntry',
  }],
});

userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.hashPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
