// Application-wide constants and configuration

// Timezone and Locale Configuration
export const APP_CONFIG = {
  // Only IST timezone support
  timezone: 'Asia/Kolkata',
  
  // Only English and Odia languages
  supportedLocales: {
    'en': 'English',
    'or': 'ଓଡ଼ିଆ (Odia)'
  },
  
  defaultLocale: 'en',
  
  // Date format: DD/MM/YYYY
  dateFormat: {
    day: '2-digit' as const,
    month: '2-digit' as const,
    year: 'numeric' as const
  },
  
  // Remove other timezones - only IST
  timeZones: {
    'Asia/Kolkata': 'India Standard Time (IST)'
  },
  
  // Default currency
  defaultCurrency: 'INR',
  
  // Business hours in IST
  businessHours: {
    start: 9, // 9 AM
    end: 18   // 6 PM
  }
}

// Supported currencies (limited set)
export const SUPPORTED_CURRENCIES = {
  'INR': '₹ (Indian Rupee)',
  'USD': '$ (US Dollar)',
  'EUR': '€ (Euro)',
  'GBP': '£ (British Pound)'
}

// User roles
export enum UserRole {
  PRINCIPAL_INVESTIGATOR = 'PRINCIPAL_INVESTIGATOR',
  CO_PRINCIPAL_INVESTIGATOR = 'CO_PRINCIPAL_INVESTIGATOR',
  PROGRAM_OFFICER = 'PROGRAM_OFFICER',
  CALL_COORDINATOR = 'CALL_COORDINATOR',
  REVIEWER = 'REVIEWER',
  AREA_CHAIR = 'AREA_CHAIR',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  INSTITUTIONAL_ADMIN = 'INSTITUTIONAL_ADMIN'
}

// Application limits
export const APP_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerUpload: 5,
  maxProposalDuration: 60, // months
  maxBudgetAmount: 10000000 // 1 crore INR
}

// Error messages
export const ERROR_MESSAGES = {
  INVALID_TOKEN: 'Authentication failed. Please login again.',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
  FILE_TOO_LARGE: 'File size exceeds 10MB limit.',
  INVALID_DATE_FORMAT: 'Please use DD/MM/YYYY format.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.'
}

// Success messages
export const SUCCESS_MESSAGES = {
  PROPOSAL_CREATED: 'Proposal created successfully.',
  PROPOSAL_UPDATED: 'Proposal updated successfully.',
  REVIEW_SUBMITTED: 'Review submitted successfully.',
  CALL_CREATED: 'Call for proposals created successfully.',
  SETTINGS_UPDATED: 'Settings updated successfully.'
}
