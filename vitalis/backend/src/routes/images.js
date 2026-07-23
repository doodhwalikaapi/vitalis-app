const express = require('express');
const { query, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { searchUnsplashImage } = require('../utils/unsplash');

const router = express.Router();
router.use(requireAuth);

router.get('/search', [query('q').trim().isLength({ min: 1, max: 100 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const image = await searchUnsplashImage(req.query.q);
  // image is null when no UNSPLASH_ACCESS_KEY is configured or nothing was
  // found - the frontend treats that as "use the illustration fallback".
  res.json({ image });
});

module.exports = router;
