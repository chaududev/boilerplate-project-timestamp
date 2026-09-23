const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// =========================
// MongoDB
// =========================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// =========================
// Schemas
// =========================

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// =========================
// Frontend
// =========================

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// =========================
// POST /api/users
// Create user
// =========================

app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    const user = await User.create({
      username
    });

    res.json({
      username: user.username,
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// GET /api/users
// Get all users
// =========================

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();

    res.json(
      users.map(user => ({
        username: user.username,
        _id: user._id
      }))
    );
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// POST /api/users/:_id/exercises
// Add exercise
// =========================

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const exerciseDate = date
      ? new Date(date)
      : new Date();

    if (isNaN(exerciseDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date'
      });
    }

    const exercise = await Exercise.create({
      username: user.username,
      description,
      duration: Number(duration),
      date: exerciseDate.toDateString()
    });

    res.json({
      username: user.username,
      _id: user._id,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// GET /api/users/:_id/logs
// Get exercise log
// =========================

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const query = {
      username: user.username
    };

    let exercises = await Exercise.find(query);

    // =========================
    // Filter by from
    // =========================

    if (from) {
      const fromDate = new Date(from);

      exercises = exercises.filter(exercise => {
        return new Date(exercise.date) >= fromDate;
      });
    }

    // =========================
    // Filter by to
    // =========================

    if (to) {
      const toDate = new Date(to);

      exercises = exercises.filter(exercise => {
        return new Date(exercise.date) <= toDate;
      });
    }

    // =========================
    // Limit
    // =========================

    if (limit) {
      exercises = exercises.slice(0, Number(limit));
    }

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      }))
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// Start server
// =========================

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Your app is listening on port ' +
    listener.address().port
  );
});