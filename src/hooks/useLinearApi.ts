import { useState, useCallback } from 'react';
import type { Team, TeamsQueryResponse, IssueState } from '../types/linear';

interface HistoryEntry {
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

interface MappedIssue {
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

const LINEAR_API_ENDPOINT = 'https://api.linear.app/graphql';

const TEAMS_QUERY = `
  query {
    teams {
      nodes {
        id
        name
      }
    }
  }
`;

// Query to get team info and members (without issues to keep complexity low)
const TEAM_MEMBERS_QUERY = `
  query GetTeamMembers($teamId: String!) {
    team(id: $teamId) {
      id
      name
      states {
        nodes {
          id
          name
          type
          color
          position
        }
      }
      members {
        nodes {
          id
          name
          displayName
        }
      }
    }
  }
`;

// Query to get paginated issues for a specific user
const USER_ISSUES_QUERY = `
  query GetUserIssues($userId: String!, $teamIdFilter: ID!, $startedAfter: DateTimeOrDuration!, $after: String) {
    user(id: $userId) {
      assignedIssues(
        first: 50
        after: $after
        filter: {
          team: { id: { eq: $teamIdFilter } }
          state: { type: { in: ["started", "completed"] } }
          startedAt: { gte: $startedAfter }
        }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          identifier
          title
          dueDate
          createdAt
          startedAt
          completedAt
          estimate
          state {
            id
            name
            type
          }
        }
      }
    }
  }
`;

const ISSUE_HISTORY_QUERY = `
  query GetIssueHistory($issueId: String!) {
    issue(id: $issueId) {
      id
      history(first: 20) {
        nodes {
          id
          createdAt
          fromState {
            id
            name
            type
          }
          toState {
            id
            name
            type
          }
        }
      }
    }
  }
`;

interface RawIssue {
  id: string;
  identifier: string;
  title: string;
  dueDate: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimate: number | null;
  state: {
    id: string;
    name: string;
    type: string;
  };
  history?: {
    nodes: HistoryEntry[];
  };
}

interface UseLinearApiReturn {
  fetchTeams: () => Promise<Team[]>;
  fetchTeamTimeline: (teamId: string, startedAfter: Date) => Promise<Team | null>;
  fetchIssueHistory: (issueId: string) => Promise<HistoryEntry[]>;
  loading: boolean;
  error: string | null;
}

export function useLinearApi(apiKey: string): UseLinearApiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(
    async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
      const response = await fetch(LINEAR_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey.startsWith('Bearer ') ? apiKey : apiKey,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error');
      }

      return result;
    },
    [apiKey]
  );

  const fetchTeams = useCallback(async (): Promise<Team[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await executeQuery<TeamsQueryResponse>(TEAMS_QUERY);
      return result.data.teams.nodes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [executeQuery]);

  // Helper to fetch all issues for a user with pagination
  const fetchAllUserIssues = useCallback(
    async (userId: string, teamId: string, startedAfter: Date): Promise<RawIssue[]> => {
      const allIssues: RawIssue[] = [];
      let cursor: string | null = null;
      let hasMore = true;

      interface UserIssuesResponse {
        data: {
          user: {
            assignedIssues: {
              pageInfo: { hasNextPage: boolean; endCursor: string | null };
              nodes: RawIssue[];
            };
          };
        };
      }

      while (hasMore) {
        try {
          const result: UserIssuesResponse = await executeQuery<UserIssuesResponse>(USER_ISSUES_QUERY, {
            userId,
            teamIdFilter: teamId,
            startedAfter: startedAfter.toISOString(),
            after: cursor,
          });

          const issues = result.data.user?.assignedIssues?.nodes || [];
          allIssues.push(...issues);

          hasMore = result.data.user?.assignedIssues?.pageInfo?.hasNextPage || false;
          cursor = result.data.user?.assignedIssues?.pageInfo?.endCursor || null;
        } catch {
          // Stop pagination on error, return what we have
          hasMore = false;
        }
      }

      return allIssues;
    },
    [executeQuery]
  );

  const fetchTeamTimeline = useCallback(
    async (teamId: string, startedAfter: Date): Promise<Team | null> => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch team info and members (without issues)
        const teamResult = await executeQuery<{
          data: {
            team: {
              id: string;
              name: string;
              states: { nodes: Array<{ id: string; name: string; type: string; color: string; position: number }> };
              members: { nodes: Array<{ id: string; name: string; displayName?: string }> };
            };
          };
        }>(TEAM_MEMBERS_QUERY, { teamId });

        const team = teamResult.data.team;
        if (!team) {
          throw new Error('Team not found');
        }

        // Step 2: Fetch all issues for each member in parallel (batched to avoid rate limits)
        const members = team.members?.nodes || [];
        const batchSize = 3; // Fetch 3 members' issues at a time
        const membersWithIssues: Array<{
          id: string;
          name: string;
          displayName?: string;
          assignedIssues: { nodes: MappedIssue[] };
        }> = [];

        for (let i = 0; i < members.length; i += batchSize) {
          const batch = members.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (member) => {
              const rawIssues = await fetchAllUserIssues(member.id, teamId, startedAfter);
              return {
                ...member,
                assignedIssues: {
                  nodes: rawIssues.map((issue): MappedIssue => {
                    // For completed issues: use completedAt or dueDate
                    // For in-progress issues: set targetDate to null (will be capped at "now" at render time)
                    const isCurrentlyCompleted = issue.state.type === 'completed';
                    const endDate = isCurrentlyCompleted
                      ? (issue.completedAt || issue.dueDate)
                      : null; // null signals "cap at current time" in TeamMemberRow

                    return {
                      id: issue.id,
                      identifier: issue.identifier,
                      title: issue.title,
                      startDate: issue.startedAt,
                      targetDate: endDate,
                      createdAt: issue.createdAt,
                      state: {
                        id: issue.state.id,
                        name: issue.state.name,
                        type: issue.state.type as IssueState['type'],
                      },
                      history: issue.history?.nodes || [],
                      estimate: issue.estimate ?? null,
                    };
                  }),
                },
              };
            })
          );
          membersWithIssues.push(...batchResults);
        }

        return {
          id: team.id,
          name: team.name,
          states: team.states,
          members: { nodes: membersWithIssues },
        } as Team;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team timeline';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [executeQuery, fetchAllUserIssues]
  );

  const fetchIssueHistory = useCallback(
    async (issueId: string): Promise<HistoryEntry[]> => {
      try {
        const result = await executeQuery<{ data: { issue: { id: string; history: { nodes: HistoryEntry[] } } } }>(
          ISSUE_HISTORY_QUERY,
          { issueId }
        );
        return result.data.issue?.history?.nodes || [];
      } catch {
        return [];
      }
    },
    [executeQuery]
  );

  return {
    fetchTeams,
    fetchTeamTimeline,
    fetchIssueHistory,
    loading,
    error,
  };
}
