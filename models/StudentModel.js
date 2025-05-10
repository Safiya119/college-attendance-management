import mongoose from "mongoose";

const SubjectMarksSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true
  },
  cat1: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  cat2: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  modelExam: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});


const DailyAttendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day'],
    required: true
  },
  absentPeriods: [{
    subjectCode: String,
    subjectName: String,
    period: Number
  }]
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  registerNumber: {
    type: String,
    required: true,
    unique: true
  },
  rollNo: {
    type: String,
    required: true
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
  parentsNumber: {
    type: String,
    required: true
  },
  guardianContacts: [{
    relation: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    alternatePhone: String,
    email: String
  }],
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']
  },
  classroom: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  remarks: {
    type: String
  },
  marks: {
    type: Map,
    of: SubjectMarksSchema,
    default: {}
  },
  attendance: {
    totalDays: {
      type: Number,
      default: 0
    },
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    dailyRecords: [DailyAttendanceSchema]
  }
}, { timestamps: true });




StudentSchema.pre('save', function(next) {
  if (this.isModified('attendance.dailyRecords')) {
    const records = this.attendance.dailyRecords || [];
    
    // Calculate totals from daily records
    this.attendance.totalDays = records.length;
    this.attendance.present = records.filter(r => r.status === 'present').length;
    this.attendance.absent = records.filter(r => r.status === 'absent').length;
  }
  next();
});


export default mongoose.model('Student', StudentSchema);