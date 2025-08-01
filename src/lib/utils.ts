// Utility functions for formatting dates, numbers, and localization

// Indian Standard Time (IST) configuration
const IST_LOCALE = 'en-IN'
const IST_TIMEZONE = 'Asia/Kolkata'

// Supported locales
export const SUPPORTED_LOCALES = {
  'en': 'English',
  'or': 'ଓଡ଼ିଆ (Odia)'
}

// Default date format: DD/MM/YYYY
export const formatDate = (dateString: string | Date, locale: string = IST_LOCALE): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: IST_TIMEZONE
  }).format(date)
}

// Format date with time in IST
export const formatDateTime = (dateString: string | Date, locale: string = IST_LOCALE): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST_TIMEZONE,
    hour12: true
  }).format(date)
}

// Format numbers with Indian locale (commas for thousands)
export const formatNumber = (num: number, locale: string = IST_LOCALE): string => {
  return new Intl.NumberFormat(locale).format(num)
}

// Format currency in Indian Rupees
export const formatCurrency = (amount: number, currency: string = 'INR', locale: string = IST_LOCALE): string => {
  if (currency === 'INR') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  // For other currencies, use the currency code
  return `${amount.toLocaleString(locale)} ${currency}`
}

// Get current date in IST
export const getCurrentDateIST = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: IST_TIMEZONE}))
}

// Check if date is in IST business hours (9 AM - 6 PM IST)
export const isBusinessHoursIST = (date: Date = new Date()): boolean => {
  const istDate = new Date(date.toLocaleString("en-US", {timeZone: IST_TIMEZONE}))
  const hours = istDate.getHours()
  return hours >= 9 && hours < 18
}

// Convert UTC to IST display
export const utcToIST = (utcDate: string | Date): string => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  return formatDateTime(date)
}

// Relative time formatting (e.g., "2 hours ago")
export const formatRelativeTime = (dateString: string | Date, locale: string = IST_LOCALE): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const now = getCurrentDateIST()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return formatDate(date, locale)
  }
}

// API URL helper function for basePath support
export const getApiUrl = (path: string): string => {
  // Check if we're in the browser and if the basePath is in the URL
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    if (currentPath.startsWith('/project/openproposal')) {
      return `/project/openproposal${path}`
    }
  }
  return path
}
