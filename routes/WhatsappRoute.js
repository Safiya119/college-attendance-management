// routes/WhatsappRoute.js
import express from "express";
import { 
  initWhatsappClient, 
  sendAbsenteeNotifications,
  getWhatsappStatus
} from "../controllers/WhatsappController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const WhatsappRoute = express.Router();

// Initialize WhatsApp client when server starts
initWhatsappClient();

// Route to send attendance notifications
WhatsappRoute.post("/notify", authMiddleware, async (req, res) => {
  try {
    const { absentStudents, subjectName, date, period } = req.body;
    
    // Validate required fields
    if (!subjectName || !date || !period) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: subjectName, date, or period"
      });
    }
    
    // Call the controller function to send notification
    const result = await sendAbsenteeNotifications(
      absentStudents,
      subjectName,
      date,
      period
    );

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route to check WhatsApp connection status
WhatsappRoute.get("/status", authMiddleware, getWhatsappStatus);

export default WhatsappRoute;