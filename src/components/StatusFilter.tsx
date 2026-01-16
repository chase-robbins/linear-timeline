import React from 'react';
import type { WorkflowState } from '../types/linear';
import { defaultStatusColors } from '../utils/colorUtils';

interface StatusFilterProps {
  workflowStates: WorkflowState[];
  enabledStateIds: Set<string>;
  onStateToggle: (stateId: string) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ workflowStates, enabledStateIds, onStateToggle }) => {
  // Sort states by position
  const sortedStates = [...workflowStates].sort((a, b) => a.position - b.position);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const chipStyle = (color: string, isEnabled: boolean): React.CSSProperties => {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: isEnabled ? `${color}20` : '#1f2937',
      border: `1px solid ${isEnabled ? color : '#374151'}`,
      color: isEnabled ? color : '#6b7280',
    };
  };

  const dotStyle = (color: string, isEnabled: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isEnabled ? color : '#4b5563',
  });

  const checkmarkStyle: React.CSSProperties = {
    marginLeft: '4px',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle}>
      {sortedStates.map((state) => {
        const isEnabled = enabledStateIds.has(state.id);
        const color = state.color || defaultStatusColors[state.type] || '#6b7280';
        return (
          <button
            key={state.id}
            onClick={() => onStateToggle(state.id)}
            style={chipStyle(color, isEnabled)}
            onMouseEnter={(e) => {
              if (!isEnabled) {
                e.currentTarget.style.borderColor = '#4b5563';
                e.currentTarget.style.backgroundColor = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (!isEnabled) {
                e.currentTarget.style.borderColor = '#374151';
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
          >
            <span style={dotStyle(color, isEnabled)} />
            {state.name}
            {isEnabled && (
              <span style={checkmarkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StatusFilter;
