import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    trim: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT','AIDS']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 3
  },
  description: {
    type: String,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: true
  },
  facultyAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  }]
}, { timestamps: true });

// Compound index to ensure unique combination of subject code, department, and semester
SubjectSchema.index({ subjectCode: 1, department: 1, semester: 1 }, { unique: true });

export default mongoose.model('Subject', SubjectSchema);