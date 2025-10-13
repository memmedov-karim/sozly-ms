import mongoose, { Document } from "mongoose";
export interface IOption extends Document {
    value: string;
    type: string;
    name: {
        [key: string]: string;
    };
}
declare const _default: mongoose.Model<IOption, {}, {}, {}, mongoose.Document<unknown, {}, IOption> & IOption & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Option.d.ts.map