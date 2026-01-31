import mongoose from "mongoose";
const answersSchema = new mongoose.Schema({
    examWho: { type: String, required: true },
    examName: { type: String, required: true },
    answersAll: { type: [String], required: true }
})
const answer = mongoose.model("answer", answersSchema);
export default answer;