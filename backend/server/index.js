require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const drawRoutes = require('./routes/drawRoutes');
const winnerRoutes = require('./routes/winnerRoutes');
const charityRoutes = require('./routes/charityRoutes');
const { seedAdmin } = require('./services/adminSeeder');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/draw', drawRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/charities', charityRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    const seedResult = await seedAdmin();
    console.log(`[admin-seeder] ${seedResult.message}`);
  } catch (error) {
    console.error(`[admin-seeder] ${error.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap();
