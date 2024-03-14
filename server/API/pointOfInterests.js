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
      user.pointOfInterests.push(pointOfInterest);
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
      user.pointOfInterests = user.pointOfInterests.filter((entry) => entry.toString() !== entryId);
      await user.save();
    }

    res.json({ message: 'delete successful!' });
  } catch (error) {
    next(error);
  }
});

// eslint-disable-next-line consistent-return
router.put('/:entryId', isAuthenticated, async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const pointOfInterest = await PointOfInterest.findById(entryId);

    if (!pointOfInterest) {
      return res.status(404).json({ message: 'Point of Interest not found' });
    }

    if (pointOfInterest.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this Point of Interest' });
    }

    pointOfInterest.title = title;
    const updatedEntry = await pointOfInterest.save();
    res.json(updatedEntry);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(422);
    }
    next(error);
  }
});

module.exports = router;
