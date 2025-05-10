import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import AttendanceModel from '../models/AttendanceModel.js';
import StudentModel from '../models/StudentModel.js';

let whatsappClient;


export const initWhatsappClient = () => {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      clientId: "whatsapp-client",
      dataPath: "./whatsapp_session" 
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  whatsappClient.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📱 QR generated - scan with your phone');
  });

  whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('❌ Auth failure:', msg);
  });

  whatsappClient.on('disconnected', (reason) => {
    console.error('⚠️ WhatsApp client disconnected:', reason);
  });

  whatsappClient.initialize();
};

// Get WhatsApp client status
export const getWhatsappStatus = async (req, res) => {
  try {
    if (!whatsappClient) {
      return res.status(500).json({
        success: false,
        status: 'Not initialized'
      });
    }

    const state = await whatsappClient.getState();
    res.status(200).json({
      success: true,
      status: state || 'Initializing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Function to format phone numbers for WhatsApp
const formatWhatsAppNumber = (number) => {
  if (!number) return null;
  

  let cleaned = number.replace(/\D/g, '');
  

  if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1);
  }
  

  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned + '@c.us';
};

export const sendAbsenteeNotifications = async (absentStudents, subjectName, date, period) => {
  try {
    if (!whatsappClient || !whatsappClient.info) {
      return {
        success: false,
        error: "WhatsApp client not connected"
      };
    }

    const formattedDate = new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const validatedStudents = await Promise.all(absentStudents.map(async (student) => {
      try {

        const studentRecord = await StudentModel.findOne({ 
          registerNumber: student.registerNumber 
        }).select('parentsNumber name registerNumber');
        
        if (!studentRecord) {
          console.error(`Student not found: ${student.registerNumber}`);
          return null;
        }

        const parentsNumber = studentRecord.parentsNumber;
        

        if (!parentsNumber || parentsNumber.trim() === '') {
          console.error(`No parents number for ${student.registerNumber}`);
          return null;
        }


        const whatsappId = formatWhatsAppNumber(parentsNumber);
        
        if (!whatsappId) {
          console.error(`Invalid phone number format for ${student.registerNumber}`);
          return null;
        }

        return {
          ...studentRecord.toObject(),
          whatsappId,
          formattedNumber: parentsNumber 
        };
      } catch (error) {
        console.error(`Error processing student ${student.registerNumber}:`, error);
        return null;
      }
    }));


    const validStudents = validatedStudents.filter(s => s !== null);
    
    if (validStudents.length === 0) {
      return {
        success: false,
        error: "No valid parents numbers found for notification"
      };
    }

    console.log('Valid students for notification:', validStudents);


    const results = await Promise.all(validStudents.map(async (student) => {
      try {
        const message = `Dear Parent,\n\nYour ward ${student.name} (${student.registerNumber}) was absent for ${subjectName} on ${formattedDate} (Period ${period}).\n\n- College Administration`;

        console.log(`Sending to ${student.whatsappId}: ${message}`);
        

        const chatId = student.whatsappId;
        const chat = await whatsappClient.getChatById(chatId).catch(() => null);
        
        if (!chat) {
          console.log(`Creating new chat for ${chatId}`);
        }
        

        await whatsappClient.sendMessage(chatId, message);
        
        return {
          success: true,
          registerNumber: student.registerNumber,
          parentsNumber: student.formattedNumber,
          name: student.name
        };
      } catch (error) {
        console.error(`Error sending to ${student.whatsappId}:`, error);
        return {
          success: false,
          registerNumber: student.registerNumber,
          parentsNumber: student.formattedNumber,
          name: student.name,
          error: error.message
        };
      }
    }));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: true,
      message: `Notifications sent: ${successful.length} successful, ${failed.length} failed`,
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      failedDetails: failed,
      results
    };
  } catch (error) {
    console.error("Error in sendAbsenteeNotifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};