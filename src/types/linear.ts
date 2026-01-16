export interface IssueState {
  id: string;
  name: string;
  type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' | 'triage';
}

export interface WorkflowState {
  id: string;
  name: string;
  type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' | 'triage';
  color: string;
  position: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  fromState: {
    id: string;
    name: string;
    type: string;
  } | null;
  toState: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  startDate: string | null;
  targetDate: string | null;
  createdAt: string;
  state: IssueState;
  history: HistoryEntry[];
  estimate: number | null;
}

export interface TeamMember {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  assignedIssues: {
    nodes: Issue[];
  };
}

export interface Team {
  id: string;
  name: string;
  members?: {
    nodes: TeamMember[];
  };
  states?: {
    nodes: WorkflowState[];
  };
}

export interface TeamsQueryResponse {
  data: {
    teams: {
      nodes: Team[];
    };
  };
}

export interface TeamTimelineQueryResponse {
  data: {
    team: Team;
  };
}

export type TimeRange = '1w' | '2w' | '1m' | '3m';

export type StatusType = 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' | 'triage';
