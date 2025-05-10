import SubjectModel from "../models/SubjectModel.js";

// Add a new subject
const addSubject = async (req, res) => {
  try {
    const subjectData = req.body;

    // Handle bulk add (array of subjects)
    if (Array.isArray(subjectData)) {
      const results = await Promise.all(subjectData.map(async (subject) => {
        // Check if subject already exists
        const existingSubject = await SubjectModel.findOne({
          subjectCode: subject.subjectCode,
          department: subject.department,
          semester: subject.semester
        });

        if (existingSubject) {
          return {
            success: false,
            subjectCode: subject.subjectCode,
            error: "Subject with this code already exists for this department and semester"
          };
        } 

        const newSubject = new SubjectModel(subject);
        await newSubject.save();
        return {
          success: true,
          subjectCode: subject.subjectCode,
          subject: newSubject
        };
      }));

      const successfulAdds = results.filter(r => r.success);
      const failedAdds = results.filter(r => !r.success);

      return res.status(201).json({
        success: true,
        message: `Bulk add completed. ${successfulAdds.length} subjects added successfully, ${failedAdds.length} failed.`,
        results: results
      });
    }
    // Handle single subject add
    else {
      const existingSubject = await SubjectModel.findOne({
        subjectCode: subjectData.subjectCode,
        department: subjectData.department,
        semester: subjectData.semester
      });

      if (existingSubject) {
        return res.status(400).json({
          success: false,
          error: "Subject with this code already exists for this department and semester"
        });
      }

      const newSubject = new SubjectModel(subjectData);
      await newSubject.save();

      return res.status(201).json({
        success: true,
        message: "Subject added successfully",
        subject: newSubject
      });
    }
  } catch (err) {
    console.error("Error Adding Subject:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all subjects
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await SubjectModel.find().sort({ department: 1, semester: 1, subjectName: 1 });

    res.status(200).json({
      success: true,
      totalSubjects: subjects.length,
      subjects
    });
  } catch (err) {
    console.error("Error Fetching Subjects:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get subjects by department and semester
const getSubjectsByDepartmentAndSemester = async (req, res) => {
  try {
    const { department, semester } = req.params;

    // Validate semester
    const semesterNum = parseInt(semester);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      return res.status(400).json({
        success: false,
        error: "Invalid semester. Must be between 1 and 8"
      });
    }

    const subjects = await SubjectModel.find({
      department: department,
      semester: semesterNum
    }).sort({ subjectName: 1 });

    res.status(200).json({
      success: true,
      totalSubjects: subjects.length,
      subjects
    });
  } catch (err) {
    console.error("Error Fetching Subjects by Department and Semester:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Update subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent changing the unique identifiers
    if (updateData.subjectCode || updateData.department || updateData.semester) {
      return res.status(400).json({
        success: false,
        message: "Cannot update subject code, department, or semester. Create a new subject instead."
      });
    }

    const subject = await SubjectModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject
    });
  } catch (err) {
    console.error("Error Updating Subject:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Delete subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await SubjectModel.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      subjectCode: subject.subjectCode
    });
  } catch (err) {
    console.error("Error Deleting Subject:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export {
  addSubject,
  getAllSubjects,
  getSubjectsByDepartmentAndSemester,
  updateSubject,
  deleteSubject
};