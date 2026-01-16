import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLinearApi } from './hooks/useLinearApi';
import ApiKeyInput from './components/ApiKeyInput';
import Header from './components/Header';
import StatusFilter from './components/StatusFilter';
import Timeline from './components/Timeline';
import type { Team, TimeRange, HistoryEntry, WorkflowState } from './types/linear';
import { getStartOfWeek } from './utils/dateUtils';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useLocalStorage<string>('linear-api-key', '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [startDate, setStartDate] = useState<Date>(() => getStartOfWeek(new Date()));
  const [timeRange, setTimeRange] = useState<TimeRange>('1w');
  const [enabledStateIds, setEnabledStateIds] = useState<Set<string>>(new Set());
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);

  const { fetchTeams, fetchTeamTimeline, fetchIssueHistory, loading, error } = useLinearApi(apiKey);

  // Function to enrich team data with issue history
  const enrichTeamWithHistory = useCallback(async (team: Team): Promise<Team> => {
    if (!team.members?.nodes) return team;

    // Collect all issue IDs
    const allIssues: { memberId: string; issueIndex: number; issueId: string }[] = [];
    team.members.nodes.forEach((member, memberIndex) => {
      member.assignedIssues.nodes.forEach((issue, issueIndex) => {
        allIssues.push({
          memberId: member.id,
          issueIndex,
          issueId: issue.id,
        });
      });
    });

    // Fetch history for all issues in parallel (batch of 10 at a time to avoid rate limits)
    const batchSize = 10;
    const historyMap = new Map<string, HistoryEntry[]>();

    for (let i = 0; i < allIssues.length; i += batchSize) {
      const batch = allIssues.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async ({ issueId }) => {
          const history = await fetchIssueHistory(issueId);
          return { issueId, history };
        })
      );
      results.forEach(({ issueId, history }) => {
        historyMap.set(issueId, history);
      });
    }

    // Create enriched team with history data
    const enrichedTeam: Team = {
      ...team,
      members: {
        nodes: team.members.nodes.map((member) => ({
          ...member,
          assignedIssues: {
            nodes: member.assignedIssues.nodes.map((issue) => ({
              ...issue,
              history: historyMap.get(issue.id) || [],
            })),
          },
        })),
      },
    };

    return enrichedTeam;
  }, [fetchIssueHistory]);

  // Fetch teams when API key changes
  useEffect(() => {
    if (apiKey) {
      fetchTeams().then((fetchedTeams) => {
        if (fetchedTeams) {
          setTeams(fetchedTeams);
          if (fetchedTeams.length > 0 && !selectedTeamId) {
            // Prefer a team with "Engineering" in the name
            const engineeringTeam = fetchedTeams.find(t =>
              t.name.toLowerCase().includes('engineering')
            );
            setSelectedTeamId(engineeringTeam?.id || fetchedTeams[0].id);
          }
        }
      });
    } else {
      setTeams([]);
      setSelectedTeamId('');
      setSelectedTeam(null);
    }
  }, [apiKey, fetchTeams]);

  // Fetch team timeline when team selection or date range changes
  useEffect(() => {
    if (apiKey && selectedTeamId) {
      // Calculate startedAfter as 7 days before the viewport start
      const startedAfter = new Date(startDate);
      startedAfter.setDate(startedAfter.getDate() - 7);

      fetchTeamTimeline(selectedTeamId, startedAfter).then(async (team) => {
        if (team) {
          // Set initial team without history
          setSelectedTeam(team);

          // Extract and set workflow states
          if (team.states?.nodes) {
            setWorkflowStates(team.states.nodes);
            // Only enable "started" and "completed" states by default
            const activeStates = team.states.nodes.filter(
              s => s.type === 'started' || s.type === 'completed'
            );
            setEnabledStateIds(new Set(activeStates.map(s => s.id)));
          }

          // Then fetch and enrich with history in background
          const enrichedTeam = await enrichTeamWithHistory(team);
          setSelectedTeam(enrichedTeam);
        }
      });
    } else {
      setSelectedTeam(null);
      setWorkflowStates([]);
      setEnabledStateIds(new Set());
    }
  }, [apiKey, selectedTeamId, startDate, fetchTeamTimeline, enrichTeamWithHistory]);

  const handleStateToggle = (stateId: string) => {
    setEnabledStateIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stateId)) {
        newSet.delete(stateId);
      } else {
        newSet.add(stateId);
      }
      return newSet;
    });
  };

  return (
    <div className="app">
      <div className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">Linear Team Timeline</h1>
          {apiKey && teams.length > 0 && (
            <select
              className="team-selector"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="top-bar-right">
          <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {!apiKey ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔑</div>
          <h2>Enter your Linear API Key</h2>
          <p>You can find your API key in Linear under Settings → API → Personal API keys</p>
        </div>
      ) : loading && !selectedTeam ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : selectedTeam ? (
        <div className="main-content">
          <Header
            startDate={startDate}
            timeRange={timeRange}
            onStartDateChange={setStartDate}
            onTimeRangeChange={setTimeRange}
          />
          <div className="status-filter-bar">
            <StatusFilter
              workflowStates={workflowStates}
              enabledStateIds={enabledStateIds}
              onStateToggle={handleStateToggle}
            />
          </div>
          <Timeline
            team={selectedTeam}
            startDate={startDate}
            timeRange={timeRange}
            enabledStateIds={enabledStateIds}
            workflowStates={workflowStates}
          />
        </div>
      ) : teams.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h2>No teams found</h2>
          <p>Make sure your API key has access to at least one team</p>
        </div>
      ) : null}
    </div>
  );
}

export default App;
