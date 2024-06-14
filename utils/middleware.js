const cors = require('cors');
const express = require('express');

const corsMiddleware = cors();
const jsonParser = express.json();

module.exports = {
  cors: corsMiddleware,
  jsonParser,
};
