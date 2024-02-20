const { Router } = require('express');

const LogEntry = require('../models/LogEntry');
const User = require('../models/User');

const { isAuthenticated } = require('../middlewares');

const router = Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const entries = await LogEntry.find({ user: req.user.id });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

router.post('/', isAuthenticated, async (req, res, next) => {
  try {
    const logEntry = new LogEntry({
      ...req.body,
      user: req.user.id,
    });
    const createdEntry = await logEntry.save();

    const user = await User.findById(logEntry.user);
    if (user) {
      user.logEntries.push(logEntry);
      await user.save();
    }
    res.json(createdEntry);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(422);
    }
    next(error);
  }
});

router.delete('/:entryId', isAuthenticated, async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const logEntry = await LogEntry.findById(entryId);

    await LogEntry.findByIdAndDelete(entryId);

    const user = await User.findById(req.user.id);
    if (user) {
      user.logEntries = user.logEntries.filter((entry) => entry.toString() !== entryId);
      await user.save();
    }

    res.json({ message: 'delete successful!' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
