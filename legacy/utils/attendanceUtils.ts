import { AttendanceRecord, AttendanceStats, QRCodeData, AttendanceSettings } from '@/types/attendance';
import { validateAppSignature, validateQRCodeStructure, isQRCodeExpired } from './qrSecurity';
import { QRCodeData as NewQRCodeData } from '@/types/qr';

// Default attendance settings
export const DEFAULT_SETTINGS: AttendanceSettings = {
  workStartTime: '09:00',
  workEndTime: '17:00',
  lateThresholdMinutes: 15, // 15 minutes grace period
  allowEarlyCheckIn: true,
  requireLocation: false,
};

export const calculateAttendanceStats = (records: AttendanceRecord[]): AttendanceStats => {
  const present = records.filter(record => record.status === 'Present').length;
  const late = records.filter(record => record.status === 'Late').length;
  const absent = records.filter(record => record.status === 'Absent').length;
  const weekOff = records.filter(record => record.status === 'WeekOff').length;
  const holiday = records.filter(record => record.status === 'Holiday').length;
  const total = records.length;
  
  const workingDays = total - weekOff - holiday;
  const attendedDays = present + late;
  const percentage = workingDays > 0 ? (attendedDays / workingDays) * 100 : 0;

  return {
    present,
    late,
    absent,
    weekOff,
    holiday,
    total,
    percentage: Math.round(percentage * 100) / 100,
  };
};

export const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const parseQRCode = (data: string): QRCodeData | null => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(data);
    
    // Check if it's a new secure QR code
    if (parsed.appSignature && parsed.type) {
      // Validate structure
      if (!validateQRCodeStructure(parsed)) {
        return null;
      }
      
      // Validate app signature
      if (!validateAppSignature(parsed)) {
        return null;
      }
      
      // Check expiration
      if (isQRCodeExpired(parsed)) {
        return null;
      }
      
      // Handle different QR types
      if (parsed.type === 'attendance') {
        return {
          officeId: parsed.officeId,
          locationName: parsed.locationName,
          timestamp: parsed.createdAt,
          type: 'checkin',
        };
      }
      
      // For user_invite and event_invite, return null as they need special handling
      return null;
    }
    
    // Legacy QR code format
    if (parsed.officeId && parsed.locationName) {
      return {
        officeId: parsed.officeId,
        locationName: parsed.locationName,
        timestamp: parsed.timestamp || new Date().toISOString(),
        type: parsed.type || 'checkin',
      };
    }
    return null;
  } catch {
    // If not JSON, treat as simple office ID (legacy)
    return {
      officeId: data,
      locationName: 'Office Entrance',
      timestamp: new Date().toISOString(),
      type: 'checkin',
    };
  }
};

export const parseSecureQRCode = (data: string): NewQRCodeData | null => {
  try {
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (!validateQRCodeStructure(parsed)) {
      return null;
    }
    
    // Validate app signature
    if (!validateAppSignature(parsed)) {
      return null;
    }
    
    // Check expiration
    if (isQRCodeExpired(parsed)) {
      return null;
    }
    
    return parsed as NewQRCodeData;
  } catch {
    return null;
  }
};
export const determineAttendanceStatus = (
  checkInTime: Date,
  settings: AttendanceSettings = DEFAULT_SETTINGS
): 'Present' | 'Late' => {
  const workStart = parseTimeString(settings.workStartTime);
  const checkIn = new Date(checkInTime);
  
  // Set the work start time for today
  const todayWorkStart = new Date(checkIn);
  todayWorkStart.setHours(workStart.hours, workStart.minutes, 0, 0);
  
  // Add grace period
  const lateThreshold = new Date(todayWorkStart);
  lateThreshold.setMinutes(lateThreshold.getMinutes() + settings.lateThresholdMinutes);
  
  return checkIn <= lateThreshold ? 'Present' : 'Late';
};

export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

export const calculateWorkingHours = (checkIn: string, checkOut?: string): number => {
  if (!checkOut) return 0;
  
  const checkInTime = new Date(`1970-01-01T${checkIn}`);
  const checkOutTime = new Date(`1970-01-01T${checkOut}`);
  
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
};

export const generateAttendanceRecord = (
  userId: string,
  employeeId: string,
  employeeName: string,
  qrCodeData: QRCodeData,
  location?: { latitude: number; longitude: number }
): AttendanceRecord => {
  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);
  const status = determineAttendanceStatus(now);

  return {
    id: `${employeeId}-${Date.now()}`,
    userId,
    employeeId,
    employeeName,
    date: dateStr,
    checkInTime: timeStr,
    status,
    location,
    qrCodeData: JSON.stringify(qrCodeData),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const isHoliday = (date: Date, holidays: string[] = []): boolean => {
  const dateStr = formatDate(date);
  return holidays.includes(dateStr);
};

export const getAttendanceMessage = (status: 'Present' | 'Late'): string => {
  switch (status) {
    case 'Present':
      return 'Great! You\'re on time. Have a productive day!';
    case 'Late':
      return 'You\'re running late today. Please try to arrive on time.';
    default:
      return 'Attendance recorded successfully!';
  }
};

export const validateQRCode = (qrData: QRCodeData): boolean => {
  // Enhanced validation for QR codes
  if (!qrData.officeId || !qrData.locationName) {
    return false;
  }
  
  // Additional validation can be added here
  return true;
};

export const validateSecureQRCode = (qrData: NewQRCodeData): boolean => {
  return validateAppSignature(qrData) && 
         validateQRCodeStructure(qrData) && 
         !isQRCodeExpired(qrData);
};
