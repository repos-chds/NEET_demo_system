const { User, Batch } = require('../models');
const generatePassword = require('../utils/generatePassword');

class StudentService {
  /**
   * Create a new student with auto-generated password
   */
  static async createStudent({ name, batchId, teacherId }) {
    // Verify batch belongs to this teacher
    if (batchId) {
      const batch = await Batch.findOne({ _id: batchId, teacher: teacherId });
      if (!batch) {
        throw Object.assign(new Error('Batch not found.'), { statusCode: 404 });
      }
    }

    // Generate unique username from name
    const baseUsername = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const plainPassword = generatePassword();

    const student = await User.create({
      name,
      username,
      password: plainPassword,
      plainPassword,
      role: 'student',
      batch: batchId || undefined,
      createdBy: teacherId,
    });

    return {
      ...student.toJSON(),
      plainPassword,
      username,
    };
  }

  /**
   * Get all students for a teacher, optionally filtered by batch
   */
  static async getStudents(teacherId, { batchId, search, page = 1, limit = 50 }) {
    const query = { role: 'student', createdBy: teacherId, isActive: true };

    if (batchId) query.batch = batchId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      User.find(query)
        .select('+plainPassword')
        .populate('batch', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return {
      students: students.map((s) => {
        const obj = s.toObject();
        // Include plainPassword for teacher view
        return {
          _id: obj._id,
          name: obj.name,
          username: obj.username,
          plainPassword: obj.plainPassword,
          batch: obj.batch,
          isActive: obj.isActive,
          createdAt: obj.createdAt,
        };
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get student credentials
   */
  static async getCredentials(studentId, teacherId) {
    const student = await User.findOne({
      _id: studentId,
      createdBy: teacherId,
      role: 'student',
    }).select('+plainPassword');

    if (!student) {
      throw Object.assign(new Error('Student not found.'), { statusCode: 404 });
    }

    return {
      name: student.name,
      username: student.username,
      plainPassword: student.plainPassword,
    };
  }

  /**
   * Update student
   */
  static async updateStudent(studentId, teacherId, updates) {
    const student = await User.findOne({
      _id: studentId,
      createdBy: teacherId,
      role: 'student',
    });

    if (!student) {
      throw Object.assign(new Error('Student not found.'), { statusCode: 404 });
    }

    if (updates.name) student.name = updates.name;
    if (updates.batchId !== undefined) student.batch = updates.batchId || undefined;

    await student.save();
    return student.toJSON();
  }

  /**
   * Deactivate student (soft delete)
   */
  static async deactivateStudent(studentId, teacherId) {
    const student = await User.findOneAndUpdate(
      { _id: studentId, createdBy: teacherId, role: 'student' },
      { isActive: false },
      { new: true }
    );

    if (!student) {
      throw Object.assign(new Error('Student not found.'), { statusCode: 404 });
    }

    return student.toJSON();
  }
}

module.exports = StudentService;
