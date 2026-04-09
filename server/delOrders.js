const mongoose = require('mongoose');
const Order = require('./models/Order');

const uri = "mongodb+srv://expiryeaze-user:rashi12345@expiryeazecluster.id2x2f0.mongodb.net/?appName=ExpiryEazeCluster";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB, deleting all orders...");
    const result = await Order.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} orders!`);
    process.exit(0);
  })
  .catch(err => {
    console.error("Failed to connect or delete:", err);
    process.exit(1);
  });
