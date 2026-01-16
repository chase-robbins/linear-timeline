import React from 'react';
import type { Issue } from '../types/linear';
import { getStatusColor } from '../utils/colorUtils';

interface IssueBarProps {
  issue: Issue;
  left: number;
  width: number;
}

const IssueBar: React.FC<IssueBarProps> = ({ issue, left, width }) => {
  const backgroundColor = getStatusColor(issue.state.type);

  return (
    <div
      className="issue-bar"
      style={{
        position: 'absolute',
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor,
        height: '24px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      }}
      title={issue.title}
    >
      <span
        style={{
          color: 'white',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {issue.identifier}
      </span>
    </div>
  );
};

export default IssueBar;
