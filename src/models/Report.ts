import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  sessionId: string;
  reporterIp: string;
  reportedIp: string;
  message: string;
  status: 'pending' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: Date;
  adminNotes?: string;
}

const ReportSchema = new Schema<IReport>(
  {
    sessionId: { type: String, required: true, index: true },
    reporterIp: { type: String },
    reportedIp: { type: String },
    message: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'resolved'], 
      default: 'pending',
      index: true 
    },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    adminNotes: { type: String },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IReport>('Report', ReportSchema);
