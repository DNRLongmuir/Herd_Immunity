import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { GameState, GridNode, NodeState, SessionData } from './types';
import Grid from './Grid';
import InfectionArrows from './InfectionArrows';
import StatePalette from './StatePalette';
import InfectionModeToggle from './InfectionModeToggle';
import VaccinationEfficacyToggle from './VaccinationEfficacyToggle';
import TimeSeriesChart from './TimeSeriesChart';

const createInitialNodes = (rows: number, cols: number) => {
  const nodes: Record<string, GridNode> = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `r${r}c${c}`;
      nodes[id] = {
        id,
        row: r,
        col: c,
        state: "Susceptible",
      };
    }
  }
  return nodes;
};

const initialGameState: GameState = {
  gridSize: { rows: 5, cols: 5 },
  nodes: createInitialNodes(5, 5),
  history: [],
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getStoredSessions = (): Record<string, SessionData> => {
  const stored = localStorage.getItem('herdImmunitySessions');
  return stored ? JSON.parse(stored) : {};
};

const countNodeStates = (nodes: Record<string, GridNode>): Record<NodeState, number> => {
  const counts: Record<NodeState, number> = {
    Susceptible: 0,
    VaccinatedSafe: 0,
    VaccinatedFailed: 0,
    Infected: 0,
    Immune: 0,
    InfectionAttemptFailed: 0,
  };
  
  Object.values(nodes).forEach(node => {
    counts[node.state]++;
  });
  
  return counts;
};

export default function App() {
  const [state, setState] = useState<GameState>(initialGameState);
  const [selectedState, setSelectedState] = useState<NodeState | null>(null);
  const [infectionMode, setInfectionMode] = useState<boolean>(false);
  const [vaccinationMode, setVaccinationMode] = useState<boolean>(false);
  const [vaccinationLabel, setVaccinationLabel] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [showTimeSeries, setShowTimeSeries] = useState<boolean>(false);
  const [timeSeries, setTimeSeries] = useState<Array<{ step: number; counts: Record<NodeState, number> }>>([]);
  const [sessionName, setSessionName] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>('');
  const [gameNumber, setGameNumber] = useState<number>(1);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize session only once on component mount
  useEffect(() => {
    if (!hasInitialized) {
      const name = window.prompt('Enter Session Name (e.g. "Spring 2025 Workshop"):');
      if (name) {
        setSessionName(name);
        const today = formatDate(new Date());
        setSessionDate(today);
        setGameNumber(1);
        setTimeSeries([]);
      }
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  // Initialize time series when infection mode is enabled
  useEffect(() => {
    if (infectionMode) {
      const currentCounts = countNodeStates(state.nodes);
      setTimeSeries([{ step: 0, counts: currentCounts }]);
    } else {
      // When infection mode is turned off, prompt for game completion
      if (timeSeries.length > 0) {
        const isComplete = window.confirm('Is this the end of the simulation?');
        if (isComplete) {
          // Save current game data
          const sessions = getStoredSessions();
          const sessionKey = `${sessionName} — ${sessionDate}`;
          const updatedSessions = {
            ...sessions,
            [sessionKey]: {
              ...sessions[sessionKey],
              games: {
                ...sessions[sessionKey]?.games,
                [gameNumber]: {
                  timeSeries,
                  completedAt: new Date().toISOString()
                }
              }
            }
          };
          localStorage.setItem('herdImmunitySessions', JSON.stringify(updatedSessions));
          
          // Increment game number and clear time series
          setGameNumber(prev => prev + 1);
          setTimeSeries([]);
        }
      }
    }
  }, [infectionMode]);

  // Update time series when state changes during infection mode
  useEffect(() => {
    if (infectionMode && state.history.length > 0) {
      const currentCounts = countNodeStates(state.nodes);
      setTimeSeries(prev => [...prev, { 
        step: prev.length, 
        counts: currentCounts 
      }]);
    }
  }, [state.history.length, infectionMode]);

  function startNewSession() {
    const name = window.prompt('Enter new Session Name:');
    if (name) {
      setSessionName(name);
      setSessionDate(formatDate(new Date()));
      setGameNumber(1);
      setTimeSeries([]);
      resetGrid(state.gridSize.rows, state.gridSize.cols);
    }
  }

  function resetGrid(rows: number, cols: number) {
    const freshNodes = createInitialNodes(rows, cols);
    setState({
      gridSize: { rows, cols },
      nodes: freshNodes,
      history: [],
    });
    setPendingSource(null);
    setTimeSeries([]);
  }

  function undoLastEvent() {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const newHistory = prev.history.slice(0, -1);
      const lastEvent = prev.history[prev.history.length - 1];
      const updatedNodes = { ...prev.nodes };
      updatedNodes[lastEvent.to].state = "Susceptible";
      return {
        ...prev,
        nodes: updatedNodes,
        history: newHistory,
      };
    });
    setPendingSource(null);
    if (infectionMode) {
      setTimeSeries(prev => prev.slice(0, -1));
    }
  }

  function downloadJSON() {
    const data = {
      session: `${sessionName} — ${sessionDate}`,
      gameNumber,
      state,
      timeSeries
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `herd_immunity_game${gameNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadGridImage() {
    const node = document.getElementById("grid-container");
    if (!node) return;
    toPng(node).then((dataUrl: string) => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `grid_snapshot_game${gameNumber}.png`;
      a.click();
    });
  }

  function seedWeightedInfection() {
    const { rows, cols } = state.gridSize;
    const edgeIds: string[] = [];
    const interiorIds: string[] = [];
    Object.values(state.nodes).forEach(node => {
      if (
        node.row === 0 ||
        node.row === rows - 1 ||
        node.col === 0 ||
        node.col === cols - 1
      ) {
        edgeIds.push(node.id);
      } else {
        interiorIds.push(node.id);
      }
    });
    const pickFromInterior = Math.random() < 0.6;
    const pool = pickFromInterior ? interiorIds : edgeIds.length > 0 ? edgeIds : interiorIds;
    if (pool.length === 0) return;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setState(prev => {
      const updatedNodes = { ...prev.nodes };
      updatedNodes[chosen].state = "Infected";
      const newHistoryEntry = { from: null, to: chosen, success: true, timestamp: Date.now() };
      return {
        ...prev,
        nodes: updatedNodes,
        history: [...prev.history, newHistoryEntry],
      };
    });
    setPendingSource(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{sessionName} — {sessionDate}</h2>
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">Game #{gameNumber}</span>
            <button
              onClick={startNewSession}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Session
            </button>
          </div>
        </div>

        {/* Control Row */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button onClick={() => resetGrid(4, 4)} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Reset to 4×4
          </button>
          <button onClick={() => resetGrid(5, 5)} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Reset to 5×5
          </button>
          <button onClick={() => resetGrid(6, 6)} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Reset to 6×6
          </button>
          <button onClick={undoLastEvent} className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            Undo
          </button>
          <button onClick={downloadJSON} className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Export JSON
          </button>
          <button onClick={downloadGridImage} className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Save Image
          </button>
          <button onClick={seedWeightedInfection} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Seed Infection
          </button>
        </div>

        {/* State Palette & Mode Toggles */}
        <div className="flex gap-4 justify-center items-center mb-6">
          <StatePalette
            selectedState={selectedState}
            setSelectedState={setSelectedState}
          />
          <InfectionModeToggle
            infectionMode={infectionMode}
            setInfectionMode={setInfectionMode}
          />
          <VaccinationEfficacyToggle
            vaccinationMode={vaccinationMode}
            setVaccinationMode={setVaccinationMode}
            vaccinationLabel={vaccinationLabel}
            setVaccinationLabel={setVaccinationLabel}
          />
        </div>

        {/* Status Message */}
        <div className="text-center mb-4">
          {pendingSource ? (
            <p className="text-red-500">Select a target for infection from {pendingSource}</p>
          ) : (
            <p className="text-gray-500">
              {infectionMode
                ? "Click an infected cell to start an infection"
                : selectedState
                ? `Click cells to set them to ${selectedState}`
                : "Select a state from the palette or enable infection mode"}
            </p>
          )}
        </div>

        {/* Grid + SVG overlay container */}
        <div
          id="grid-container"
          ref={gridRef}
          className="relative mx-auto"
          style={{
            width: `${state.gridSize.cols * 64}px`,
            height: `${state.gridSize.rows * 64}px`,
          }}
        >
          <Grid
            state={state}
            setState={setState}
            selectedState={selectedState}
            infectionMode={infectionMode}
            vaccinationMode={vaccinationMode}
            pendingSource={pendingSource}
            setPendingSource={setPendingSource}
          />
          <InfectionArrows state={state} gridRef={gridRef} />
        </div>

        {/* Time Series Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setShowTimeSeries(!showTimeSeries)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {showTimeSeries ? "Hide Time Series" : "Show Time Series"}
          </button>
        </div>

        {/* Time Series Chart */}
        {showTimeSeries && <TimeSeriesChart timeSeries={timeSeries} show={showTimeSeries} />}
      </div>
    </div>
  );
}