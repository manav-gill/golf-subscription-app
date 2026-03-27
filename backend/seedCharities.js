require('dotenv').config();
const mongoose = require('mongoose');
const Charity = require('./server/models/Charity');
const connectDB = require('./server/config/db');

const charities = [
  {
    name: 'First Tee',
    description: 'Impacting the lives of young people by providing educational programs that build character through the game of golf.',
    isActive: true
  },
  {
    name: 'Make-A-Wish Foundation',
    description: 'Granting life-changing wishes for children with critical illnesses.',
    isActive: true
  },
  {
    name: 'St. Jude Children\'s Research Hospital',
    description: 'Leading the way the world understands, treats and defeats childhood cancer and other life-threatening diseases.',
    isActive: true
  },
  {
    name: 'Local Food Bank',
    description: 'Providing meals and fighting hunger in our local communities.',
    isActive: true
  }
];

const seedCharities = async () => {
  try {
    await connectDB();
    await Charity.deleteMany();
    await Charity.insertMany(charities);
    console.log('✅ Charities seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding charities:', error);
    process.exit(1);
  }
};

seedCharities();
