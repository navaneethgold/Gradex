import mongoose from 'mongoose';
const groupSchema = new mongoose.Schema({
    groupName: { type: String, required: true },
    createdBy: { type: String, required: true },
    members: { type: [String], required: false, default: [] },
    materials: [{
        title: { type: String, required: true },
        link: { type: String, required: false },
        file: { type: String, required: false },
        uploadedAt: { type: Date, default: Date.now }
    }]
})
const group = mongoose.model("group", groupSchema);
export default group;