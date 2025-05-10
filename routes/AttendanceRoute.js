import express from "express";
import { 
  markAttendance, 
  getAttendanceReport,
  getPeriodStatus,
  getAbsenteesWithParents,
  getPeriodAttendance
} from "../controllers/AttendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const AttendanceRoute = express.Router();


AttendanceRoute.post("/mark", authMiddleware, markAttendance);

AttendanceRoute.get("/report", authMiddleware, getAttendanceReport);

AttendanceRoute.get("/period-status", authMiddleware, getPeriodStatus);

AttendanceRoute.get("/absentees", authMiddleware, getAbsenteesWithParents);

AttendanceRoute.get("/period-attendance", authMiddleware, getPeriodAttendance);
export default AttendanceRoute;