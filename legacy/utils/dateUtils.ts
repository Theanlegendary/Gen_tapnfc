// Date and time utility functions

export const formatDate = (date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'iso':
      return d.toISOString().split('T')[0];
    default:
      return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
  }
};

export const formatTime = (date: Date | string, format: '12h' | '24h' = '24h'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === '12h') {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d)} ${formatTime(d)}`;
};

export const getTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return formatDate(d);
};

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

export const isThisWeek = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return d >= startOfWeek && d <= endOfWeek;
};

export const isThisMonth = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

export const getDateRange = (range: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const getDayOfWeek = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()];
};

export const getMonthName = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[d.getMonth()];
};

export const isWeekend = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const isBusinessDay = (date: Date | string): boolean => {
  return !isWeekend(date);
};

export const getBusinessDaysInMonth = (year: number, month: number): number => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let businessDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (isBusinessDay(date)) {
      businessDays++;
    }
  }
  
  return businessDays;
};

export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

export const timeStringToMinutes = (timeStr: string): number => {
  const { hours, minutes } = parseTimeString(timeStr);
  return hours * 60 + minutes;
};

export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const calculateTimeDifference = (startTime: string, endTime: string): number => {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  return endMinutes - startMinutes;
};

export const isTimeInRange = (time: string, startTime: string, endTime: string): boolean => {
  const timeMinutes = timeStringToMinutes(time);
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};