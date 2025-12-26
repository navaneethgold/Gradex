import mongoose from "mongoose";
const examSchema = new mongoose.Schema({
    examName: { type: String, required: true },
    createdBy: { type: String, required: true },
    groups: { type: [String], required: true },
    duration: { type: Number, required: true },
    createtime: { type: Date, default: Date.now },
    endTime: {
        type: [{
            user: String,
            time: Date
        }],
        default: []
    },
    linearity: { type: Boolean, default: false, required: true },
    submitted: { type: [String], default: [] }
})
const exam = mongoose.model("exam", examSchema);
export default exam;