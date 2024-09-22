const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const videoRoutes = require('./routes/videos');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  }));
app.use(express.json());
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    sequelize.sync().then(() => {
      app.listen(process.env.PORT || 5000, () => {
        console.log('Server is running on port 5000');
      });
    }).catch((err) => {
      console.error('Error syncing database:', err);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
