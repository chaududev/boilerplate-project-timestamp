const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI);

// User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

// Exercise schema
const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: String,
  duration: Number,
  date: String
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Home
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ==========================
// POST /api/users
// ==========================

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username
    });

    res.json({
      username: user.username,
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET /api/users
// ==========================

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
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// POST /api/users/:_id/exercises
// ==========================

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if (!user) {
      return res.json({
        error: 'User not found'
      });
    }

    const date = req.body.date
      ? new Date(req.body.date)
      : new Date();

    const exercise = await Exercise.create({
      userId: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date.toDateString()
    });

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// GET /api/users/:_id/logs
// ==========================

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if (!user) {
      return res.json({
        error: 'User not found'
      });
    }

    const exercises = await Exercise.find({
      userId: user._id
    });

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
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// Start server
// ==========================

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Your app is listening on port ' +
    listener.address().port
  );
});