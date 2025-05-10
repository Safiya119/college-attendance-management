import FacultyModel from "../models/FacultyModel.js";
import StudentModel from "../models/StudentModel.js";
import SubjectModel from "../models/SubjectModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (faculty) => {
  return jwt.sign(
    { id: faculty._id, facultyId: faculty.facultyId },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

export const facultyLogin = async (req, res) => {
  try {
    const { facultyId, password } = req.body;
    
    const faculty = await FacultyModel.findOne({ facultyId }).select('+password');
    if (!faculty) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }

    const token = generateToken(faculty);
    faculty.password = undefined;

    res.status(200).json({
      success: true,
      token,
      faculty
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const getFaculty = async (req, res) => {
  try {
    const faculty = await FacultyModel.findById(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: "Faculty not found"
      });
    }
    res.status(200).json({
      success: true,
      faculty
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// In FacultyController.js - update the updateFaculty function
export const updateFaculty = async (req, res) => {
  try {
    const { name, email, department, subjects } = req.body;
    
    // Validate input
    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        error: "Please provide required fields"
      });
    }
    
    // Find faculty
    const faculty = await FacultyModel.findById(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: "Faculty not found"
      });
    }

    // Update basic info
    faculty.name = name;
    faculty.email = email;
    faculty.department = department;
    
    // Handle subjects - first remove all existing subjects
    faculty.subjects = [];
    
    // Then add the new subjects with proper validation
    if (subjects && Array.isArray(subjects)) {
      for (const subject of subjects) {
        // Verify the subject exists in the system
        const existingSubject = await SubjectModel.findOne({
          subjectCode: subject.subjectCode,
          department: subject.department,
          semester: subject.semester
        });
        
        if (!existingSubject) {
          return res.status(400).json({
            success: false,
            error: `Subject ${subject.subjectCode} not found in the system`
          });
        }
        
        faculty.subjects.push({
          name: existingSubject.subjectName,
          department: existingSubject.department,
          semester: existingSubject.semester,
          subjectCode: existingSubject.subjectCode
        });
      }
    }
    
    await faculty.save();
    
    res.status(200).json({
      success: true,
      faculty
    });
    
  } catch (err) {
    console.error("Error updating faculty:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "All password fields are required"
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "New passwords do not match"
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }
    
    // Find faculty
    const faculty = await FacultyModel.findById(req.user.id).select('+password');
    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: "Faculty not found"
      });
    }
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, faculty.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    faculty.password = hashedPassword;
    await faculty.save();
    
    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
    
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    // Find and delete faculty
    const faculty = await FacultyModel.findByIdAndDelete(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: "Faculty not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Faculty account deleted successfully"
    });
    
  } catch (err) {
    console.error("Error deleting faculty:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};





export const getClassroomStudents = async (req, res) => {
  try {
    const { subjectCode, subject, department, semester } = req.query;
    const facultyId = req.user.facultyId;

    const faculty = await FacultyModel.findOne({ facultyId });
    if (!faculty) {
      return res.status(404).json({ success: false, error: "Faculty not found" });
    }

    // Validate subject assignment
    const facultySubject = faculty.subjects.find(s =>
      s.subjectCode === subjectCode &&
      s.name === subject &&
      s.department === department &&
      s.semester === parseInt(semester)
    );

    if (!facultySubject) {
      return res.status(403).json({ success: false, error: "You are not assigned to this subject" });
    }

    const students = await StudentModel.find({
      department,
      semester: parseInt(semester)
    }).select('registerNumber rollNo name marks attendance');

    res.status(200).json({
      success: true,
      students,
      department,
      semester
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


export const getFacultySubjects = async (req, res) => {
  try {
    const faculty = await FacultyModel.findById(req.user.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        error: "Faculty not found"
      });
    }
    
    // Return all subjects the faculty teaches, regardless of department
    res.status(200).json({
      success: true,
      subjects: faculty.subjects
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


export const updateBulkMarks = async (req, res) => {
  try {
    const { department, semester, subjectCode, examType, marksData } = req.body;
    const facultyId = req.user.facultyId;

    // Validate input
    if (!department || !semester || !subjectCode || !examType || !marksData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // Verify subject exists
    const subject = await SubjectModel.findOne({
      subjectCode: subjectCode,
      department: department.toUpperCase(),
      semester: parseInt(semester)
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: "Subject not found in the system"
      });
    }

    // Verify faculty is assigned to this subject
    const faculty = await FacultyModel.findOne({ facultyId });
    if (!faculty) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access"
      });
    }

    // Validate marks data (0 is allowed)
    const invalidEntries = marksData.filter(m => {
      const markValue = parseFloat(m.marks);
      return isNaN(markValue) || markValue < 0 || markValue > 100;
    });

    if (invalidEntries.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid marks values (must be between 0-100)",
        invalidEntries: invalidEntries
      });
    }

    // Prepare bulk operations - update only the specific exam type
    const bulkOps = marksData.map(mark => ({
      updateOne: {
        filter: { 
          registerNumber: mark.registerNumber,
          department: department.toUpperCase(),
          semester: parseInt(semester)
        },
        update: {
          $set: {
            [`marks.${subjectCode}.subjectName`]: subject.subjectName,
            [`marks.${subjectCode}.${examType}`]: parseFloat(mark.marks),
            [`marks.${subjectCode}.lastUpdated`]: new Date(),
            [`marks.${subjectCode}.updatedBy`]: facultyId
          }
        }
      }
    }));

    const result = await StudentModel.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount,
      subjectCode: subjectCode,
      subjectName: subject.subjectName
    });
  } catch (err) {
    console.error("Error in updateBulkMarks:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


export const updateBulkAttendance = async (req, res) => {
  try {
    const { subject, date, department, semester, attendanceData } = req.body;
    const facultyId = req.user.facultyId;

    // Validate input
    if (!subject || !date || !department || !semester || !attendanceData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // Check if faculty is authorized for this subject
    const faculty = await FacultyModel.findOne({ facultyId });
    if (!faculty) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access"
      });
    }

    // Process attendance updates
    const bulkOps = attendanceData.map(record => ({
      updateOne: {
        filter: { 
          registerNumber: record.registerNumber,
          department: department.toUpperCase(),
          semester: parseInt(semester)
        },
        update: { 
          $inc: { 
            "attendance.totalDays": 1,
            [`attendance.${subject}.totalDays`]: 1,
            ...(record.status === 'present' ? {
              "attendance.present": 1,
              [`attendance.${subject}.present`]: 1
            } : {
              "attendance.absent": 1,
              [`attendance.${subject}.absent`]: 1
            })
          },
          $push: {
            "attendance.details": {
              date: new Date(date),
              subject,
              status: record.status,
              markedBy: facultyId
            }
          }
        }
      }
    }));

    const result = await StudentModel.bulkWrite(bulkOps);

    // Identify absent students for notification
    const absentStudents = attendanceData.filter(r => r.status === 'absent');


    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      updatedCount: result.nModified,
      absentCount: absentStudents.length
    });

  } catch (err) {
    console.error("Error updating attendance:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export const addFaculty = async (req, res) => {
  try {
    const { facultyId, name, email, password, department, subjects } = req.body;

    // Validation
    if (!facultyId || !name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields"
      });
    }

    // Check if faculty exists
    const existingFaculty = await FacultyModel.findOne({ $or: [{ facultyId }, { email }] });
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        error: "Faculty with this ID or email already exists"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Format subjects
    let formattedSubjects = [];
    if (subjects && Array.isArray(subjects)) {
      formattedSubjects = subjects.map(subject => ({
        name: subject.name,
        department: subject.department,
        semester: subject.semester,
        subjectCode: subject.subjectCode,
      }));
    }

    // Create faculty
    const faculty = await FacultyModel.create({
      facultyId,
      name,
      email,
      password: hashedPassword,
      department,
      subjects: formattedSubjects
    });

    // Generate token
    const token = generateToken(faculty);

    // Remove password from response
    faculty.password = undefined;

    res.status(201).json({
      success: true,
      token,
      faculty
    });

  } catch (err) {
    console.error("Error creating faculty:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



// Add to FacultyController.js
export const checkSubjectAvailability = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    
    // Check if any faculty has this subject assigned
    const facultyWithSubject = await FacultyModel.findOne({
      'subjects.subjectCode': subjectCode
    });
    
    if (facultyWithSubject) {
      return res.status(200).json({
        available: false,
        takenBy: {
          facultyId: facultyWithSubject.facultyId,
          name: facultyWithSubject.name
        }
      });
    }
    
    res.status(200).json({
      available: true
    });
    
  } catch (err) {
    console.error("Error checking subject availability:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};