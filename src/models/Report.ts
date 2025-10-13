import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  sessionId: string;
  reporterIp: string;
  reportedIp: string;
  message: string;
}

const ReportSchema = new Schema<IReport>(
  {
    sessionId: { type: String, required: true, index: true },
    reporterIp: { type: String },
    reportedIp: { type: String },
    message: { type: String },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IReport>('Report', ReportSchema);
