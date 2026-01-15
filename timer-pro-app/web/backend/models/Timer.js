import mongoose from "mongoose";

// Requirement 4.3: MongoDB Schema for multi-tenant data isolation
const TimerSchema = new mongoose.Schema({
  shop: { type: String, required: true, index: true }, 
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ["fixed", "evergreen"], default: "fixed" },
  endDate: { type: String }, 
  targetType: { type: String, enum: ["all", "product"], default: "all" },
  targetIds: [String], 
  analytics: {
    impressions: { type: Number, default: 0 }
  }
}, { timestamps: true });

TimerSchema.index({ shop: 1, targetType: 1 });
TimerSchema.index({ shop: 1, targetIds: 1 });

// Prevent server crash on hot-reload
export const Timer = mongoose.models.Timer || mongoose.model("Timer", TimerSchema);