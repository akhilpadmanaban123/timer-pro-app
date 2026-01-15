import { join, resolve } from "path";

import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import mongoose from "mongoose";

import shopify from "./shopify.js";
import GDPRWebhookHandlers from "./gdpr.js";
import { Timer } from "./backend/models/Timer.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://codeitup1234_db_user:codeitup@cluster1.xfn9iev.mongodb.net/countdown-app?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log(">>> MongoDB Connected"))
  .catch((err) => console.error(">>> MongoDB Error:", err));

// Use resolve for Windows compatibility
const STATIC_PATH = process.env.NODE_ENV === "production"
    ? resolve(process.cwd(), "frontend", "dist")
    : resolve(process.cwd(), "frontend");


const app = express();

// Delete a specific timer by ID
app.delete("/api/timers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const shop = res.locals.shopify.session.shop;

    // Ensure we only delete timers belonging to the current shop
    const deletedTimer = await Timer.findOneAndDelete({ _id: id, shop: shop });

    if (!deletedTimer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    res.status(200).json({ success: true, message: "Timer deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Move Proxy HERE (Above the authentication middleware)
app.get("/api/proxy", async (req, res) => {
  try {
    const { shop, product_id } = req.query;
    const idVariants = [product_id, `gid://shopify/Product/${product_id}`];

    const activeTimer = await Timer.findOne({ 
      shop: shop,
      targetIds: { $in: idVariants } 
    });

    if (!activeTimer) return res.status(200).json({ active: false });

    res.status(200).json({
      active: true,
      title: activeTimer.title,
      endDate: activeTimer.endDate,
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// 2. Authentication middleware (Everything below this requires a login)
app.use("/api/*", shopify.validateAuthenticatedSession());
app.use(express.json());

// Get Timers
app.get("/api/timers", async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timers = await Timer.find({ shop }).sort({ createdAt: -1 });
    res.status(200).json(timers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Save/Update Timer
app.post("/api/timers", async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const { title, endDate, targetIds } = req.body;

    // Use findOneAndUpdate so we can "Edit" if the title matches, or create new
    const timer = await Timer.findOneAndUpdate(
      { shop, title }, 
      { endDate, targetIds, shop },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, timer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this route to handle proxy requests from the storefront
app.get("/api/proxy", async (req, res) => {
  try {
    const { shop, product_id } = req.query;
    
    // This creates an array of possible ID formats to search for
    const idVariants = [
      product_id, 
      `gid://shopify/Product/${product_id}`
    ];

    const activeTimer = await Timer.findOne({ 
      shop: shop,
      // $in looks for any of the variants in your targetIds array
      targetIds: { $in: idVariants } 
    });

    if (!activeTimer) {
      return res.status(200).json({ active: false });
    }

    res.status(200).json({
      active: true,
      title: activeTimer.title,
      endDate: activeTimer.endDate,
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Save Timer
app.post("/api/timers", async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const newTimer = new Timer({ ...req.body, shop });
    await newTimer.save(); 
    
    // This tells the frontend "I am done," which stops the spinner
    res.status(201).json({ success: true, timer: newTimer }); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Mock Endpoint
app.post("/api/ai/generate", async (req, res) => {
  const { intent } = req.body;
  res.json({
    title: `AI Suggestion for: ${intent}`,
    type: "fixed",
    endDate: "2026-12-31"
  });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  try {
    const htmlFile = join(STATIC_PATH, "index.html");
    return res.status(200).set("Content-Type", "text/html").send(readFileSync(htmlFile));
  } catch (err) {
    // This catch prevents the 500 error from being a "silent" white page
    console.error("Critical Error serving HTML:", err.message);
    res.status(500).send(`Check if this file exists: ${STATIC_PATH}/index.html`);
  }
});

app.listen(PORT);