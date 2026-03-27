require('dotenv').config();
const mongoose = require('mongoose');
const Draw = require('./server/models/Draw');
const connectDB = require('./server/config/db');

const seedDraw = async () => {
  try {
    await connectDB();
    await Draw.deleteMany(); // Reset draws

    const newDraw = await Draw.create({
      month: 'April 2026',
      prize: '$1,000 Cash Prize',
      isActive: true
    });

    console.log(`✅ Active Draw seeded successfully: ${newDraw.month}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding draw:', error);
    process.exit(1);
  }
};

seedDraw();
