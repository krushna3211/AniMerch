// =========================
// AniMerch Backend Server
// =========================

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

// --- Import route files ---
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

// =========================
// Load environment variables
// =========================
dotenv.config();

// =========================
// Connect to MongoDB Atlas
// =========================
connectDB();

// =========================
// Initialize Express app
// =========================
const app = express();

// --- Middlewares ---
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// =========================
// API Routes
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// --- Static uploads folder ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Simple test route ---
app.get("/api", (req, res) => {
  res.json({ message: "Hello from the AniMerch backend!" });
});

// --- Health check route for Render ---
// app.get("/", (req, res) => {
//   res.send("AniMerch backend is running successfully 🚀");
// });

// =========================
// Serve Frontend (Static)
// =========================
// Make sure your frontend build or static files exist inside '../animerch-frontend'
app.use(express.static(path.join(__dirname, "../animerch-frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../animerch-frontend/index.html"));
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
