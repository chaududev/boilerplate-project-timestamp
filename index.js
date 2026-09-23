const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// =========================
// MongoDB
// =========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// =========================
// User Schema
// =========================

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', userSchema);

// =========================
// Exercise Schema
// =========================

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// =========================
// Home
// =========================

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// =========================
// POST /api/users
// =========================

app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username;

    if (!username) {
      return res.status(400).json({
        error: 'Username is required'
      });
    }

    const user = await User.create({
      username: username
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
// =========================

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();

    res.json(
      users.map((user) => ({
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
// =========================

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const description = req.body.description;
    const duration = Number(req.body.duration);

    // If date is not provided, use current date
    const exerciseDate = req.body.date
      ? new Date(req.body.date)
      : new Date();

    if (isNaN(exerciseDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date'
      });
    }

    const exercise = await Exercise.create({
      userId: user._id,
      description: description,
      duration: duration,
      date: exerciseDate
    });

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// GET /api/users/:_id/logs
// =========================

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const { from, to, limit } = req.query;

    // Build MongoDB query
    const query = {
      userId: user._id
    };

    // =========================
    // FROM
    // =========================

    if (from) {
      const fromDate = new Date(from);

      query.date = {
        $gte: fromDate
      };
    }

    // =========================
    // TO
    // =========================

    if (to) {
      const toDate = new Date(to);

      // Include the entire "to" date
      toDate.setDate(toDate.getDate() + 1);

      if (query.date) {
        query.date.$lt = toDate;
      } else {
        query.date = {
          $lt: toDate
        };
      }
    }

    // =========================
    // Get exercises
    // =========================

    let exerciseQuery = Exercise.find(query);

    // =========================
    // LIMIT
    // =========================

    if (limit) {
      exerciseQuery = exerciseQuery.limit(Number(limit));
    }

    const exercises = await exerciseQuery;

    // =========================
    // Response
    // =========================

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }))
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// Start Server
// =========================

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(
    'Your app is listening on port ' +
    listener.address().port
  );
});