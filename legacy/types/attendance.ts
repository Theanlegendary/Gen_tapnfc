export interface AttendanceRecord {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'Present' | 'Late' | 'Absent' | 'WeekOff' | 'Holiday';
  location?: {
    latitude: number;
    longitude: number;
  };
  qrCodeData: string;
  workingHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  contact: string;
  designation: string;
  address: string;
  profileImage?: string;
  workStartTime: string; // e.g., "09:00"
  workEndTime: string;   // e.g., "17:00"
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  weekOff: number;
  holiday: number;
  total: number;
  percentage: number;
}

export interface QRCodeData {
  officeId: string;
  locationName: string;
  timestamp: string;
  type: 'checkin' | 'checkout';
}

export interface AttendanceSettings {
  workStartTime: string;
  workEndTime: string;
  lateThresholdMinutes: number;
  allowEarlyCheckIn: boolean;
  requireLocation: boolean;
}