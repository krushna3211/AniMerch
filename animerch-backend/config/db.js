const mongoose = require('mongoose');

// We use an async function to connect
const connectDB = async () => {
    try {
        // Mongoose.connect returns a promise, so we await it
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        // If successful, log the host it connected to
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // If there's an error, log it and exit the server
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit with a failure code
    }
};

// Export the function
module.exports = connectDB;