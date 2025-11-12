/**
 * Input validation and sanitization utilities
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Phone validation (Australian format)
export const isValidPhone = (phone: string): boolean => {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Australian mobile: starts with 04, followed by 8 digits
  // Landline: various formats
  const phoneRegex = /^(?:\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
  return phoneRegex.test(cleaned);
};

// Sanitize string input (prevent XSS)
export const sanitizeString = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Validate date is in the future
export const isValidFutureDate = (dateString: string): boolean => {
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

// Validate time format (HH:MM)
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Validate file size (in bytes)
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Validate file type
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Validate required field
export const isRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

// Validate minimum length
export const meetsMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

// Validate maximum length
export const meetsMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

// Validate number is positive
export const isPositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

// Validate number is within range
export const isInRange = (value: string | number, min: number, max: number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= min && num <= max;
};

// Comprehensive form validation
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule[];
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

export const validateForm = (
  data: Record<string, string>,
  rules: ValidationRules
): ValidationErrors => {
  const errors: ValidationErrors = {};

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const value = data[fieldName] || '';

    for (const rule of fieldRules) {
      // Check required
      if (rule.required && !isRequired(value)) {
        errors[fieldName] = rule.message;
        break;
      }

      // Skip other validations if field is empty and not required
      if (!value.trim() && !rule.required) continue;

      // Check min length
      if (rule.minLength && !meetsMinLength(value, rule.minLength)) {
        errors[fieldName] = rule.message;
        break;
      }

      // Check max length
      if (rule.maxLength && !meetsMaxLength(value, rule.maxLength)) {
        errors[fieldName] = rule.message;
        break;
      }

      // Check pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[fieldName] = rule.message;
        break;
      }

      // Check custom validation
      if (rule.custom && !rule.custom(value)) {
        errors[fieldName] = rule.message;
        break;
      }
    }
  }

  return errors;
};
