import mongoose, { Schema, Document } from 'mongoose';

export interface IIPBan extends Document {
  ip: string;
  uniqueUserId: string; // Unique User ID
  bannedBy: string; // Admin ID
  reason?: string;
  banDuration: number; // Duration in minutes
  bannedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  reportedIp?: string; // The IP that was reported
  relatedReportIds?: string[]; // Related report IDs
}

const IPBanSchema = new Schema<IIPBan>(
  {
    ip: { type: String, required: true, index: true },
    uniqueUserId: { type: String, required: true, index: true },
    bannedBy: { type: String, required: true },
    reason: { type: String },
    banDuration: { type: Number, required: true }, // in minutes
    bannedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    reportedIp: { type: String },
    relatedReportIds: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
IPBanSchema.index({ ip: 1, isActive: 1, expiresAt: 1 });

export default mongoose.model<IIPBan>('IPBan', IPBanSchema);


