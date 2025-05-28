const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection

router.post('/register', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (name) VALUES ($1) RETURNING *',
      [username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
