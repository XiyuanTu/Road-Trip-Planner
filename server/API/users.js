const { Router } = require('express');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LogEntry = require('../models/LogEntry');

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'User not found, please register.' });
    }

    const validatePassword = await user.isValidPassword(password);
    if (!validatePassword) {
      return res.status(401).json({ message: 'Invalid password!' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '2400h' },
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, hashPassword: hashedPassword });
    const registeredUser = await newUser.save();
    res.json(registeredUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await LogEntry.deleteMany({ user: userId });

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User and associated log entries deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-hashPassword');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error finding users' });
  }
});

module.exports = router;
