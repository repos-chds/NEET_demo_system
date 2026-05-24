const { Attempt, Test, Question, User } = require('../models');

class AttemptService {
  /**
   * Join a test via exam code
   */
  static async joinTest(examCode, studentId) {
    const test = await Test.findOne({ examCode, status: 'live' });

    if (!test) {
      throw Object.assign(new Error('Invalid exam code or test is not live.'), { statusCode: 404 });
    }

    // Check if student is assigned to this test
    const student = await User.findById(studentId);
    const isAssignedDirectly = test.assignedStudents?.some(
      (id) => id.toString() === studentId.toString()
    );
    const isInAssignedBatch = student.batch &&
      test.assignedBatches?.some((id) => id.toString() === student.batch.toString());

    if (!isAssignedDirectly && !isInAssignedBatch) {
      throw Object.assign(new Error('You are not assigned to this test.'), { statusCode: 403 });
    }

    // Check if already attempted
    const existingAttempt = await Attempt.findOne({ test: test._id, student: studentId });
    if (existingAttempt) {
      // Allow resuming an in-progress attempt
      if (existingAttempt.status === 'in_progress') {
        return { attempt: existingAttempt, resumed: true };
      }
      throw Object.assign(new Error('You have already submitted this test.'), { statusCode: 409 });
    }

    // Create new attempt
    const attempt = await Attempt.create({
      test: test._id,
      student: studentId,
      status: 'in_progress',
      startedAt: new Date(),
    });

    return { attempt, resumed: false };
  }

  /**
   * Get attempt with questions (no correct answers for student)
   */
  static async getAttempt(attemptId, studentId) {
    const attempt = await Attempt.findOne({ _id: attemptId, student: studentId })
      .populate({
        path: 'test',
        select: 'name duration sections publishedAt',
        populate: {
          path: 'sections.Physics.sectionA sections.Physics.sectionB sections.Chemistry.sectionA sections.Chemistry.sectionB sections.Botany.sectionA sections.Botany.sectionB sections.Zoology.sectionA sections.Zoology.sectionB',
          select: 'subject chapter questionText optionA optionB optionC optionD difficulty imageUrl',
        },
      });

    if (!attempt) {
      throw Object.assign(new Error('Attempt not found.'), { statusCode: 404 });
    }

    return attempt;
  }

  /**
   * Save a single answer
   */
  static async saveAnswer(attemptId, studentId, { questionId, selectedOption, markedForReview }) {
    const attempt = await Attempt.findOne({
      _id: attemptId,
      student: studentId,
      status: 'in_progress',
    });

    if (!attempt) {
      throw Object.assign(new Error('Attempt not found or already submitted.'), { statusCode: 404 });
    }

    // Check timer
    const test = await Test.findById(attempt.test);
    const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000 / 60;
    if (elapsed > test.duration) {
      // Auto-submit
      return AttemptService.submitAttempt(attemptId, studentId, true);
    }

    attempt.answers.set(questionId, {
      selectedOption: selectedOption || null,
      markedForReview: markedForReview || false,
      answeredAt: new Date(),
    });

    await attempt.save();
    return { saved: true };
  }

  /**
   * Save Section B choices for a subject
   */
  static async saveSectionBChoices(attemptId, studentId, { subject, questionIds }) {
    const attempt = await Attempt.findOne({
      _id: attemptId,
      student: studentId,
      status: 'in_progress',
    });

    if (!attempt) {
      throw Object.assign(new Error('Attempt not found or already submitted.'), { statusCode: 404 });
    }

    if (!['Physics', 'Chemistry', 'Botany', 'Zoology'].includes(subject)) {
      throw Object.assign(new Error('Invalid subject.'), { statusCode: 400 });
    }

    if (questionIds.length > 10) {
      throw Object.assign(new Error('Cannot select more than 10 questions from Section B.'), { statusCode: 400 });
    }

    if (!attempt.sectionBChoices) {
      attempt.sectionBChoices = {};
    }
    attempt.sectionBChoices[subject] = questionIds;
    await attempt.save();

    return { saved: true };
  }

  /**
   * Submit attempt and calculate score
   */
  static async submitAttempt(attemptId, studentId, isAutoSubmit = false) {
    const attempt = await Attempt.findOne({
      _id: attemptId,
      student: studentId,
    });

    if (!attempt) {
      throw Object.assign(new Error('Attempt not found.'), { statusCode: 404 });
    }

    if (attempt.status !== 'in_progress') {
      throw Object.assign(new Error('Attempt already submitted.'), { statusCode: 409 });
    }

    // Get test with all questions including correct answers
    const test = await Test.findById(attempt.test)
      .populate('sections.Physics.sectionA sections.Physics.sectionB')
      .populate('sections.Chemistry.sectionA sections.Chemistry.sectionB')
      .populate('sections.Botany.sectionA sections.Botany.sectionB')
      .populate('sections.Zoology.sectionA sections.Zoology.sectionB');

    // Calculate score
    const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
    const subjectWise = {};
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnattempted = 0;
    let totalScore = 0;

    for (const subj of subjects) {
      const result = { correct: 0, incorrect: 0, unattempted: 0, score: 0 };
      const section = test.sections[subj];

      if (!section) {
        subjectWise[subj] = result;
        continue;
      }

      // Section A — all 35 questions count
      const sectionAQuestions = section.sectionA || [];
      for (const q of sectionAQuestions) {
        const answer = attempt.answers.get(q._id.toString());
        if (!answer || !answer.selectedOption) {
          result.unattempted++;
        } else if (answer.selectedOption === q.correctOption) {
          result.correct++;
          result.score += 4;
        } else {
          result.incorrect++;
          result.score -= 1;
        }
      }

      // Section B — only chosen 10 questions count (or all if <= 10)
      const sectionBQuestions = section.sectionB || [];
      const chosenB = attempt.sectionBChoices?.[subj] || [];
      const chosenBIds = new Set(chosenB.map((id) => id.toString()));

      // If no choices made, take first 10
      let bToEvaluate;
      if (chosenBIds.size > 0) {
        bToEvaluate = sectionBQuestions.filter((q) => chosenBIds.has(q._id.toString()));
      } else {
        bToEvaluate = sectionBQuestions.slice(0, 10);
      }

      for (const q of bToEvaluate) {
        const answer = attempt.answers.get(q._id.toString());
        if (!answer || !answer.selectedOption) {
          result.unattempted++;
        } else if (answer.selectedOption === q.correctOption) {
          result.correct++;
          result.score += 4;
        } else {
          result.incorrect++;
          result.score -= 1;
        }
      }

      subjectWise[subj] = result;
      totalCorrect += result.correct;
      totalIncorrect += result.incorrect;
      totalUnattempted += result.unattempted;
      totalScore += result.score;
    }

    attempt.score = totalScore;
    attempt.totalCorrect = totalCorrect;
    attempt.totalIncorrect = totalIncorrect;
    attempt.totalUnattempted = totalUnattempted;
    attempt.subjectWise = subjectWise;
    attempt.status = isAutoSubmit ? 'auto_submitted' : 'submitted';
    attempt.submittedAt = new Date();

    await attempt.save();
    return attempt;
  }
}

module.exports = AttemptService;
