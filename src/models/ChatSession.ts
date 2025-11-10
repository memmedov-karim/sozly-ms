import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  from: string;
  text: string;
  timestamp: Date;
}

export interface IChUser {
  id: string;
  ip: string;
  uniqueUserId?: string;
}
export interface IChatSession extends Document {
  sessionId: string;
  users: IChUser[];
  startedAt: Date;
  endedAt?: Date;
  chatType: 'voice' | 'text';
  status: 'waiting' | 'connected' | 'ended' | 'rejected';
  rejectedBy?: string;
  duration?: number;
  language: string[];
  topics: string[];
  messages?: IMessage[];
}

const ChatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    users: [
      {
        id: { type: String, required: true },
        ip: { type: String, required: true },
        uniqueUserId: { type: String },
      },
    ],
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    status: {
      type: String,
      enum: ['waiting', 'connected', 'ended', 'rejected'],
      default: 'waiting',
      index: true,
    },
    rejectedBy: String,
    chatType: { type: String, enum: ['voice', 'text'], required: true },

    duration: Number,
    language: [{ type: String, required: true, index: true }],
    topics: [{ type: String }],
    messages: [
      {
        from: String,
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
