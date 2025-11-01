import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteUsage extends Document {
  count: number;
  timestamp: Date;
  metricType: string;
  ip: string;
}

const SiteUsage = new Schema<ISiteUsage>(
  {
    count: {
      type: Number,
    },
    timestamp: {
      type: Date,
    },
    metricType: {
      type: String,
    },
    ip: {
      type: String
    }
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<ISiteUsage>('SiteUsage', SiteUsage);
