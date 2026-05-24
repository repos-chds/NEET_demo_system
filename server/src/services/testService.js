const { Test, Batch, User, Attempt } = require('../models');
const generateExamCode = require('../utils/generateExamCode');

class TestService {
  /**
   * Create a new test in draft mode
   */
  static async createTest({ name, duration, sections, teacherId }) {
    const test = await Test.create({
      name,
      duration: duration || 200,
      sections: sections || {},
      teacher: teacherId,
      status: 'draft',
    });

    return test;
  }

  /**
   * Update test (only in draft mode)
   */
  static async updateTest(testId, teacherId, updates) {
    const test = await Test.findOne({ _id: testId, teacher: teacherId });

    if (!test) {
      throw Object.assign(new Error('Test not found.'), { statusCode: 404 });
    }

    if (test.status !== 'draft') {
      throw Object.assign(new Error('Cannot edit a published or completed test.'), { statusCode: 400 });
    }

    const allowed = ['name', 'duration', 'sections', 'assignedBatches', 'assignedStudents'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        test[key] = updates[key];
      }
    }

    // Recalculate totalMarks based on questions
    if (updates.sections) {
      let totalQuestions = 0;
      const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
      for (const subj of subjects) {
        if (test.sections[subj]) {
          totalQuestions += (test.sections[subj].sectionA?.length || 0);
          // Section B: only 10 count towards marks even if 15 are present
          totalQuestions += Math.min(test.sections[subj].sectionB?.length || 0, 10);
        }
      }
      test.totalMarks = totalQuestions * 4;
    }

    await test.save();
    return test;
  }

  /**
   * Publish test — generates exam code, sets status to live
   */
  static async publishTest(testId, teacherId) {
    const test = await Test.findOne({ _id: testId, teacher: teacherId });

    if (!test) {
      throw Object.assign(new Error('Test not found.'), { statusCode: 404 });
    }

    if (test.status !== 'draft') {
      throw Object.assign(new Error('Test is already published or completed.'), { statusCode: 400 });
    }

    // Validate that test has questions
    const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
    let totalQ = 0;
    for (const subj of subjects) {
      if (test.sections[subj]) {
        totalQ += (test.sections[subj].sectionA?.length || 0) + (test.sections[subj].sectionB?.length || 0);
      }
    }

    if (totalQ === 0) {
      throw Object.assign(new Error('Cannot publish a test with no questions.'), { statusCode: 400 });
    }

    // Validate assignments
    if ((!test.assignedBatches || test.assignedBatches.length === 0) &&
      (!test.assignedStudents || test.assignedStudents.length === 0)) {
      throw Object.assign(new Error('Please assign at least one batch or student.'), { statusCode: 400 });
    }

    // Generate unique exam code
    let examCode;
    let isUnique = false;
    while (!isUnique) {
      examCode = generateExamCode();
      const existing = await Test.findOne({ examCode });
      if (!existing) isUnique = true;
    }

    test.examCode = examCode;
    test.status = 'live';
    test.publishedAt = new Date();
    await test.save();

    return test;
  }

  /**
   * Complete/end a test
   */
  static async completeTest(testId, teacherId) {
    const test = await Test.findOne({ _id: testId, teacher: teacherId });

    if (!test) {
      throw Object.assign(new Error('Test not found.'), { statusCode: 404 });
    }

    if (test.status !== 'live') {
      throw Object.assign(new Error('Test is not live.'), { statusCode: 400 });
    }

    test.status = 'completed';
    test.completedAt = new Date();
    await test.save();

    // Auto-submit any in-progress attempts
    await Attempt.updateMany(
      { test: testId, status: 'in_progress' },
      { status: 'auto_submitted', submittedAt: new Date() }
    );

    return test;
  }

  /**
   * Get all tests for a teacher
   */
  static async getTests(teacherId, { status, page = 1, limit = 20 }) {
    const query = { teacher: teacherId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      Test.find(query)
        .populate('assignedBatches', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Test.countDocuments(query),
    ]);

    return { tests, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get test details with populated questions
   */
  static async getTestDetails(testId, teacherId) {
    const test = await Test.findOne({ _id: testId, teacher: teacherId })
      .populate('assignedBatches', 'name')
      .populate('assignedStudents', 'name username')
      .populate('sections.Physics.sectionA sections.Physics.sectionB')
      .populate('sections.Chemistry.sectionA sections.Chemistry.sectionB')
      .populate('sections.Botany.sectionA sections.Botany.sectionB')
      .populate('sections.Zoology.sectionA sections.Zoology.sectionB');

    if (!test) {
      throw Object.assign(new Error('Test not found.'), { statusCode: 404 });
    }

    return test;
  }

  /**
   * Get monitoring data for a live test
   */
  static async getMonitoring(testId, teacherId) {
    const test = await Test.findOne({ _id: testId, teacher: teacherId });
    if (!test) {
      throw Object.assign(new Error('Test not found.'), { statusCode: 404 });
    }

    const attempts = await Attempt.find({ test: testId })
      .populate('student', 'name username batch')
      .select('status startedAt submittedAt answers');

    const summary = {
      total: 0,
      joined: 0,
      inProgress: 0,
      submitted: 0,
    };

    // Count eligible students
    let eligibleStudentIds = new Set();

    if (test.assignedStudents?.length > 0) {
      test.assignedStudents.forEach((id) => eligibleStudentIds.add(id.toString()));
    }

    if (test.assignedBatches?.length > 0) {
      const batchStudents = await User.find({
        batch: { $in: test.assignedBatches },
        role: 'student',
        isActive: true,
      }).select('_id');
      batchStudents.forEach((s) => eligibleStudentIds.add(s._id.toString()));
    }

    summary.total = eligibleStudentIds.size;

    const students = attempts.map((a) => {
      if (a.status === 'in_progress') summary.inProgress++;
      else summary.submitted++;
      summary.joined++;

      return {
        _id: a.student?._id,
        name: a.student?.name,
        username: a.student?.username,
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        answeredCount: a.answers ? a.answers.size : 0,
      };
    });

    return {
      test: { _id: test._id, name: test.name, examCode: test.examCode, status: test.status },
      summary,
      students,
    };
  }
}

module.exports = TestService;
