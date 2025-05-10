import express, { application } from "express";
import cors from "cors";
import "dotenv/config";
import bodyParser from 'body-parser';
import connectDb from "./config/mongodb.js";
import StudentRoute from "./routes/StudentRoute.js";
import studentRoute from "./routes/StudentRoute.js";
import FacultyRoute from "./routes/FactultyRoute.js";
import SubjectRoute from "./routes/SubjectRoute.js"
import AttendanceRouter from "./routes/AttendanceRoute.js";
import HODRouter from "./routes/HODAttendanceRoute.js";
import WhatsappRoute from "./routes/WhatsappRoute.js";

const app = express();
const port = process.env.PORT || 5000;

connectDb();

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// API Endpoints
app.use('/api/student', studentRoute)
app.use('/api/faculty', FacultyRoute)
app.use('/api/subjects', SubjectRoute)
app.use('/api/attendance',AttendanceRouter)
app.use('/api/HOD/', HODRouter)
app.use('/api/whatsapp', WhatsappRoute)

app.get("/", (req, res) => {
  res.send("College Exam Management System");
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));