import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  joinDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'OnLeave', 'Terminated'], default: 'Active' },
  
  // --- নতুন লজিক ---
  // ১. কাউন্টারের বদলে তারিখের লিস্ট
  absentDates: [Date], 
  
  // ২. কেউ লম্বা ছুটিতে থাকলে কবে শুরু করেছিল
  leaveStartDate: { type: Date }, 

  // ৩. এডভান্স এর তারিখ ও টাকার হিসাব
  advances: [
    {
      amount: Number,
      date: { type: Date, default: Date.now }
    }
  ],

  // ৪. কোন কোন মাসের বেতন পেইড হয়েছে তার রেকর্ড
  paymentHistory: [
    {
      monthStr: String, // e.g. "01-2025"
      amount: Number,
      paidDate: { type: Date, default: Date.now }
    }
  ],

  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);