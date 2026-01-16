import React from 'react';
import type { TimeRange } from '../types/linear';
import { shiftDateRange, formatDateFull, getDateRangeDays } from '../utils/dateUtils';

interface HeaderProps {
  startDate: Date;
  timeRange: TimeRange;
  onStartDateChange: (date: Date) => void;
  onTimeRangeChange: (range: TimeRange) => void;
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '1w', label: '1 Week' },
  { value: '2w', label: '2 Weeks' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
];

const Header: React.FC<HeaderProps> = ({
  startDate,
  timeRange,
  onStartDateChange,
  onTimeRangeChange,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: '#111827',
    borderBottom: '1px solid #374151',
  };

  const leftSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const navButtonStyle: React.CSSProperties = {
    backgroundColor: '#374151',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#d1d5db',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.2s',
  };

  const dateRangeStyle: React.CSSProperties = {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: 500,
    minWidth: '200px',
    textAlign: 'center',
  };

  const timeRangeContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#1f2937',
    padding: '4px',
    borderRadius: '8px',
  };

  const timeRangeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    color: isActive ? '#ffffff' : '#9ca3af',
    fontSize: '14px',
    fontWeight: isActive ? 500 : 400,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const handleEarlier = () => {
    const newDate = shiftDateRange(startDate, timeRange, 'earlier');
    onStartDateChange(newDate);
  };

  const handleLater = () => {
    const newDate = shiftDateRange(startDate, timeRange, 'later');
    onStartDateChange(newDate);
  };

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + getDateRangeDays(timeRange) - 1);

  return (
    <header style={containerStyle}>
      <div style={leftSectionStyle}>
        <button
          onClick={handleEarlier}
          style={navButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Earlier
        </button>

        <div style={dateRangeStyle}>
          {formatDateFull(startDate)} - {formatDateFull(endDate)}
        </div>

        <button
          onClick={handleLater}
          style={navButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
        >
          Later
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div style={timeRangeContainerStyle}>
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeRangeChange(option.value)}
            style={timeRangeButtonStyle(timeRange === option.value)}
            onMouseEnter={(e) => {
              if (timeRange !== option.value) {
                e.currentTarget.style.backgroundColor = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (timeRange !== option.value) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </header>
  );
};

export default Header;
