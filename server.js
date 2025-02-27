import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import productRoutes from "./productRoutes.js";
import orderRoutes from "./orderRoutes.js";
import Product from "./product.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Allow large Base64 images
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Serve Static Files
app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));

// Use Modular Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Default Route
app.get("/", (req, res) => res.send("🚀 VDECK API is running..."));

// Global Error Handling
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
