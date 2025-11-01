import mongoose, { Document, Schema } from 'mongoose';
import { ALL_GENDERS, GENDERS } from '../constants/option';
import { UserPreferences } from '../types';

export interface IUserSession extends Document {
  socketId: string;
  ip: string;
  preferences: UserPreferences;
  isOnline: boolean;
  joinedAt: Date;
  lastSeen: Date;
  matchHistory: string[];
  location?: {
    country: string;
    region: string;
  };
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    socketId: { type: String, required: true, unique: true, index: true },
    ip: {
      type: String,
    },
    preferences: {
      gender: { type: String, enum: GENDERS.map((m_g) => m_g.value), required: true },
      preferredGender: { type: String, enum: ALL_GENDERS.map((y_g) => y_g.value), required: true },
      age: {
        min: { type: Number, required: true, min: 13 },
        max: { type: Number, required: true, max: 100 },
      },
      preferredAgeRange: [
        {
          min: { type: Number, required: true, min: 13 },
          max: { type: Number, required: true, max: 100 },
        },
      ],
      topics: [{ type: String, required: true }],
      language: [{ type: String, required: true }],
    },
    isOnline: { type: Boolean, default: true, index: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    matchHistory: [{ type: String }],
    location: {
      country: String,
      region: String,
    },
  },
  {
    timestamps: true,
    // indexes: [
    //   { 'preferences.gender': 1, 'preferences.age': 1, 'isOnline': 1 },
    //   { 'preferences.language': 1, 'isOnline': 1 },
    //   { 'joinedAt': 1 }
    // ]
  },
);

export default mongoose.model<IUserSession>('UserSession', UserSessionSchema);
