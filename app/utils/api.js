import axios from 'axios';
import { getAuthToken } from './auth';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Automatically attach token to all requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- HOD Attendance APIs ---
export const getFullDayAbsentees = async ({ date, department, semester }) => {
  try {
    const response = await api.get('/hod/absentees', {
      params: { 
        date,
        department,
        semester 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getAttendanceSummary = async ({ department, semester }) => {
  try {
    const response = await api.get('/hod/summary', {
      params: { 
        department,
        semester 
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

// --- Student APIs ---
export const addStudent = async (studentData) => {
  try {
    const response = await api.post('/student/add', studentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getStudents = async (filters = {}) => {
  try {
    const response = await api.get('/student/get', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const deleteStudent = async (registerNumber) => {
  try {
    const response = await api.delete('/student/delete', {
      data: { registerNumber },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const editStudent = async (studentData) => {
  try {
    const response = await api.put('/student/update', studentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

// --- Faculty APIs ---
export const facultyLogin = async (credentials) => {
  try {
    const response = await api.post('/faculty/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const facultySignup = async (facultyData) => {
  try {
    const response = await api.post('/faculty/signup', facultyData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getFacultyProfile = async () => {
  try {
    const response = await api.get('/faculty/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getClassroomStudents = async (subject) => {
  try {
    // Make sure we're passing all required parameters from the backend
    const params = {
      subjectCode: subject.subjectCode,
      subject: subject.name,       // Backend expects "subject", not "name"
      department: subject.department,
      semester: subject.semester
    };
    
    const response = await api.get('/faculty/students', { params });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || { error: 'Network Error', details: error.message };
  }
};

export const updateBulkMarks = async (data) => {
  try {
    const response = await api.post('/faculty/marks/bulk', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const updateBulkAttendance = async (data) => {
  try {
    const response = await api.post('/faculty/attendance/bulk', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getFacultySubjects = async () => {
  try {
    const response = await api.get('/faculty/subjects');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};


export const updateFacultyProfile = async (data) => {
  try {
    const response = await api.put('/faculty/update', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};


export const changeFacultyPassword = async (passwordData) => {
  try {
    const response = await api.post('/faculty/change-password', passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const deleteFacultyAccount = async () => {
  try {
    const response = await api.delete('/faculty/delete');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};



// --- Subject APIs ---
export const addNewSubject = async (subjectData) => {
  try {
    const response = await api.post('/subjects/add', subjectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const addBulkSubjects = async (subjectsArray) => {
  try {
    const response = await api.post('/subjects/add', subjectsArray);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getAllSubjects = async () => {
  try {
    const response = await api.get('/subjects/get');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getSubjectsByDeptAndSem = async (department, semester) => {
  try {
    const response = await api.get(`/subjects/get/${department}/${semester}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const updateSubject = async (id, updateData) => {
  try {
    const response = await api.put(`/subjects/update/${id}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const deleteSubject = async (id) => {
  try {
    const response = await api.delete(`/subjects/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getStudentByRegisterNumber = async (registerNumber) => {
  try {
    const response = await api.get(`/student/get/${registerNumber}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const markAttendance = async (data) => {
  try {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getAttendanceReport = async (params) => {
  try {
    const response = await api.get('/attendance/report', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};


export const getPeriodStatus = async(params)=>{
  try {
    const response = await api.get('/attendance/period-status', {params});
    return response.data;
  } catch (error) {
    throw error.response?.data || {error: 'Network Error'}
  }
}

export const getPeriodAttendance = async (params) => {
  try {
    const response = await api.get('/attendance/period-attendance', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};


export const checkSubjectAvailability = async (subjectCode) => {
  try {
    const response = await api.get(`/faculty/check-subject/${subjectCode}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Network Error' };
  }
};

export const getAbsenteesWithParents = async ({ date, period, subjectCode, semester }) => {
  try {
    const response = await api.get('/attendance/absentees', {
      params: { date, period, subjectCode, semester }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching absentees:", error.response?.data || error.message);
    throw error.response?.data || { error: error.message };
  }
};


export const sendAbsenteeNotification = async (absentStudents, subjectName, date, period) => {
  try {
    const response = await api.post('/whatsapp/notify', {
      absentStudents,
      subjectName,
      date,
      period
    });
    return response.data;
  } catch (error) {
    console.error("Error sending notifications:", error.response?.data || error.message);
    throw error.response?.data || { error: error.message };
  }
};

// Create a default export object with all the API functions
const apiModule = {
  getFullDayAbsentees,
  getAttendanceSummary,
  addStudent,
  getStudents,
  deleteStudent,
  editStudent,
  facultyLogin,
  facultySignup,
  getFacultyProfile,
  getClassroomStudents,
  updateBulkMarks,
  updateBulkAttendance,
  getFacultySubjects,
  updateFacultyProfile,
  changeFacultyPassword,
  deleteFacultyAccount,
  addNewSubject,
  addBulkSubjects,
  getAllSubjects,
  getSubjectsByDeptAndSem,
  updateSubject,
  deleteSubject,
  getStudentByRegisterNumber,
  markAttendance,
  getAttendanceReport,
  getPeriodStatus,
  checkSubjectAvailability,
  sendAbsenteeNotification,
  getAbsenteesWithParents,
  getPeriodAttendance
};

// Export as default
export default apiModule;