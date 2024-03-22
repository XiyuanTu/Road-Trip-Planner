const { Router } = require('express');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PointOfInterest = require('../models/PointOfInterest');

const router = Router();

// eslint-disable-next-line consistent-return
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
      { expiresIn: '30m' },
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// eslint-disable-next-line consistent-return
router.post('/register', async (req, res) => {
  try {
    const {
      username, password, email, invitationCode,
    } = req.body;
    if (invitationCode !== process.env.INVITATION_CODE) {
      return res.status(400).json({ message: 'Invitation code doesn\'t exist.' });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken, please use a different username.' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use, please log in.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, hashPassword: hashedPassword });
    const registeredUser = await newUser.save();
    res.json(registeredUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

// eslint-disable-next-line consistent-return
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await PointOfInterest.deleteMany({ user: userId });

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User and associated log entries deleted successfully' });
  } catch (error) {
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

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error finding user' });
  }
});

router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedFields = req.body;

    if (updatedFields.password) {
      updatedFields.hashPassword = await bcrypt.hash(updatedFields.password, 10);
    }

    await User.findOneAndUpdate({ _id: userId }, updatedFields);
    res.json({ message: 'Successfully updated user' });
  } catch (error) {
    res.status(500).json({ message: 'Error finding user' });
  }
});

module.exports = router;
