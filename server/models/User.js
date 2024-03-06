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
  email: {
    type : String,
    required : true,
    unique: true,
  },
  pointOfInterests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PointOfInterest',
  }],
});

userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.hashPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
