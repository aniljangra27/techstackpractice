const pool = require('../config/database');

const userController = {
  // CREATE - Add a new user
  createUser: async (req, res) => {
    try {
      const { name, email, age } = req.body;
      
      // Input validation
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const query = 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING *';
      const values = [name, email, age];
      
      const result = await pool.query(query, values);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  // READ - Get all users
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      
      const query = 'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const countQuery = 'SELECT COUNT(*) FROM users';
      
      const [result, countResult] = await Promise.all([
        pool.query(query, [limit, offset]),
        pool.query(countQuery)
      ]);
      
      const totalUsers = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalUsers / limit);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // READ - Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // UPDATE - Update user by ID
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, age } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Check if user exists
      const checkQuery = 'SELECT * FROM users WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      
      if (email !== undefined) {
        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }
      
      if (age !== undefined) {
        updates.push(`age = $${paramCount}`);
        values.push(age);
        paramCount++;
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      values.push(id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      
      const result = await pool.query(query, values);
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  // DELETE - Delete user by ID
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        message: 'User deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = userController; 