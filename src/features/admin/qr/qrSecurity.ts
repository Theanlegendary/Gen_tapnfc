import CryptoJS from 'crypto-js';

// Secret key for app signature - in production, this should be from environment variables
const APP_SECRET_KEY = 'ATTENDANCE_APP_SECRET_2025';
const APP_IDENTIFIER = 'com.mahaka.attendance';

export const generateAppSignature = (data: any): string => {
  const payload = {
    appId: APP_IDENTIFIER,
    timestamp: Date.now(),
    data: JSON.stringify(data)
  };
  
  return CryptoJS.HmacSHA256(JSON.stringify(payload), APP_SECRET_KEY).toString();
};

export const validateAppSignature = (qrData: any): boolean => {
  try {
    if (!qrData.appSignature || !qrData.type) {
      return false;
    }

    // Create expected signature
    const dataWithoutSignature = { ...qrData };
    delete dataWithoutSignature.appSignature;
    
    const expectedSignature = generateAppSignature(dataWithoutSignature);
    
    // Compare signatures
    return qrData.appSignature === expectedSignature;
  } catch {
    return false;
  }
};

export const isQRCodeExpired = (qrData: any): boolean => {
  if (!qrData.expiresAt) return false;
  return new Date() > new Date(qrData.expiresAt);
};

export const validateQRCodeStructure = (qrData: any): boolean => {
  const requiredFields = ['id', 'type', 'appSignature', 'createdAt', 'createdBy'];
  
  for (const field of requiredFields) {
    if (!qrData[field]) {
      return false;
    }
  }
  
  const validTypes = ['user_invite', 'attendance', 'event_invite'];
  const groupTypes = ['group_invite', 'group_attendance'];
  const allValidTypes = [...validTypes, ...groupTypes];
  if (!allValidTypes.includes(qrData.type)) {
    return false;
  }
  
  return true;
};

export const generateSecureQRData = (baseData: any, adminId: string): any => {
  const qrData = {
    ...baseData,
    id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    createdBy: adminId,
  };
  
  // Generate app signature
  qrData.appSignature = generateAppSignature(qrData);
  
  return qrData;
};
