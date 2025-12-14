import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true }, // লগিন আইডি
  password: { type: String, required: true }, // লগিন পাসওয়ার্ড
}, { timestamps: true });

export default mongoose.models.Section || mongoose.model('Section', SectionSchema);