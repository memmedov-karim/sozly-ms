import mongoose, {Document, Schema} from "mongoose"

export interface IOption extends Document {
    value: string;
    type: string;
    name: { [key: string]: string };
}

const OptionSchema = new Schema<IOption>({
    value: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: Object, required: true },
});

export default mongoose.model<IOption>('Option', OptionSchema);