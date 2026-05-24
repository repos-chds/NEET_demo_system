const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // 35 compulsory
    sectionB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // 15, attempt 10
  },
  { _id: false }
);

const testSchema = new mongoose.Schema(
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
    examCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    duration: {
      type: Number, // in minutes
      default: 200, // 3h 20min NEET standard
    },
    totalMarks: {
      type: Number,
      default: 720, // (35+10)*4 * 4 subjects = 720
    },
    status: {
      type: String,
      enum: ['draft', 'live', 'completed'],
      default: 'draft',
    },
    sections: {
      Physics: sectionSchema,
      Chemistry: sectionSchema,
      Botany: sectionSchema,
      Zoology: sectionSchema,
    },
    assignedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    publishedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

testSchema.index({ teacher: 1, status: 1 });

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
