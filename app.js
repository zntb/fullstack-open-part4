const config = require('./utils/config');
const express = require('express');
require('express-async-errors');
const app = express();
const blogsRouter = require('./controllers/blogs');
const middleware = require('./utils/middleware');
const logger = require('./utils/logger');

const mongoose = require('mongoose');

mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => logger.info('Connected to MongoDB'))
  .catch((error) =>
    logger.error('Error connecting to MongoDB:', error.message)
  );

app.use(middleware.cors);
app.use(middleware.jsonParser);

app.use('/api/blogs', blogsRouter);

module.exports = app;
