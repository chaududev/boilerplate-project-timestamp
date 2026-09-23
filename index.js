require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Parse form data
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Store URLs
const urls = [];
let nextId = 1;

// Create short URL
app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;

  // Validate URL
  const urlPattern = /^https?:\/\/www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;

  if (!urlPattern.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const existingUrl = urls.find(item => item.original_url === originalUrl);

  if (existingUrl) {
    return res.json(existingUrl);
  }

  const urlData = {
    original_url: originalUrl,
    short_url: nextId++
  };

  urls.push(urlData);

  res.json(urlData);
});

// Redirect to original URL
app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = Number(req.params.short_url);

  const urlData = urls.find(item => item.short_url === shortUrl);

  if (!urlData) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(urlData.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});