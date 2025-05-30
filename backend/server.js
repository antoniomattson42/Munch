const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const cors = require('cors');

app.use(cors());
app.use(express.json()); // for parsing JSON
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

app.listen(3000, () => console.log('Server listening on port 3000'));