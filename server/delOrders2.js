require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function cleanOrders() {
  try {
    console.log("Connecting...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected! Deleting orders...");
    const result = await Order.deleteMany({});
    console.log(`Deleted ${result.deletedCount} orders!`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

cleanOrders();
