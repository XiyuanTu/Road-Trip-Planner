const mongoose = require('mongoose');
const { Schema } = mongoose;

const requiredNumber = {
  type: Number,
  required: true,
};

const pointOfInterestSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  place_type: {
    type: String,
    required: true,
    enum: ['address', 'poi'],
  },
  address: String,
  latitude: {
    ...requiredNumber,
    min: -90,
    max: 90,
  },
  longitude: {
    ...requiredNumber,
    min: -180,
    max: 180,
  },
  id: {
    type: String,
  },
  relevance: {
    type: Number,
    default: 1,
  },
  category: {
    type: String,
    default: '',
  },
  landmark: {
    type: Boolean,
    default: false,
  },
  wikidata: {
    type: String,
    default: '',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const PointOfInterest = mongoose.model('PointOfInterest', pointOfInterestSchema);

module.exports = PointOfInterest;
