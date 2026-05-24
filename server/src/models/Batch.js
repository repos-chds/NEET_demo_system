const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for student count
batchSchema.virtual('studentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'batch',
  count: true,
});

const Batch = mongoose.model('Batch', batchSchema);

module.exports = Batch;
