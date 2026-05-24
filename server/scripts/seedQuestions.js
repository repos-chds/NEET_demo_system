/**
 * Seed script to populate NEET question bank with sample questions
 * Run: node scripts/seedQuestions.js
 * 
 * Creates 200 questions: 50 per subject (35 Section A + 15 Section B)
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Question = require('../src/models/Question');

// Sample chapters per subject
const CHAPTERS = {
  Physics: [
    'Mechanics', 'Thermodynamics', 'Waves & Oscillations', 'Optics',
    'Electrostatics', 'Current Electricity', 'Magnetism', 'Modern Physics',
    'Semiconductors', 'Communication Systems'
  ],
  Chemistry: [
    'Atomic Structure', 'Chemical Bonding', 'Thermochemistry', 'Equilibrium',
    'Organic Chemistry Basics', 'Hydrocarbons', 'Polymers', 'Electrochemistry',
    'Solutions', 'Coordination Compounds'
  ],
  Botany: [
    'Cell Biology', 'Plant Anatomy', 'Plant Physiology', 'Genetics',
    'Molecular Biology', 'Ecology', 'Plant Kingdom', 'Morphology',
    'Reproduction in Plants', 'Biotechnology'
  ],
  Zoology: [
    'Animal Kingdom', 'Structural Organisation', 'Human Physiology',
    'Reproduction', 'Evolution', 'Human Health & Disease',
    'Microbes in Human Welfare', 'Animal Husbandry',
    'Body Fluids & Circulation', 'Neural Control'
  ],
};

function generateQuestions(subject, chapters) {
  const questions = [];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const options = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < 50; i++) {
    const chapter = chapters[i % chapters.length];
    const difficulty = difficulties[i % 3];
    const correctOption = options[i % 4];
    const qNum = i + 1;

    questions.push({
      subject,
      chapter,
      questionText: `[${subject}] ${chapter} — Question ${qNum}: Which of the following statements about ${chapter.toLowerCase()} is correct?`,
      optionA: `Option A: First possible answer for ${chapter} Q${qNum}`,
      optionB: `Option B: Second possible answer for ${chapter} Q${qNum}`,
      optionC: `Option C: Third possible answer for ${chapter} Q${qNum}`,
      optionD: `Option D: Fourth possible answer for ${chapter} Q${qNum}`,
      correctOption,
      explanation: `The correct answer is ${correctOption}. This is because in ${chapter}, the fundamental principle states that this option correctly describes the phenomenon in question.`,
      difficulty,
      tags: [chapter.toLowerCase(), subject.toLowerCase(), difficulty.toLowerCase()],
    });
  }

  return questions;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingCount = await Question.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Question bank already has ${existingCount} questions.`);
      console.log('   To re-seed, drop the questions collection first.');
      process.exit(0);
    }

    const allQuestions = [];
    for (const [subject, chapters] of Object.entries(CHAPTERS)) {
      const questions = generateQuestions(subject, chapters);
      allQuestions.push(...questions);
      console.log(`📝 Generated ${questions.length} ${subject} questions`);
    }

    await Question.insertMany(allQuestions);
    console.log(`\n✅ Seeded ${allQuestions.length} questions total`);
    console.log('   Physics: 50 | Chemistry: 50 | Botany: 50 | Zoology: 50');
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
