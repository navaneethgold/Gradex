import mongoose from 'mongoose';
const groupSchema = new mongoose.Schema({
    groupName: { type: String, required: true },
    createdBy: { type: String, required: true },
    members: { type: [String], required: false, default: [] }
})
const group = mongoose.model("group", groupSchema);
export default group;