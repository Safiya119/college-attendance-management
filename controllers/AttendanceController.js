import StudentModel from "../models/StudentModel.js";
import FacultyModel from "../models/FacultyModel.js";
import AttendanceModel from "../models/AttendanceModel.js";

export const markAttendance = async (req, res) => {
  try {
    // Log the incoming request data for debugging
    
    // Extract all fields from the request body
    const { subjectCode, subjectName, period, date, semester, department, absentStudents } = req.body;
    const facultyId = req.user.facultyId;

    // Validate input - now including department and subjectName
    if (!subjectCode || !period || !date || !semester || !department || !Array.isArray(absentStudents)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // Verify faculty exists and teaches this subject
    const faculty = await FacultyModel.findOne({ facultyId });
    if (!faculty) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access"
      });
    }

    const teachesSubject = faculty.subjects.some(
      sub => sub.subjectCode === subjectCode
    );
    
    if (!teachesSubject) {
      return res.status(403).json({
        success: false,
        error: "Not assigned to this subject"
      });
    }

    // Get subject information, but prioritize what's sent from the client
    const subject = faculty.subjects.find(
      sub => sub.subjectCode === subjectCode
    );

    // Check if period is already marked by another faculty
    const existingAttendance = await AttendanceModel.findOne({
      date: new Date(date),
      semester: parseInt(semester),
      period: parseInt(period)
    });

    if (existingAttendance && existingAttendance.facultyId !== facultyId) {
      return res.status(400).json({
        success: false,
        error: `Period ${period} already marked by another faculty`
      });
    }

    // Get student references
    const absentStudentRefs = await Promise.all(
      absentStudents.map(async (student) => {
        const studentDoc = await StudentModel.findOne({ 
          registerNumber: student.registerNumber,
          semester: semester
        });
        
        if (!studentDoc) {
          throw new Error(`Student ${student.registerNumber} not found`);
        }
        
        return {
          student: studentDoc._id,
          registerNumber: student.registerNumber,
          name: studentDoc.name,
          parentsNumber: studentDoc.parentsNumber 
        };
      })
    );

    // Create/update attendance record
    // Use the explicitly provided subjectName and department if available
    let attendance;
    if (existingAttendance) {
      existingAttendance.absentStudents = absentStudentRefs;
      existingAttendance.subjectCode = subjectCode;
      existingAttendance.subjectName = subjectName || subject?.name || subjectCode;
      existingAttendance.department = department || subject?.department;
      attendance = await existingAttendance.save();
    } else {
      attendance = new AttendanceModel({
        date: new Date(date),
        subjectCode,
        subjectName: subjectName || subject?.name || subjectCode,
        period: parseInt(period),
        facultyId,
        department: department || subject?.department,
        semester: parseInt(semester),
        absentStudents: absentStudentRefs
      });
      await attendance.save();
    }

    res.status(201).json({
      success: true,
      message: existingAttendance 
        ? "Attendance updated successfully" 
        : "Attendance marked successfully",
      attendance,
      absentStudents: absentStudentRefs 
    });

  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


export const getAbsenteesWithParents = async (req, res) => {
  try {
    const { date, period, subjectCode, semester } = req.query;

    const attendance = await AttendanceModel.findOne({
      date: new Date(date),
      period: parseInt(period),
      subjectCode,
      semester: parseInt(semester)
    }).populate({
      path: 'absentStudents.student',
      select: 'registerNumber name parentsNumber'
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      absentStudents: attendance.absentStudents.map(s => ({
        registerNumber: s.registerNumber,
        name: s.name,
        parentsNumber: s.student.parentsNumber
      }))
    });
  } catch (err) {
    console.error("Error fetching absentees:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



export const getAttendanceReport = async (req, res) => {
  try {
    const { date, subjectCode, period, department, semester } = req.query;

    // Build query
    const query = {};
    if (date) query.date = new Date(date);
    if (subjectCode) query.subjectCode = subjectCode;
    if (period) query.period = parseInt(period);
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);


    if (req.user.role === 'faculty') {
      query.facultyId = req.user.facultyId;
    }

    // Get attendance records
    const attendance = await AttendanceModel.find(query)
      .sort({ date: -1, period: 1 })
      .populate({
        path: 'absentStudents.student',
        select: 'registerNumber name rollNo semester'
      });

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance
    });

  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};





export const getPeriodStatus = async (req, res) => {
  try {
    const { date, department, semester } = req.query;

    if (!date || !department || !semester) {
      return res.status(400).json({
        success: false,
        error: "Date, department and semester are required"
      });
    }

    // Get all attendance for this date/dept/semester
    const attendance = await AttendanceModel.find({
      date: new Date(date),
      department,
      semester: parseInt(semester)
    }).select('period subjectCode facultyId');

    // Create period status map
    const periodStatus = {};
    for (let i = 1; i <= 8; i++) {
      const periodAttendance = attendance.find(a => a.period === i);
      
      periodStatus[i] = {
        marked: !!periodAttendance,
        subjectCode: periodAttendance?.subjectCode,
        markedByFaculty: false 
      };
    }

    // Check if all periods are completed
    const allPeriodsMarked = Object.values(periodStatus).every(p => p.marked);

    res.status(200).json({
      success: true,
      periodStatus,
      allPeriodsMarked
    });

  } catch (err) {
    console.error("Error fetching period status:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



export const getPeriodAttendance = async (req, res) => {
  try {
    const { date, period, department, semester } = req.query;

    if (!date || !period || !department || !semester) {
      return res.status(400).json({
        success: false,
        error: "Date, period, department and semester are required"
      });
    }

    // Find the attendance record for the specific period
    const attendanceRecord = await AttendanceModel.findOne({
      date: new Date(date),
      period: parseInt(period),
      department,
      semester: parseInt(semester)
    }).lean();

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        error: "No attendance record found for this period"
      });
    }

    // Get all students for the semester/department
    const students = await StudentModel.find({
      department,
      semester: parseInt(semester)
    }).select('registerNumber name rollNo parentsNumber').lean();

    // Map attendance status to each student
    const studentsWithStatus = students.map(student => {
      const isAbsent = attendanceRecord.absentStudents.some(
        absentee => absentee.registerNumber === student.registerNumber
      );
      
      return {
        ...student,
        status: isAbsent ? 'absent' : 'present'
      };
    });

    res.status(200).json({
      success: true,
      attendance: {
        period: attendanceRecord.period,
        subjectCode: attendanceRecord.subjectCode,
        subjectName: attendanceRecord.subjectName,
        facultyId: attendanceRecord.facultyId,
        date: attendanceRecord.date,
        students: studentsWithStatus
      }
    });

  } catch (err) {
    console.error("Error fetching period attendance:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};