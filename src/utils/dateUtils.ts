import type { TimeRange } from '../types/linear';

export const getDateRangeDays = (range: TimeRange): number => {
  switch (range) {
    case '1w': return 7;
    case '2w': return 14;
    case '1m': return 30;
    case '3m': return 90;
    default: return 14;
  }
};

export const getDateRange = (startDate: Date, range: TimeRange): Date[] => {
  const days = getDateRangeDays(range);
  const dates: Date[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }

  return dates;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateFull = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  return new Date(dateStr);
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const shiftDateRange = (startDate: Date, range: TimeRange, direction: 'earlier' | 'later'): Date => {
  const days = getDateRangeDays(range);
  const newDate = new Date(startDate);
  const shift = direction === 'earlier' ? -days : days;
  newDate.setDate(newDate.getDate() + shift);
  return newDate;
};

export const calculateBarPosition = (
  issueStart: Date | null,
  issueEnd: Date | null,
  rangeStart: Date,
  rangeEnd: Date
): { left: number; width: number } | null => {
  if (!issueStart && !issueEnd) return null;

  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));

  const effectiveStart = issueStart || issueEnd!;
  const effectiveEnd = issueEnd || issueStart!;

  // If issue is completely outside the range
  if (effectiveEnd < rangeStart || effectiveStart > rangeEnd) {
    return null;
  }

  // Clamp to visible range
  const visibleStart = effectiveStart < rangeStart ? rangeStart : effectiveStart;
  const visibleEnd = effectiveEnd > rangeEnd ? rangeEnd : effectiveEnd;

  const startDays = (visibleStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
  const durationDays = Math.max(1, (visibleEnd.getTime() - visibleStart.getTime()) / (1000 * 60 * 60 * 24));

  const left = (startDays / totalDays) * 100;
  const width = (durationDays / totalDays) * 100;

  return { left, width: Math.max(width, 2) }; // Minimum 2% width for visibility
};

export interface StatusSegment {
  stateId: string;
  statusType: string;
  startTime: Date;
  endTime: Date;
  left: number;  // percentage within the bar
  width: number; // percentage within the bar
}

export interface HistoryEntryInput {
  createdAt: string;
  toState: {
    id: string;
    type: string;
  } | null;
}

export const calculateStatusSegments = (
  history: HistoryEntryInput[],
  currentStateId: string,
  currentStatus: string,
  issueCreatedAt: string,
  issueStart: Date,
  issueEnd: Date
): StatusSegment[] => {
  const segments: StatusSegment[] = [];
  const totalDuration = issueEnd.getTime() - issueStart.getTime();

  if (totalDuration <= 0) {
    // Single point in time, just return current status
    return [{
      stateId: currentStateId,
      statusType: currentStatus,
      startTime: issueStart,
      endTime: issueEnd,
      left: 0,
      width: 100,
    }];
  }

  // Sort history by createdAt ascending
  const sortedHistory = [...history]
    .filter(h => h.toState !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Build timeline of status changes
  interface StatusChange {
    time: Date;
    stateId: string;
    status: string;
  }

  const statusChanges: StatusChange[] = [];

  // Start with creation - we don't know the initial status from history,
  // but we can infer from the first history entry's fromState or use 'backlog' as default
  // For simplicity, start from the first recorded status change

  for (const entry of sortedHistory) {
    if (entry.toState) {
      statusChanges.push({
        time: new Date(entry.createdAt),
        stateId: entry.toState.id,
        status: entry.toState.type,
      });
    }
  }

  // If no history, just return single segment with current status
  if (statusChanges.length === 0) {
    return [{
      stateId: currentStateId,
      statusType: currentStatus,
      startTime: issueStart,
      endTime: issueEnd,
      left: 0,
      width: 100,
    }];
  }

  // Build segments from the changes within the issue's time range
  let currentTime = issueStart;
  let currentStateIdVar = '';
  let currentStatusType = 'backlog'; // Default initial status

  // Find the status that was active at issueStart by looking at history before that time
  for (const change of statusChanges) {
    if (change.time <= issueStart) {
      currentStateIdVar = change.stateId;
      currentStatusType = change.status;
    }
  }

  for (const change of statusChanges) {
    // Skip changes before our start
    if (change.time <= issueStart) {
      continue;
    }

    // If change is after our end, stop
    if (change.time >= issueEnd) {
      break;
    }

    // Create segment from currentTime to this change
    const segmentStart = currentTime;
    const segmentEnd = change.time;

    const left = ((segmentStart.getTime() - issueStart.getTime()) / totalDuration) * 100;
    const width = ((segmentEnd.getTime() - segmentStart.getTime()) / totalDuration) * 100;

    if (width > 0) {
      segments.push({
        stateId: currentStateIdVar,
        statusType: currentStatusType,
        startTime: segmentStart,
        endTime: segmentEnd,
        left,
        width,
      });
    }

    currentTime = change.time;
    currentStateIdVar = change.stateId;
    currentStatusType = change.status;
  }

  // Add final segment from last change to issueEnd
  const finalLeft = ((currentTime.getTime() - issueStart.getTime()) / totalDuration) * 100;
  const finalWidth = ((issueEnd.getTime() - currentTime.getTime()) / totalDuration) * 100;

  if (finalWidth > 0) {
    segments.push({
      stateId: currentStateIdVar || currentStateId,
      statusType: currentStatusType,
      startTime: currentTime,
      endTime: issueEnd,
      left: finalLeft,
      width: finalWidth,
    });
  }

  // If no segments were created (all changes were outside range), return single segment
  if (segments.length === 0) {
    return [{
      stateId: currentStateIdVar || currentStateId,
      statusType: currentStatusType,
      startTime: issueStart,
      endTime: issueEnd,
      left: 0,
      width: 100,
    }];
  }

  return segments;
};
