import mongoose from "mongoose";

const materialsSchema = new mongoose.Schema({
    examId: { type: String, required: false },
    classId: { type: String, required: false },
    objectKey: { type: String, required: true },
})

const materials = mongoose.model("materials", materialsSchema);
export default materials;