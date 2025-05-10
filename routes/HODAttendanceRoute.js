import express from "express";
import { 
  getFullDayAbsentees,
  getAttendanceSummary
} from "../controllers/HODAttendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const HODRouter = express.Router();

// Get full-day absentees
HODRouter.get("/absentees", authMiddleware, getFullDayAbsentees);

// Get attendance summary
HODRouter.get("/summary", authMiddleware, getAttendanceSummary);

export default HODRouter;