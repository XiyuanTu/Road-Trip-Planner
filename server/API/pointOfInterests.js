const { Router } = require('express');

const PointOfInterest = require('../models/PointOfInterest');
const User = require('../models/User');

const { isAuthenticated } = require('../middlewares');

const router = Router();

router.get('/', isAuthenticated, async (req, res, next) => {
  try {
    const entries = await PointOfInterest.find({ user: req.user.id });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

router.post('/', isAuthenticated, async (req, res, next) => {
  try {
    const pointOfInterest = new PointOfInterest({
      ...req.body,
      user: req.user.id,
    });
    const createdEntry = await pointOfInterest.save();

    const user = await User.findById(pointOfInterest.user);
    if (user) {
      user.logEntries.push(pointOfInterest);
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
    await PointOfInterest.findByIdAndDelete(entryId);

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
