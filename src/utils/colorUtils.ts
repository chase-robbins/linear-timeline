import type { StatusType, WorkflowState } from '../types/linear';

// Fallback colors for status types when no dynamic colors are available
export const defaultStatusColors: Record<StatusType, string> = {
  backlog: '#6b7280',    // gray
  unstarted: '#8b5cf6',  // purple (To Do)
  started: '#3b82f6',    // blue (In Progress)
  completed: '#22c55e',  // green (Done)
  canceled: '#ef4444',   // red
  triage: '#FC7840',     // orange
};

// Get color from workflow states by state ID
export const getColorByStateId = (
  stateId: string,
  workflowStates: WorkflowState[]
): string => {
  const state = workflowStates.find(s => s.id === stateId);
  return state?.color || '#6b7280';
};

// Get color from workflow states by state type (uses first matching state)
export const getColorByStateType = (
  stateType: StatusType,
  workflowStates: WorkflowState[]
): string => {
  const state = workflowStates.find(s => s.type === stateType);
  return state?.color || defaultStatusColors[stateType] || '#6b7280';
};

// Legacy function for backwards compatibility
export const getStatusColor = (statusType: StatusType): string => {
  return defaultStatusColors[statusType] || '#6b7280';
};

// Generate a consistent color from a string (for avatar backgrounds)
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#06b6d4', '#6366f1', '#f43f5e'
  ];
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from a name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
