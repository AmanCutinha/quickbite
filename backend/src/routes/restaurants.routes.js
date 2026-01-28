const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all restaurants (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;

    // TODO: Get restaurants from database with filters
    // let query = 'SELECT * FROM restaurants WHERE active = true';
    // const params = [];

    res.json({
      message: 'Restaurants retrieved successfully',
      // restaurants: result.rows,
      // pagination: { limit, offset, total: result.rowCount }
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

    // TODO: Get restaurant details from database
    // const result = await pool.query('SELECT * FROM restaurants WHERE id = $1 AND active = true', [id]);

    res.json({
      message: 'Restaurant retrieved successfully',
      // restaurant: result.rows[0]
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
    const { name, description, address, phone, cuisine_type, image_url } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ error: 'Name, address, and phone are required' });
    }

    // TODO: Insert restaurant into database
    // const result = await pool.query(
    //   'INSERT INTO restaurants (name, description, address, phone, cuisine_type, image_url, owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    //   [name, description, address, phone, cuisine_type, image_url, req.user.userId]
    // );

    res.status(201).json({
      message: 'Restaurant created successfully',
      // restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// Update restaurant
router.put('/:id', authenticateToken, authorizeRoles('admin', 'restaurant_owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, cuisine_type, image_url } = req.body;

    // TODO: Check if user owns the restaurant or is admin
    // TODO: Update restaurant in database

    res.json({
      message: 'Restaurant updated successfully',
      // restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Delete restaurant (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Delete restaurant from database (or mark as inactive)
    // await pool.query('UPDATE restaurants SET active = false WHERE id = $1', [id]);

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

module.exports = router;