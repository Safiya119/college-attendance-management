import StudentModel from "../models/StudentModel.js";
import AttendanceModel from "../models/AttendanceModel.js";

// Get full-day absentees by department/semester
export const getFullDayAbsentees = async (req, res) => {
  try {
    const { date, department, semester } = req.query;
    
    // Validate input
    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date is required"
      });
    }

    const query = {
      'attendance.dailyRecords': {
        $elemMatch: {
          date: new Date(date),
          status: 'absent'
        }
      }
    };

    if (department) query.department = department;
    if (semester) query.semester = semester;

    const students = await StudentModel.find(query)
      .select('registerNumber name rollNo department semester attendance')
      .lean();

    // Format response
    const result = students.map(student => {
      const dailyRecord = student.attendance.dailyRecords.find(
        r => new Date(r.date).toDateString() === new Date(date).toDateString()
      );
      return {
        ...student,
        absentDate: dailyRecord.date,
        absentPeriods: dailyRecord.absentPeriods
      };
    });

    res.status(200).json({
      success: true,
      count: result.length,
      absentees: result
    });

  } catch (err) {
    console.error("Error fetching absentees:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get attendance summary by department
export const getAttendanceSummary = async (req, res) => {
  try {
    const { department, semester } = req.query;
    
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = semester;

    const students = await StudentModel.find(query)
      .select('registerNumber name department semester attendance')
      .lean();

    // Calculate summary
    const summary = students.reduce((acc, student) => {
      const key = `${student.department}-${student.semester}`;
      if (!acc[key]) {
        acc[key] = {
          department: student.department,
          semester: student.semester,
          totalStudents: 0,
          totalDays: 0,
          totalPresent: 0,
          totalAbsent: 0
        };
      }
      
      acc[key].totalStudents++;
      acc[key].totalDays += student.attendance.totalDays;
      acc[key].totalPresent += student.attendance.present;
      acc[key].totalAbsent += student.attendance.absent;
      
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      summary: Object.values(summary)
    });

  } catch (err) {
    console.error("Error fetching attendance summary:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};