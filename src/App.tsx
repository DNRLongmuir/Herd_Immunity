import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { GameState, GridNode, NodeState, SessionData, ModelType } from './types';
import { AutoPlaySimulator } from './utils/autoPlaySimulator';
import Grid from './Grid';
import InfectionArrows from './InfectionArrows';
import StatePalette from './StatePalette';
import InfectionModeToggle from './InfectionModeToggle';
import VaccinationEfficacyToggle from './VaccinationEfficacyToggle';
import ModelTypeSelector from './components/ModelTypeSelector';
import TimeSeriesChart from './TimeSeriesChart';
import SessionDialog from './SessionDialog';
import ConfirmationDialog from './ConfirmationDialog';

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
  modelType: "SIR", // Default to SIR model
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
    Recovered: 0,
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
  const [showSessionDialog, setShowSessionDialog] = useState<boolean>(true);
  const [showEndGameDialog, setShowEndGameDialog] = useState<boolean>(false);
  const [autoPlayRunning, setAutoPlayRunning] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const autoPlaySimulatorRef = useRef<AutoPlaySimulator | null>(null);

  // Initialize auto-play simulator
  useEffect(() => {
    autoPlaySimulatorRef.current = new AutoPlaySimulator(
      setState,
      setTimeSeries,
      () => {
        setAutoPlayRunning(false);
        console.log('Auto-play complete');
      }
    );

    return () => {
      if (autoPlaySimulatorRef.current) {
        autoPlaySimulatorRef.current.stop();
      }
    };
  }, []);

  // Initialize time series when infection mode is enabled
  useEffect(() => {
    if (infectionMode) {
      const currentCounts = countNodeStates(state.nodes);
      setTimeSeries(prev => prev.length === 0 ? [{ step: 0, counts: currentCounts }] : prev);
    } else {
      setShowEndGameDialog(timeSeries.length > 0);
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

  function handleSessionSubmit(name: string) {
    setSessionName(name);
    setSessionDate(formatDate(new Date()));
    setGameNumber(1);
    setTimeSeries([]);
    setShowSessionDialog(false);
  }

  function startNewSession() {
    // Stop auto-play if running
    if (autoPlaySimulatorRef.current) {
      autoPlaySimulatorRef.current.stop();
    }
    setAutoPlayRunning(false);
    setShowSessionDialog(true);
  }

  function handleEndGameConfirm(isComplete: boolean) {
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
    setShowEndGameDialog(false);
  }

  function resetGrid(rows: number, cols: number) {
    // Stop auto-play if running
    if (autoPlaySimulatorRef.current) {
      autoPlaySimulatorRef.current.stop();
    }
    setAutoPlayRunning(false);
    
    const freshNodes = createInitialNodes(rows, cols);
    setState(prev => ({
      gridSize: { rows, cols },
      nodes: freshNodes,
      history: [],
      modelType: prev.modelType, // Preserve model type
    }));
    setPendingSource(null);
    setTimeSeries([]);
  }

  function handleModelTypeChange(newModelType: ModelType) {
    // Check if grid is not fresh (has history or time series data)
    const hasData = state.history.length > 0 || timeSeries.length > 0;
    
    if (hasData) {
      // Reset grid and increment game number
      const freshNodes = createInitialNodes(state.gridSize.rows, state.gridSize.cols);
      setState(prev => ({
        ...prev,
        nodes: freshNodes,
        history: [],
        modelType: newModelType,
      }));
      setPendingSource(null);
      setTimeSeries([]);
      setGameNumber(prev => prev + 1);
      
      console.log(`Model type changed from ${state.modelType} to ${newModelType}, grid reset, game number incremented to ${gameNumber + 1}`);
    } else {
      // Just change the model type
      setState(prev => ({
        ...prev,
        modelType: newModelType,
      }));
    }
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

  function handleAutoPlay() {
    if (autoPlayRunning) {
      // Stop auto-play
      if (autoPlaySimulatorRef.current) {
        autoPlaySimulatorRef.current.stop();
      }
      setAutoPlayRunning(false);
    } else {
      // Start auto-play
      if (autoPlaySimulatorRef.current) {
        setAutoPlayRunning(true);
        autoPlaySimulatorRef.current.start(state);
      }
    }
  }

  const isControlsDisabled = autoPlayRunning;
  const isModelTypeDisabled = infectionMode || autoPlayRunning;

  if (showSessionDialog) {
    return <SessionDialog onSubmit={handleSessionSubmit} />;
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
              disabled={isControlsDisabled}
              className={`px-4 py-2 rounded transition-colors ${
                isControlsDisabled 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              New Session
            </button>
          </div>
        </div>

        {/* Auto-play status indicator */}
        {autoPlayRunning && (
          <div className="text-center mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-yellow-800 font-semibold">
              🤖 Auto-Play running... 
              {autoPlaySimulatorRef.current && (
                <span className="ml-2">
                  (Queue: {autoPlaySimulatorRef.current.getQueueLength()} nodes)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Control Row */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button 
            onClick={() => resetGrid(4, 4)} 
            disabled={isControlsDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isControlsDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Reset to 4×4
          </button>
          <button 
            onClick={() => resetGrid(5, 5)} 
            disabled={isControlsDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isControlsDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Reset to 5×5
          </button>
          <button 
            onClick={() => resetGrid(6, 6)} 
            disabled={isControlsDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isControlsDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Reset to 6×6
          </button>
          <button 
            onClick={undoLastEvent} 
            disabled={isControlsDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isControlsDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
          >
            Undo
          </button>
          <button 
            onClick={downloadJSON} 
            disabled={isControlsDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isControlsDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            Export JSON
          </button>
          <button 
            onClick={downloadGridImage} 
            disabled={isControlsDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isControlsDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            Save Image
          </button>
          <button 
            onClick={seedWeightedInfection} 
            disabled={isControlsDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isControlsDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            Seed Infection
          </button>
          <button 
            onClick={handleAutoPlay}
            className={`px-3 py-2 rounded font-semibold transition-colors ${
              autoPlayRunning
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {autoPlayRunning ? 'Stop Auto-Play' : 'Auto-Play'}
          </button>
        </div>

        {/* State Palette & Mode Toggles */}
        <div className="flex gap-4 justify-center items-center mb-6">
          <StatePalette
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            disabled={isControlsDisabled}
            modelType={state.modelType}
          />
          <InfectionModeToggle
            infectionMode={infectionMode}
            setInfectionMode={setInfectionMode}
            disabled={isControlsDisabled}
          />
          <VaccinationEfficacyToggle
            vaccinationMode={vaccinationMode}
            setVaccinationMode={setVaccinationMode}
            vaccinationLabel={vaccinationLabel}
            setVaccinationLabel={setVaccinationLabel}
            disabled={isControlsDisabled}
          />
          <ModelTypeSelector
            modelType={state.modelType}
            setModelType={handleModelTypeChange}
            disabled={isModelTypeDisabled}
          />
        </div>

        {/* Status Message */}
        <div className="text-center mb-4">
          {autoPlayRunning ? (
            <p className="text-orange-600 font-semibold">
              Auto-Play is running - manual controls disabled
            </p>
          ) : pendingSource ? (
            <p className="text-red-500">Select a target for infection from {pendingSource}</p>
          ) : (
            <p className="text-gray-500">
              {infectionMode
                ? `Click an infected cell to start an infection (${state.modelType} model)`
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
            disabled={isControlsDisabled}
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

        {/* End Game Dialog */}
        {showEndGameDialog && (
          <ConfirmationDialog
            message="Is this the end of the simulation?"
            onConfirm={() => handleEndGameConfirm(true)}
            onCancel={() => handleEndGameConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}