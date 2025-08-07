const express = require('express');
const path = require('path');
require('dotenv').config();

// Import modules
const pool = require('./config/database');
const middleware = require('./middleware');
const userRoutes = require('./routes/users');
const slidesRoutes = require('./routes/slides');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Apply middleware
app.use(middleware.cors);
app.use(middleware.json);
app.use(middleware.requestLogger);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/slides', slidesRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Neon DB CRUD API',
    endpoints: {
      'POST /api/users': 'Create a new user',
      'GET /api/users': 'Get all users (with pagination)',
      'GET /api/users/:id': 'Get user by ID',
      'PUT /api/users/:id': 'Update user by ID',
      'DELETE /api/users/:id': 'Delete user by ID',
      'GET /api/health': 'Health check'
    }
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the auth callback page
app.get('/auth/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-callback.html'));
});

// Apply error handling middleware
app.use(middleware.errorHandler);
app.use(middleware.notFoundHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Web UI: http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
}); 