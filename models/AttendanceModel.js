import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  subjectCode: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  facultyId: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  absentStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    registerNumber: {
      type: String,
      required: true
    }
  }],
  markedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Update student's attendance records when attendance is marked
AttendanceSchema.post('save', async function(doc) {
  const Student = mongoose.model('Student');
  const dateStart = new Date(doc.date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(dateStart);
  dateEnd.setDate(dateEnd.getDate() + 1);

  // Format date for comparison (YYYY-MM-DD)
  const formattedDate = doc.date.toISOString().split('T')[0];
  
  // For each absent student, update their daily record
  for (const absentStudent of doc.absentStudents) {
    const student = await Student.findById(absentStudent.student);
    
    if (!student) continue;
    
    // Check if we already have a record for this date
    const existingRecordIndex = student.attendance.dailyRecords.findIndex(
      record => record.date.toISOString().split('T')[0] === formattedDate
    );
    
    if (existingRecordIndex >= 0) {
      // Update existing record
      const existingRecord = student.attendance.dailyRecords[existingRecordIndex];
      
      // Check if this period is already marked absent
      const isPeriodMarked = existingRecord.absentPeriods.some(
        p => p.period === doc.period && p.subjectCode === doc.subjectCode
      );
      
      if (!isPeriodMarked) {
        // Add this period absence to the record
        student.attendance.dailyRecords[existingRecordIndex].absentPeriods.push({
          subjectCode: doc.subjectCode,
          subjectName: doc.subjectName,
          period: doc.period
        });
      }
    } else {
      // Create new record for this date
      student.attendance.dailyRecords.push({
        date: doc.date,
        status: 'present', // Default status
        absentPeriods: [{
          subjectCode: doc.subjectCode,
          subjectName: doc.subjectName,
          period: doc.period
        }]
      });
    }
    
    await student.save();
  }

  // After all periods are marked (period 8), calculate full day attendance
  if (doc.period === 8) {
    const allAttendance = await mongoose.model('Attendance').find({
      date: { $gte: dateStart, $lt: dateEnd },
      department: doc.department,
      semester: doc.semester
    });

    // Get all students in the department and semester
    const allStudents = await Student.find({ 
      department: doc.department,
      semester: doc.semester
    });
    
    for (const student of allStudents) {
      const formattedStudentId = student._id.toString();
      
      // Count how many periods this student was absent
      let absentPeriodsCount = 0;
      
      allAttendance.forEach(att => {
        const isAbsent = att.absentStudents.some(
          s => s.student.toString() === formattedStudentId
        );
        if (isAbsent) absentPeriodsCount++;
      });
      
      // Find the daily record for this date
      const dailyRecordIndex = student.attendance.dailyRecords.findIndex(
        record => record.date.toISOString().split('T')[0] === formattedDate
      );
      
      if (dailyRecordIndex >= 0) {
        // Update the record based on total absent periods
        if (absentPeriodsCount === 8) {
          student.attendance.dailyRecords[dailyRecordIndex].status = 'absent';
        } else if (absentPeriodsCount === 0) {
          student.attendance.dailyRecords[dailyRecordIndex].status = 'present';
        } else {
          student.attendance.dailyRecords[dailyRecordIndex].status = 'half-day';
        }
      }
      
      // Update overall attendance counts (only once per day)
      if (doc.period === 8) {
        student.attendance.totalDays = (student.attendance.totalDays || 0) + 1;
        
        if (absentPeriodsCount === 8) {
          student.attendance.absent = (student.attendance.absent || 0) + 1;
        } else if (absentPeriodsCount === 0) {
          student.attendance.present = (student.attendance.present || 0) + 1;
        } else {
          // For half-day, consider as present but with some absent periods
          student.attendance.present = (student.attendance.present || 0) + 1;
        }
        
        await student.save();
      }
    }
  }
});

// Compound index
AttendanceSchema.index(
  { date: 1, subjectCode: 1, period: 1, department: 1, semester: 1 }, 
  { unique: true }
);



AttendanceSchema.pre('save', async function(next) {
  // Only process if this is a new attendance record
  if (this.isNew) {
    // Check if all 8 periods are now marked for this date/dept/semester
    const markedPeriods = await this.constructor.countDocuments({
      date: this.date,
      department: this.department,
      semester: this.semester
    });
    
    // If all 8 periods are marked, trigger final attendance calculation
    if (markedPeriods === 8) {
      this.finalized = true;
    }
  }
  next();
});





export default mongoose.model('Attendance', AttendanceSchema);