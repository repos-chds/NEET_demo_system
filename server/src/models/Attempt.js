const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    selectedOption: {
      type: String,
      enum: ['A', 'B', 'C', 'D', null],
      default: null,
    },
    markedForReview: {
      type: Boolean,
      default: false,
    },
    answeredAt: {
      type: Date,
    },
  },
  { _id: false }
);

const subjectResultSchema = new mongoose.Schema(
  {
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    unattempted: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted'],
      default: 'in_progress',
    },
    // Map of questionId -> answer object
    answers: {
      type: Map,
      of: answerSchema,
      default: new Map(),
    },
    // Section B choices: which 10 of 15 the student selected
    sectionBChoices: {
      Physics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      Chemistry: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      Botany: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      Zoology: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    },
    // Calculated on submission
    score: { type: Number, default: null },
    totalCorrect: { type: Number, default: 0 },
    totalIncorrect: { type: Number, default: 0 },
    totalUnattempted: { type: Number, default: 0 },
    subjectWise: {
      Physics: subjectResultSchema,
      Chemistry: subjectResultSchema,
      Botany: subjectResultSchema,
      Zoology: subjectResultSchema,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: Date,
  },
  {
    timestamps: true,
  }
);

attemptSchema.index({ test: 1, student: 1 }, { unique: true });
attemptSchema.index({ test: 1, status: 1 });

const Attempt = mongoose.model('Attempt', attemptSchema);

module.exports = Attempt;
