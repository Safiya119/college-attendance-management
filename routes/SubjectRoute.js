import express from "express";
import { 
  addSubject, 
  getAllSubjects, 
  getSubjectsByDepartmentAndSemester, 
  updateSubject, 
  deleteSubject,
} from "../controllers/SubjectController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Import if you want to protect routes

const subjectRoute = express.Router();

// Subject management routes
subjectRoute.post("/add", authMiddleware, addSubject); // Protected if needed
subjectRoute.get("/get", getAllSubjects);
subjectRoute.get("/get/:department/:semester", getSubjectsByDepartmentAndSemester);
subjectRoute.put("/update/:id", authMiddleware, updateSubject); // Protected
subjectRoute.delete("/delete/:id", authMiddleware, deleteSubject); // Protected

export default subjectRoute;