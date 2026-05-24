/**
 * Seed script to create a default teacher account
 * Run: node scripts/seedTeacher.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../src/models/User');

const TEACHER = {
  name: 'Admin Teacher',
  email: 'teacher@neet.com',
  password: 'teacher123',
  role: 'teacher',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: TEACHER.email });
    if (existing) {
      console.log('⚠️  Teacher account already exists:');
      console.log(`   Email: ${TEACHER.email}`);
      console.log(`   Password: ${TEACHER.password}`);
      process.exit(0);
    }

    await User.create(TEACHER);
    console.log('✅ Teacher account created:');
    console.log(`   Email: ${TEACHER.email}`);
    console.log(`   Password: ${TEACHER.password}`);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
