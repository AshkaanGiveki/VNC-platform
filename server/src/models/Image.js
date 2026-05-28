/**
 * Image model – predefined container images available on the platform.
 * @module models/Image
 */
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Image name is required'],
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: ['ubuntu', 'chrome', 'firefox', 'onlyoffice', 'custom'],
      default: 'custom',
    },
    version: {
      type: String,
      default: 'latest',
    },
    dockerImage: {
      type: String,
      required: [true, 'Docker image reference is required'],
    },
    iconUrl: {
      type: String,
      default: '',
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly fetch enabled images
imageSchema.index({ isEnabled: 1, type: 1 });

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;