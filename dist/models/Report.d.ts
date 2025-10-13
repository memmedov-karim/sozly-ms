import mongoose, { Document } from 'mongoose';
export interface IReport extends Document {
    sessionId: string;
    reporterIp: string;
    reportedIp: string;
    message: string;
}
declare const _default: mongoose.Model<IReport, {}, {}, {}, mongoose.Document<unknown, {}, IReport> & IReport & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Report.d.ts.map