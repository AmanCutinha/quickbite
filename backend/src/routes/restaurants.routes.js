const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all restaurants (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;

    let query = 'SELECT id, name, cuisine, rating, owner_id, created_at FROM restaurants';
    const params = [];
    const conditions = [];

    // Add search filters if provided
    if (search) {
      conditions.push(`name ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    if (category) {
      conditions.push(`cuisine ILIKE $${params.length + 1}`);
      params.push(`%${category}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      message: 'Restaurants retrieved successfully',
      restaurants: result.rows,
      pagination: { limit: parseInt(limit), offset: parseInt(offset), total: result.rowCount }
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to get restaurants' });
  }
});

// Get restaurant by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get restaurant details from database
    const result = await pool.query(
      'SELECT id, name, cuisine, rating, owner_id, created_at FROM restaurants WHERE id = $1', 
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({
      message: 'Restaurant retrieved successfully',
      restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to get restaurant' });
  }
});

// Get restaurant menu items
router.get('/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    // TODO: Get menu items from database
    // const result = await pool.query('SELECT * FROM menu_items WHERE restaurant_id = $1 AND available = true', [id]);

    res.json({
      message: 'Menu retrieved successfully',
      // menuItems: result.rows
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

// Create restaurant (admin/restaurant owner only)
router.post('/', authenticateToken, authorizeRoles('admin', 'restaurant_owner'), async (req, res) => {
  try {
    const { name, cuisine, rating, owner_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Restaurant name is required' });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    let finalOwnerId;

    // Determine owner_id based on user role
    if (req.user.role === 'restaurant_owner') {
      // Restaurant owners can only create restaurants for themselves
      finalOwnerId = req.user.userId;
    } else if (req.user.role === 'admin') {
      // Admins can specify owner_id or default to themselves
      finalOwnerId = owner_id || req.user.userId;
    }

    // Validate that the owner exists
    const ownerCheck = await pool.query('SELECT id FROM users WHERE id = $1', [finalOwnerId]);
    if (ownerCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid owner_id' });
    }

    // Insert restaurant into database
    const result = await pool.query(
      'INSERT INTO restaurants (name, cuisine, rating, owner_id) VALUES ($1, $2, $3, $4) RETURNING id, name, cuisine, rating, owner_id, created_at',
      [name, cuisine || null, rating || null, finalOwnerId]
    );

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid owner_id' });
    }
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// Update restaurant
router.put('/:id', authenticateToken, authorizeRoles('admin', 'restaurant_owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cuisine, rating } = req.body;

    // Validate that at least one field is provided
    if (!name && !cuisine && rating === undefined) {
      return res.status(400).json({ error: 'At least one field (name, cuisine, rating) must be provided' });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    // Check if restaurant exists and get ownership info
    const restaurantCheck = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [id]);
    if (restaurantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurant = restaurantCheck.rows[0];

    // Check ownership - restaurant owners can only update their own restaurants
    if (req.user.role === 'restaurant_owner' && restaurant.owner_id != req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own restaurants' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (cuisine !== undefined) {
      updates.push(`cuisine = $${paramCount}`);
      values.push(cuisine);
      paramCount++;
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramCount}`);
      values.push(rating);
      paramCount++;
    }

    values.push(id); // Add id as last parameter

    const query = `
      UPDATE restaurants 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, name, cuisine, rating, owner_id, created_at
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Restaurant updated successfully',
      restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Delete restaurant (admin or owner only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'restaurant_owner'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if restaurant exists and get ownership info
    const restaurantCheck = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [id]);
    if (restaurantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurant = restaurantCheck.rows[0];

    // Check ownership - restaurant owners can only delete their own restaurants
    if (req.user.role === 'restaurant_owner' && restaurant.owner_id != req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own restaurants' });
    }

    // Delete restaurant from database
    await pool.query('DELETE FROM restaurants WHERE id = $1', [id]);

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    if (error.code === '23503') { // Foreign key constraint violation
      return res.status(409).json({ error: 'Cannot delete restaurant with existing menu items or orders' });
    }
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

module.exports = router;