require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Homepage
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Store shortened URLs
const urls = [];
let nextId = 1;

// Create a short URL
app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;

  // Validate URL
  try {
    const url = new URL(originalUrl);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  // Check if URL already exists
  const existingUrl = urls.find(function (item) {
    return item.original_url === originalUrl;
  });

  if (existingUrl) {
    return res.json(existingUrl);
  }

  // Create short URL
  const urlData = {
    original_url: originalUrl,
    short_url: nextId
  };

  nextId++;

  urls.push(urlData);

  res.json(urlData);
});

// Redirect to original URL
app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = parseInt(req.params.short_url);

  const urlData = urls.find(function (item) {
    return item.short_url === shortUrl;
  });

  if (!urlData) {
    return res.json({
      error: 'No short URL found for the given input'
    });
  }

  res.redirect(urlData.original_url);
});

// Start server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});