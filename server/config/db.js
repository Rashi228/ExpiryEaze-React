const mongoose = require('mongoose');
const dns = require('dns').promises;

const connectDB = async () => {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error('❌ Error: MONGO_URI is not set in your .env file');
      console.error('Please add MONGO_URI to your .env file');
      process.exit(1);
    }

    // Extract cluster name from connection string for diagnostics (without exposing password)
    const mongoUri = process.env.MONGO_URI;
    const clusterMatch = mongoUri.match(/@([^/]+)\.mongodb\.net/);
    const clusterName = clusterMatch ? clusterMatch[1] : 'unknown';
    
    console.log(`Attempting to connect to MongoDB cluster: ${clusterName}...`);
    
    // Test DNS resolution for the cluster
    if (clusterMatch) {
      try {
        const srvRecord = `_mongodb._tcp.${clusterMatch[1]}.mongodb.net`;
        await dns.resolveSrv(srvRecord);
        console.log('✓ DNS resolution successful');
      } catch (dnsErr) {
        console.error(`⚠ DNS resolution failed for: _mongodb._tcp.${clusterMatch[1]}.mongodb.net`);
        console.error('  This usually means:');
        console.error('  - The cluster was deleted or paused in MongoDB Atlas');
        console.error('  - The cluster name in your connection string is incorrect');
        console.error('  - There is a network/DNS issue');
      }
    }

    // Connection options to help with connection issues
    const options = {
      serverSelectionTimeoutMS: 10000, // Increased to 10s for better diagnostics
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(mongoUri, options);
    console.log('✅ Successfully connected to MongoDB Atlas!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    
    // Provide helpful error messages based on error type
    if (err.message.includes('ENOTFOUND') || err.message.includes('querySrv')) {
      console.error('\n🔍 Troubleshooting steps:');
      console.error('\n1. VERIFY CLUSTER EXISTS:');
      console.error('   - Log into MongoDB Atlas (https://cloud.mongodb.com)');
      console.error('   - Check if your cluster "expiryeazecluster" still exists');
      console.error('   - If deleted, create a new cluster or update the connection string');
      
      console.error('\n2. GET NEW CONNECTION STRING:');
      console.error('   - In MongoDB Atlas, go to: Clusters → Connect → Connect your application');
      console.error('   - Copy the connection string');
      console.error('   - Replace <password> with your database user password');
      console.error('   - Update MONGO_URI in your .env file');
      
      console.error('\n3. CHECK NETWORK ACCESS:');
      console.error('   - In MongoDB Atlas: Network Access → Add IP Address');
      console.error('   - Add your current IP or use 0.0.0.0/0 (less secure, for development)');
      
      console.error('\n4. VERIFY CONNECTION STRING FORMAT:');
      console.error('   Should be: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority');
      console.error('   Or standard: mongodb://<username>:<password>@<cluster>.mongodb.net:27017/<database>');
      
      console.error('\n5. TEST INTERNET CONNECTION:');
      console.error('   - Ensure you have internet access');
      console.error('   - Try accessing https://cloud.mongodb.com in your browser');
    } else if (err.message.includes('authentication failed')) {
      console.error('\n🔍 Authentication failed:');
      console.error('1. Check your MongoDB username and password in the .env file');
      console.error('2. Ensure special characters in password are URL-encoded (e.g., @ → %40, # → %23)');
      console.error('3. Verify the database user exists in MongoDB Atlas');
    } else if (err.message.includes('timeout')) {
      console.error('\n🔍 Connection timeout:');
      console.error('1. Check your internet connection');
      console.error('2. Verify your IP address is whitelisted in MongoDB Atlas Network Access');
      console.error('3. Check if MongoDB Atlas is experiencing issues');
    }
    
    // Don't exit immediately - let the server continue running
    // The app can still work for routes that don't require DB
    console.error('\n⚠ Server will continue running, but database operations will fail.');
  }
};

module.exports = connectDB; 