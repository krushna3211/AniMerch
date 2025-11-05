const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors'); 
const path = require('path'); // <-- 1. IMPORT 'path' MODULE

// --- Import our new route file ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes'); 
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes'); 
const orderRoutes = require('./routes/orderRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// --- Middleware to parse JSON bodies ---
// This lets our app accept JSON data from forms
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
app.get("/", (req, res) => {
  res.send("AniMerch backend is running successfully 🚀");
});
// --- Use the auth routes ---
// Any request to /api/auth/... will be handled by authRoutes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/categories', categoryRoutes); 
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); 


// --- 2. MAKE UPLOADS FOLDER STATIC ---
// This makes the 'uploads' folder accessible to the browser
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Test route (you can keep this or remove it)
app.get('/api', (req, res) => {
    res.json({ message: "Hello from the AniMerch backend!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
