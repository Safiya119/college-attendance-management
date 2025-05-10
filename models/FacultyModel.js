import mongoose from "mongoose";
const FacultySchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']
  },
  subjects: {
    type: [
      {
        name: String,
        department: String,
        semester: Number,
        subjectCode: String,
      }
    ],
    default: []
  },
  role: {
    type: String,
    default: 'faculty'
  }
}, { timestamps: true });

export default mongoose.model('Faculty', FacultySchema);