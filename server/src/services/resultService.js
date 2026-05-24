const { Attempt, Test, Question } = require('../models');

class ResultService {
  /**
   * Get leaderboard for a test
   */
  static async getTestResults(testId, teacherId) {
    const test = await Test.findOne({ _id: testId, teacher: teacherId });
    if (!test) {
      throw Object.assign(new Error('Test not found.'), { statusCode: 404 });
    }

    const attempts = await Attempt.find({
      test: testId,
      status: { $in: ['submitted', 'auto_submitted'] },
    })
      .populate('student', 'name username batch')
      .populate({
        path: 'student',
        populate: { path: 'batch', select: 'name' },
      })
      .sort({ score: -1 });

    const leaderboard = attempts.map((a, index) => ({
      rank: index + 1,
      studentName: a.student?.name,
      username: a.student?.username,
      batchName: a.student?.batch?.name || 'N/A',
      score: a.score,
      totalCorrect: a.totalCorrect,
      totalIncorrect: a.totalIncorrect,
      totalUnattempted: a.totalUnattempted,
      subjectWise: a.subjectWise,
      submittedAt: a.submittedAt,
      status: a.status,
    }));

    return {
      test: { _id: test._id, name: test.name, totalMarks: test.totalMarks },
      leaderboard,
      totalAttempts: leaderboard.length,
    };
  }

  /**
   * Get detailed result for a single attempt (with answer review)
   */
  static async getAttemptResult(attemptId, userId, role) {
    const attempt = await Attempt.findById(attemptId)
      .populate('student', 'name username')
      .populate({
        path: 'test',
        populate: {
          path: 'sections.Physics.sectionA sections.Physics.sectionB sections.Chemistry.sectionA sections.Chemistry.sectionB sections.Botany.sectionA sections.Botany.sectionB sections.Zoology.sectionA sections.Zoology.sectionB',
        },
      });

    if (!attempt) {
      throw Object.assign(new Error('Attempt not found.'), { statusCode: 404 });
    }

    // Authorization: student can only view their own, teacher can view any from their tests
    if (role === 'student' && attempt.student._id.toString() !== userId.toString()) {
      throw Object.assign(new Error('Forbidden.'), { statusCode: 403 });
    }

    if (role === 'teacher' && attempt.test.teacher.toString() !== userId.toString()) {
      throw Object.assign(new Error('Forbidden.'), { statusCode: 403 });
    }

    // Only show results if submitted
    if (attempt.status === 'in_progress') {
      throw Object.assign(new Error('Test is still in progress.'), { statusCode: 400 });
    }

    return attempt;
  }

  /**
   * Get analytics for a test (subject-wise averages, distributions)
   */
  static async getTestAnalytics(testId, teacherId) {
    const test = await Test.findOne({ _id: testId, teacher: teacherId });
    if (!test) {
      throw Object.assign(new Error('Test not found.'), { statusCode: 404 });
    }

    const attempts = await Attempt.find({
      test: testId,
      status: { $in: ['submitted', 'auto_submitted'] },
    });

    if (attempts.length === 0) {
      return {
        test: { _id: test._id, name: test.name, totalMarks: test.totalMarks },
        totalStudents: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        subjectAverages: {},
        scoreDistribution: [],
      };
    }

    const scores = attempts.map((a) => a.score);
    const totalStudents = scores.length;
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalStudents);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Subject-wise averages
    const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
    const subjectAverages = {};
    for (const subj of subjects) {
      const subjScores = attempts
        .map((a) => a.subjectWise?.[subj]?.score || 0);
      subjectAverages[subj] = {
        average: Math.round(subjScores.reduce((a, b) => a + b, 0) / totalStudents),
        highest: Math.max(...subjScores),
        lowest: Math.min(...subjScores),
      };
    }

    // Score distribution (buckets of 50)
    const buckets = {};
    for (let i = -50; i <= 720; i += 50) {
      buckets[`${i}-${i + 49}`] = 0;
    }
    for (const score of scores) {
      const bucket = Math.floor(score / 50) * 50;
      const key = `${bucket}-${bucket + 49}`;
      if (buckets[key] !== undefined) buckets[key]++;
    }
    const scoreDistribution = Object.entries(buckets)
      .filter(([, count]) => count > 0)
      .map(([range, count]) => ({ range, count }));

    return {
      test: { _id: test._id, name: test.name, totalMarks: test.totalMarks },
      totalStudents,
      averageScore,
      highestScore,
      lowestScore,
      subjectAverages,
      scoreDistribution,
    };
  }
}

module.exports = ResultService;
