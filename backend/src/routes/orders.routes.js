const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    // TODO: Get orders from database
    // const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.userId]);

    res.json({
      message: 'Orders retrieved successfully',
      // orders: result.rows,
      // pagination: { limit, offset, total: result.rowCount }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Get order details from database
    // const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    // const order = result.rows[0];

    // Check if user owns the order or is admin/restaurant owner
    // if (order.user_id !== req.user.userId && req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    res.json({
      message: 'Order retrieved successfully',
      // order: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { restaurant_id, items, delivery_address, payment_method } = req.body;

    if (!restaurant_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Restaurant ID and items are required' });
    }

    // TODO: Calculate total amount
    // TODO: Validate menu items and prices
    // TODO: Create order in database with transaction

    res.status(201).json({
      message: 'Order created successfully',
      // order: result.rows[0]
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (restaurant owner/admin only)
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'restaurant_owner'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // TODO: Update order status in database
    // const result = await pool.query(
    //   'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    //   [status, id]
    // );

    res.json({
      message: 'Order status updated successfully',
      // order: result.rows[0]
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (customer only, within time limit)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Check if order belongs to user and can be cancelled
    // TODO: Update order status to cancelled

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get all orders (admin/restaurant owner)
router.get('/admin/all', authenticateToken, authorizeRoles('admin', 'restaurant_owner'), async (req, res) => {
  try {
    const { status, restaurant_id, limit = 50, offset = 0 } = req.query;

    // TODO: Get orders based on user role and filters
    // If restaurant owner, only show orders for their restaurants

    res.json({
      message: 'Orders retrieved successfully',
      // orders: result.rows,
      // pagination: { limit, offset, total: result.rowCount }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

module.exports = router;