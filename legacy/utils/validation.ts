// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateField = (value: string, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (rule.required && (!value || value.trim() === '')) {
      errors.push(rule.message || 'This field is required');
      continue;
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push(rule.message || `Minimum length is ${rule.minLength} characters`);
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push(rule.message || `Maximum length is ${rule.maxLength} characters`);
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors.push(rule.message || 'Invalid format');
    }

    if (value && rule.custom && !rule.custom(value)) {
      errors.push(rule.message || 'Invalid value');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateForm = (
  formData: Record<string, string>,
  validationRules: Record<string, ValidationRule[]>
): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(validationRules)) {
    const fieldResult = validateField(formData[field] || '', rules);
    if (!fieldResult.isValid) {
      errors[field] = fieldResult.errors;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Common validation rules
export const ValidationRules = {
  email: [
    { required: true, message: 'Email is required' },
    { 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: 'Please enter a valid email address' 
    },
  ],
  password: [
    { required: true, message: 'Password is required' },
    { minLength: 6, message: 'Password must be at least 6 characters' },
  ],
  name: [
    { required: true, message: 'Name is required' },
    { minLength: 2, message: 'Name must be at least 2 characters' },
    { maxLength: 50, message: 'Name cannot exceed 50 characters' },
  ],
  employeeId: [
    { required: true, message: 'Employee ID is required' },
    { 
      pattern: /^[A-Z0-9]+$/, 
      message: 'Employee ID must contain only uppercase letters and numbers' 
    },
  ],
  phone: [
    { 
      pattern: /^\+?[\d\s\-\(\)]+$/, 
      message: 'Please enter a valid phone number' 
    },
  ],
  time: [
    { 
      pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 
      message: 'Please enter time in HH:MM format' 
    },
  ],
};

// Specific validators
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidEmployeeId = (employeeId: string): boolean => {
  return /^[A-Z0-9]+$/.test(employeeId);
};

export const isValidTime = (time: string): boolean => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

export const isValidDate = (date: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};