import React, { useState } from 'react';
import type { TeamMember, WorkflowState } from '../types/linear';
import { getInitials, stringToColor, getColorByStateId, defaultStatusColors } from '../utils/colorUtils';
import { calculateBarPosition, parseDate, isToday, calculateStatusSegments } from '../utils/dateUtils';

interface TeamMemberRowProps {
  member: TeamMember;
  startDate: Date;
  endDate: Date;
  enabledStateIds: Set<string>;
  workflowStates: WorkflowState[];
  dates: Date[];
}

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({
  member,
  startDate,
  endDate,
  enabledStateIds,
  workflowStates,
  dates,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const displayName = member.displayName || member.name;
  const initials = getInitials(displayName);
  const avatarColor = stringToColor(displayName);
  const columnWidth = 100 / dates.length;

  // Create a map of state ID to color for quick lookups
  const stateColorMap = new Map(workflowStates.map(s => [s.id, s.color]));

  // Helper to get color for a state (by ID or type)
  const getColorForState = (stateId: string, stateType: string): string => {
    return stateColorMap.get(stateId) ||
           getColorByStateId(stateId, workflowStates) ||
           defaultStatusColors[stateType as keyof typeof defaultStatusColors] ||
           '#6b7280';
  };

  // Get enabled state types from the enabled state IDs
  const enabledStateTypes = new Set(
    workflowStates
      .filter(s => enabledStateIds.has(s.id))
      .map(s => s.type)
  );

  // Filter issues by state type (not state ID) to handle cross-team issues
  // Then sort by completion date (targetDate) ascending
  const filteredIssues = member.assignedIssues.nodes
    .filter((issue) => enabledStateTypes.has(issue.state.type))
    .sort((a, b) => {
      const dateA = parseDate(a.targetDate) || parseDate(a.startDate) || parseDate(a.createdAt);
      const dateB = parseDate(b.targetDate) || parseDate(b.startDate) || parseDate(b.createdAt);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });

  // Calculate visible issues (those within the date range)
  const now = new Date();
  const visibleIssues = filteredIssues.filter((issue) => {
    const issueStart = parseDate(issue.startDate) || parseDate(issue.createdAt);
    const issueEnd = issue.targetDate
      ? parseDate(issue.targetDate)
      : (issueStart ? now : null);
    return calculateBarPosition(issueStart, issueEnd, startDate, endDate) !== null;
  });

  const issueCount = filteredIssues.length;
  const visibleCount = visibleIssues.length;
  const issueBarHeight = 24;
  const rowHeight = isExpanded ? Math.max(visibleCount * (issueBarHeight + 4) + 8, 40) : 0;

  return (
    <div style={{ borderBottom: '1px solid #334155' }}>
      {/* Member header row */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#1e293b',
        }}
      >
        {/* Left: Member info */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '200px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            cursor: 'pointer',
            borderRight: '1px solid #334155',
            backgroundColor: '#1e293b',
          }}
        >
          <span
            style={{
              marginRight: '8px',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: '#64748b',
              fontSize: '10px',
            }}
          >
            ▶
          </span>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              marginRight: '10px',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontWeight: 500,
                fontSize: '13px',
                color: '#e2e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </div>
          </div>
        </div>

        {/* Right: Grid background for header row */}
        <div style={{ flex: 1, display: 'flex', minHeight: '44px' }}>
          {dates.map((date, index) => {
            const today = isToday(date);
            return (
              <div
                key={index}
                style={{
                  width: `${columnWidth}%`,
                  borderLeft: index > 0 ? '1px solid #334155' : 'none',
                  backgroundColor: today ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Expanded issues area */}
      {isExpanded && visibleCount > 0 && (
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0f172a',
          }}
        >
          {/* Left spacer */}
          <div
            style={{
              width: '200px',
              flexShrink: 0,
              borderRight: '1px solid #334155',
            }}
          />

          {/* Right: Timeline area with issues */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              height: `${rowHeight}px`,
            }}
          >
            {/* Grid lines */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
              {dates.map((date, index) => {
                const today = isToday(date);
                return (
                  <div
                    key={index}
                    style={{
                      width: `${columnWidth}%`,
                      borderLeft: index > 0 ? '1px solid #334155' : 'none',
                      backgroundColor: today ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    }}
                  />
                );
              })}
            </div>

            {/* Issue bars */}
            {filteredIssues
              .map((issue) => {
                // Use createdAt as fallback start
                const issueStart = parseDate(issue.startDate) || parseDate(issue.createdAt);
                // For in-progress issues (targetDate is null), cap at current time
                // For completed issues, use the targetDate (which is completedAt)
                const issueEnd = issue.targetDate
                  ? parseDate(issue.targetDate)
                  : (issueStart ? now : null);
                const position = calculateBarPosition(issueStart, issueEnd, startDate, endDate);
                return { issue, position, issueStart, issueEnd };
              })
              .filter((item) => item.position !== null)
              .map((item, visibleIndex) => {
                const { issue, position, issueStart, issueEnd } = item;

                // Calculate status segments for this issue
                const segments = calculateStatusSegments(
                  issue.history || [],
                  issue.state.id,
                  issue.state.type,
                  issue.createdAt,
                  issueStart!,
                  issueEnd!
                );

                const linearUrl = `https://linear.app/issue/${issue.identifier}`;

                return (
                  <div
                    key={issue.id}
                    className="issue-bar"
                    onClick={() => window.open(linearUrl, '_blank')}
                    style={{
                      position: 'absolute',
                      top: `${visibleIndex * (issueBarHeight + 4) + 4}px`,
                      left: `${position!.left}%`,
                      width: `${Math.max(position!.width, 3)}%`,
                      height: `${issueBarHeight}px`,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      overflow: 'visible',
                      backgroundColor: '#1e293b',
                    }}
                  >
                    {/* Tooltip */}
                    <div className="issue-tooltip">
                      <div className="issue-tooltip-id">{issue.identifier}</div>
                      <div className="issue-tooltip-title">{issue.title}</div>
                      <div className="issue-tooltip-status">Status: {issue.state.name}</div>
                      <div className="issue-tooltip-hint">Click to open in Linear</div>
                    </div>
                    {/* Render segments */}
                    {segments.map((segment, segIndex) => {
                      const segmentColor = getColorForState(segment.stateId, segment.statusType);
                      const isFirst = segIndex === 0;
                      const isLast = segIndex === segments.length - 1;

                      return (
                        <div
                          key={segIndex}
                          style={{
                            position: 'absolute',
                            left: `${segment.left}%`,
                            width: `${segment.width}%`,
                            height: '100%',
                            backgroundColor: segmentColor,
                            borderTopLeftRadius: isFirst ? '4px' : '0',
                            borderBottomLeftRadius: isFirst ? '4px' : '0',
                            borderTopRightRadius: isLast ? '4px' : '0',
                            borderBottomRightRadius: isLast ? '4px' : '0',
                          }}
                        />
                      );
                    })}
                    {/* Issue identifier with points */}
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '0 6px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      {issue.identifier}{issue.estimate != null ? ` (${issue.estimate})` : ''}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberRow;
