import StudentModel from "../models/StudentModel.js";
import SubjectModel from "../models/SubjectModel.js";

// Add a new student
const addStudent = async (req, res) => {
  try {
    const studentData = req.body;

    // Bulk insert
    if (Array.isArray(studentData)) {
      const results = await Promise.all(studentData.map(async (student) => {
        try {
          const existingStudent = await StudentModel.findOne({
            $or: [
              { registerNumber: student.registerNumber },
              { email: student.email }
            ]
          });

          if (existingStudent) {
            return {
              success: false,
              registerNumber: student.registerNumber,
              error: "Student with this register number or email already exists"
            };
          }

          // Fetch subjects for the student's department and semester
          const subjects = await SubjectModel.find({
            department: student.department,
            semester: student.semester,
            isActive: true
          });

          // Initialize marks for each subject
          const marksMap = {};
          subjects.forEach(subject => {
            marksMap[subject.subjectCode] = {
              subjectName: subject.subjectName,
              cat1: 0,
              cat2: 0,
              modelExam: 0
            };
          });

          // Create new student with initialized marks
          const newStudent = new StudentModel({
            ...student,
            marks: marksMap
          });

          await newStudent.save();

          return {
            success: true,
            registerNumber: student.registerNumber,
            student: newStudent
          };
        } catch (error) {
          return {
            success: false,
            registerNumber: student.registerNumber,
            error: error.message
          };
        }
      }));

      const successfulAdds = results.filter(r => r.success);
      const failedAdds = results.filter(r => !r.success);

      return res.status(201).json({
        success: true,
        message: `Bulk add completed. ${successfulAdds.length} students added successfully, ${failedAdds.length} failed.`,
        results: results
      });
    }

    // Single student add
    else {
      const existingStudent = await StudentModel.findOne({
        $or: [
          { registerNumber: studentData.registerNumber },
          { email: studentData.email }
        ]
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          error: "Student with this register number or email already exists"
        });
      }

      const subjects = await SubjectModel.find({
        department: studentData.department,
        semester: studentData.semester,
        isActive: true
      });

      const marksMap = {};
      subjects.forEach(subject => {
        marksMap[subject.subjectCode] = {
          subjectName: subject.subjectName,
          cat1: 0,
          cat2: 0,
          modelExam: 0
        };
      });

      const newStudent = new StudentModel({
        ...studentData,
        marks: marksMap
      });

      await newStudent.save();

      return res.status(201).json({
        success: true,
        message: "Student added successfully with subjects",
        student: newStudent
      });
    }

  } catch (err) {
    console.error("Error Adding Student:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



const getStudents = async (req, res) => {
  try {
    const students = await StudentModel.find();

    res.status(200).json({ 
      success: true,
      totalStudents: students.length,
      students 
    });

  } catch (err) {
    console.error("Error Fetching Students:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};


const editStudent = async (req, res) => {
  try {
    const { registerNumber } = req.body;

 
    if (!registerNumber) {
      return res.status(400).json({ 
        success: false,
        message: "Register number is required" 
      });
    }

 
    const updateData = { ...req.body };
    delete updateData.registerNumber;
    delete updateData.email;

    const student = await StudentModel.findOneAndUpdate(
      { registerNumber },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Student updated successfully", 
      student 
    });
  } catch (err) {
    console.error("Error Editing Student:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};


const deleteStudent = async (req, res) => {
  try {
    const registerNumber = req.body.registerNumber;



 
    if (!registerNumber) {
      return res.status(400).json({ 
        success: false,
        message: "Register number is required" 
      });
    }

    const student = await StudentModel.findOneAndDelete({ registerNumber });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Student deleted successfully", 
      registerNumber 
    });
  } catch (err) {
    console.error("Error Deleting Student:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};


 const getStudentByRegisterNumber = async (req, res) => {
  try {
    const { registerNumber } = req.params;
    
    
    const student = await StudentModel.findOne({ registerNumber }).lean();
    if (!student) {
      console.log('Student not found'); // Debug log
      return res.status(404).json({
        success: false,
        error: "Student not found"
      });
    }

    
    // Get all subjects for the student's department and semester
    const subjects = await SubjectModel.find({
      department: student.department,
      semester: student.semester
    });
    
    
    // Format the marks data properly
    const formattedMarks = {};
    subjects.forEach(subject => {
      // Check if marks exist for this subject code
      const subjectMarks = student.marks[subject.subjectCode] || {};
      

      formattedMarks[subject.subjectCode] = {
        subjectName: subject.subjectName,
        cat1: subjectMarks.cat1 || 'NA',
        cat2: subjectMarks.cat2 || 'NA',
        modelExam: subjectMarks.modelExam || 'NA',
        _id: subjectMarks._id
      };
      
    });
    
    // Create response object
    const studentData = {
      ...student,
      marks: formattedMarks
    };
    
    
    res.status(200).json({
      success: true,
      student: studentData
    });
  } catch (err) {
    console.error('Error in getStudentByRegisterNumber:', err); // Debug log
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export { 
  addStudent, 
  getStudents, 
  deleteStudent,
  editStudent,
  getStudentByRegisterNumber
};