const {pool} = require("../model/db");

const placeOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { orderItems, shippingAddress, paymentMethod, paymentStatus } = req.body;
    const orderStatus = "pending";

    await client.query("BEGIN");

    const insertOrder = await client.query(
      `INSERT INTO orders (user_id, shipping_address, payment_method, payment_status, order_status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, shippingAddress, paymentMethod, paymentStatus, orderStatus]
    );

    const orderId = insertOrder.rows[0].id;

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    await client.query(`DELETE FROM cart WHERE user_id = $1`, [userId]);
    await client.query("COMMIT");

    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    client.release();
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await pool.query(`SELECT * FROM orders WHERE user_id = $1`, [userId]);
    res.status(200).json(orders.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const getUserOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await pool.query(`SELECT * FROM orders WHERE id = $1 AND user_id = $2`, [orderId, userId]);
    if (order.rows.length === 0) return res.status(404).json({ message: "Order not found" });

    const items = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
    res.status(200).json({ order: order.rows[0], items: items.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching order details" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await pool.query(`SELECT * FROM orders WHERE id = $1 AND user_id = $2`, [orderId, userId]);
    if (order.rows.length === 0) return res.status(404).json({ message: "Order not found" });

    const status = order.rows[0].order_status;
    if (status !== "pending") {
      return res.status(400).json({ message: "Cannot cancel a processed order" });
    }

    await pool.query(`UPDATE orders SET order_status = 'cancelled' WHERE id = $1`, [orderId]);
    res.status(200).json({ message: "Order cancelled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await pool.query(`SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [orderId]);
    if (order.rows.length === 0) return res.status(404).json({ message: "Order not found" });

    const items = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
    res.status(200).json({ order: order.rows[0], items: items.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching order details" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    await pool.query(`UPDATE orders SET order_status = $1 WHERE id = $2`, [orderStatus, orderId]);
    res.status(200).json({ message: "Order status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;
    await pool.query(`UPDATE orders SET payment_status = $1 WHERE id = $2`, [paymentStatus, orderId]);
    res.status(200).json({ message: "Payment status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update payment status" });
  }
};

module.exports = {placeOrder,cancelOrder,getAllOrders,getOrderDetails,updateOrderStatus,updatePaymentStatus,getUserOrderById,getUserOrders};


