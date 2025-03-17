import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import productRoutes from "./productRoutes.js";
import orderRoutes from "./orderRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase";

// 🔥 MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    setTimeout(connectDB, 5000);
  }
}
connectDB();

// 🛠 Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// 📂 Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ⬇️ Serve Static Files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.static(path.join(process.cwd(), "public")));

// 🚀 API Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// ✅ Default Route
app.get("/", (req, res) => res.send("🚀 VDECK API is running..."));

// 🔥 Place Order and Deduct Stock
app.post("/api/orders", async (req, res) => {
  try {
    const { fullname, gcash, address, items, total, paymentProof } = req.body;
    if (!fullname || !gcash || !address || !items || !total || !paymentProof) {
      return res.status(400).json({ message: "❌ All fields are required." });
    }

    const orderItems = typeof items === "string" ? JSON.parse(items) : items;
    console.log("📦 Received Order Items:", orderItems);

    // Validate and Deduct Stock in One Transaction
    const bulkOps = orderItems.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $inc: { stock: -item.quantity } }
      }
    }));

    const updatedProducts = await Product.bulkWrite(bulkOps);
    console.log("📉 Stock Updated for Products:", updatedProducts);

    // Save Order
    const newOrder = new Order({ fullname, gcash, address, items: orderItems, total, paymentProof });
    const savedOrder = await newOrder.save();
    console.log("✅ Order Saved:", savedOrder);

    res.status(201).json({ message: "✅ Order placed successfully!", order: savedOrder });
  } catch (error) {
    console.error("❌ Order Placement Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 📸 Upload Image Route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// ❌ Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ error: "❌ Route Not Found" });
});

// ❌ Global Error Handling
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" });
});

// 🌍 Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
