 const cors = require('cors');
const express = require('express');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

module.exports = {
  cors: cors(),
  json: express.json(),
  errorHandler,
  notFoundHandler,
  requestLogger
}; 