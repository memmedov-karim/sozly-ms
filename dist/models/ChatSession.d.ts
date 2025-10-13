import mongoose, { Document } from 'mongoose';
interface IMessage {
    from: string;
    text: string;
    timestamp: Date;
}
interface IChUser {
    id: string;
    ip: string;
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
declare const _default: mongoose.Model<IChatSession, {}, {}, {}, mongoose.Document<unknown, {}, IChatSession> & IChatSession & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=ChatSession.d.ts.map