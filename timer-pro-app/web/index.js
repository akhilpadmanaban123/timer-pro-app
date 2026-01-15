import { join, resolve } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import mongoose from "mongoose";
import 'dotenv/config';

import shopify from "./shopify.js";
import GDPRWebhookHandlers from "./gdpr.js";
import { Timer } from "./backend/models/Timer.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://codeitup1234_db_user:codeitup@cluster1.xfn9iev.mongodb.net/countdown-app?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log(">>> MongoDB Connected"))
  .catch((err) => console.error(">>> MongoDB Error:", err));

const STATIC_PATH = process.env.NODE_ENV === "production"
    ? resolve(process.cwd(), "frontend", "dist")
    : resolve(process.cwd(), "frontend");

const app = express();

// --- SECTION 1: PUBLIC ROUTES ---
// These do NOT require a Shopify Admin session

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

// --- SECTION 2: WEBHOOKS & AUTH START ---
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// --- SECTION 3: PROTECTED API ROUTES ---
// Everything below this line requires a valid Admin session
app.use("/api/*", shopify.validateAuthenticatedSession());
app.use(express.json());

// Get All Timers for Dashboard
app.get("/api/timers", async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timers = await Timer.find({ shop }).sort({ createdAt: -1 });
    res.status(200).json(timers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific timer
app.delete("/api/timers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const shop = res.locals.shopify.session.shop; // Now this will be defined!

    const deletedTimer = await Timer.findOneAndDelete({ _id: id, shop: shop });

    if (!deletedTimer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    res.status(200).json({ success: true, message: "Timer deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or Update Timer
app.post("/api/timers", async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const { title, endDate, targetIds } = req.body;

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

// AI Generation Logic

app.post("/api/ai/generate", async (req, res) => {
  const { intent } = req.body;

  try {
    // We use the variables exactly as named in your .env
    const response = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAIROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL_NAME,
        messages: [
          {
            role: "system",
            content: `You are a Shopify marketing expert. 
            User wants: "${intent}". 
            Return ONLY a JSON object: {"title": "Catchy Title", "endDate": "YYYY-MM-DD"}.
            Calculate endDate to be 3-5 days from today (${new Date().toISOString().split('T')[0]}).`
          },
          { role: "user", content: intent }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    // OpenRouter returns data in the choices array
    const aiContent = JSON.parse(data.choices[0].message.content);

    res.json({
      title: aiContent.title,
      type: "fixed",
      endDate: aiContent.endDate
    });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    res.status(500).json({ error: "AI failed to generate suggestion" });
  }
});

// --- SECTION 4: SERVE FRONTEND ---
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  try {
    const htmlFile = join(STATIC_PATH, "index.html");
    return res.status(200).set("Content-Type", "text/html").send(readFileSync(htmlFile));
  } catch (err) {
    console.error("Critical Error serving HTML:", err.message);
    res.status(500).send(`Check if this file exists: ${STATIC_PATH}/index.html`);
  }
});

app.listen(PORT);