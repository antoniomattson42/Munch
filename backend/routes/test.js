app.get('/test-db', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.send(result.rows[0]);
    } catch (err) {
      res.status(500).send('DB Connection Failed: ' + err.message);
    }
  });
  