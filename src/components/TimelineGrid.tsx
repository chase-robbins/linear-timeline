import React from 'react';
import { formatDate, isToday } from '../utils/dateUtils';

interface TimelineGridProps {
  dates: Date[];
}

const TimelineGrid: React.FC<TimelineGridProps> = ({ dates }) => {
  const columnWidth = 100 / dates.length;

  return (
    <div className="timeline-grid" style={{ position: 'relative', width: '100%' }}>
      <div
        className="date-headers"
        style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        {dates.map((date, index) => {
          const today = isToday(date);
          return (
            <div
              key={index}
              className="date-header"
              style={{
                width: `${columnWidth}%`,
                padding: '8px 4px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: today ? 600 : 400,
                color: today ? '#3b82f6' : '#6b7280',
                backgroundColor: today ? '#eff6ff' : 'transparent',
                borderLeft: index > 0 ? '1px solid #e5e7eb' : 'none',
              }}
            >
              {formatDate(date)}
            </div>
          );
        })}
      </div>

      <div
        className="grid-lines"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          display: 'flex',
        }}
      >
        {dates.map((date, index) => {
          const today = isToday(date);
          return (
            <div
              key={index}
              className="grid-line"
              style={{
                width: `${columnWidth}%`,
                borderLeft: index > 0 ? '1px solid #e5e7eb' : 'none',
                backgroundColor: today ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                height: '100vh',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TimelineGrid;
