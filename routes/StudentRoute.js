import express from "express";
import { addStudent, getStudents, editStudent, deleteStudent, getStudentByRegisterNumber } from "../controllers/StudentController.js";

const studentRoute = express.Router();


studentRoute.post("/add", addStudent);
studentRoute.get("/get", getStudents);
studentRoute.put("/update", editStudent);
studentRoute.delete("/delete", deleteStudent);
// Add this to your studentRoute.js
studentRoute.get("/get/:registerNumber", getStudentByRegisterNumber);

export default studentRoute;