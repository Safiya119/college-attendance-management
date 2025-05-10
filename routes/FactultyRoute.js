import express from "express";
import { 
  facultyLogin, 
  getFaculty,
  updateFaculty,
  changePassword,
  deleteFaculty, 
  getClassroomStudents, 
  updateBulkMarks,
  updateBulkAttendance,
  addFaculty,
  getFacultySubjects,
  checkSubjectAvailability
} from "../controllers/FacultyController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const FacultyRoute = express.Router();

// Authentication routes
FacultyRoute.post("/login", facultyLogin);
FacultyRoute.post("/signup", addFaculty);

// Add the new subject availability check route
FacultyRoute.get("/check-subject/:subjectCode",  checkSubjectAvailability);

// Protected profile routes
FacultyRoute.get("/me", authMiddleware, getFaculty);
FacultyRoute.put("/update", authMiddleware, updateFaculty);
FacultyRoute.post("/change-password", authMiddleware, changePassword);
FacultyRoute.delete("/delete", authMiddleware, deleteFaculty);

// Classroom management routes
FacultyRoute.get("/students", authMiddleware, getClassroomStudents);
FacultyRoute.post("/marks/bulk", authMiddleware, updateBulkMarks);
FacultyRoute.post("/attendance/bulk", authMiddleware, updateBulkAttendance);
FacultyRoute.get("/subjects", authMiddleware, getFacultySubjects);


export default FacultyRoute;