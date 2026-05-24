const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      enum: ['Physics', 'Chemistry', 'Botany', 'Zoology'],
      required: true,
    },
    chapter: {
      type: String,
      required: true,
      trim: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    optionA: {
      type: String,
      required: true,
    },
    optionB: {
      type: String,
      required: true,
    },
    optionC: {
      type: String,
      required: true,
    },
    optionD: {
      type: String,
      required: true,
    },
    correctOption: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
questionSchema.index({ subject: 1, chapter: 1 });
questionSchema.index({ subject: 1, difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
