import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import connectDB from "./configs/db.js";
import connectCloudinary from "./configs/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";

import { stripeWebhooks } from "./controllers/orderController.js";

const app = express();
const PORT = process.env.PORT || 4000;

/* =========================
   DATABASE & CLOUDINARY
========================= */
await connectDB();
await connectCloudinary();

/* =========================
   STRIPE WEBHOOK (RAW BODY)
   ⚠️ MUST BE BEFORE express.json()
========================= */
app.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

/* =========================
   CORS CONFIGURATION
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://green-cart-grocery-mern-with-razorpay-8z7uk06ek.vercel.app"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(cookieParser());

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("API is Working");
});

app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
