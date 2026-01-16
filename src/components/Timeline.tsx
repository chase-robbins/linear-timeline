import React from 'react';
import type { Team, TimeRange, WorkflowState } from '../types/linear';
import { getDateRange, getDateRangeDays, formatDate, isToday } from '../utils/dateUtils';
import TeamMemberRow from './TeamMemberRow';

interface TimelineProps {
  team: Team;
  startDate: Date;
  timeRange: TimeRange;
  enabledStateIds: Set<string>;
  workflowStates: WorkflowState[];
}

const Timeline: React.FC<TimelineProps> = ({
  team,
  startDate,
  timeRange,
  enabledStateIds,
  workflowStates,
}) => {
  const dates = getDateRange(startDate, timeRange);
  const days = getDateRangeDays(timeRange);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days);

  const members = team.members?.nodes || [];
  const columnWidth = 100 / dates.length;

  // Calculate current time position as percentage of the timeline area
  const now = new Date();
  const rangeStart = startDate.getTime();
  const rangeEnd = endDate.getTime();
  const nowTime = now.getTime();
  const nowPercentage = ((nowTime - rangeStart) / (rangeEnd - rangeStart)) * 100;
  const showNowLine = nowPercentage >= 0 && nowPercentage <= 100;

  return (
    <div
      className="timeline"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e293b',
        overflow: 'hidden',
      }}
    >
      {/* Header row with date columns */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #334155',
          backgroundColor: '#0f172a',
          position: 'relative',
        }}
      >
        {/* Left spacer for member info column */}
        <div style={{ width: '200px', flexShrink: 0, borderRight: '1px solid #334155' }} />

        {/* Date headers container */}
        <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
          {/* Date columns */}
          <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
            {dates.map((date, index) => {
              const today = isToday(date);
              return (
                <div
                  key={index}
                  style={{
                    width: `${columnWidth}%`,
                    padding: '8px 4px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: today ? 600 : 400,
                    color: today ? '#3b82f6' : '#94a3b8',
                    backgroundColor: today ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderLeft: index > 0 ? '1px solid #334155' : 'none',
                  }}
                >
                  {formatDate(date)}
                </div>
              );
            })}
            {/* Now indicator in header */}
            {showNowLine && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${nowPercentage}%`,
                  width: '2px',
                  backgroundColor: '#ef4444',
                  zIndex: 50,
                }}
              />
            )}
          </div>
          {/* Scrollbar spacer to align with body */}
          <div style={{ width: '17px', flexShrink: 0 }} />
        </div>
      </div>

      {/* Timeline body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          scrollbarGutter: 'stable',
        }}
      >
        {/* Now line overlay - spans the full body (accounts for 200px sidebar) */}
        {showNowLine && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `calc(200px + (100% - 200px) * ${nowPercentage / 100})`,
              width: '2px',
              backgroundColor: '#ef4444',
              zIndex: 50,
              pointerEvents: 'none',
            }}
          />
        )}

        {members.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            No team members found
          </div>
        ) : (
          members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              startDate={startDate}
              endDate={endDate}
              enabledStateIds={enabledStateIds}
              workflowStates={workflowStates}
              dates={dates}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;
