import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { GameState, GridNode, NodeState, SessionData, ModelType } from './types';
import { AutoPlaySimulator } from './utils/autoPlaySimulator';
import { exportGridToCanvas } from './utils/canvasExport';
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
        studentNumber: r * cols + c + 1,
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
  const [timeSeries, setTimeSeries] = useState<Array<{ step: number; counts: Record<NodeState, number> }>>([]);
  const [sessionName, setSessionName] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>('');
  const [gameNumber, setGameNumber] = useState<number>(1);
  const [showSessionDialog, setShowSessionDialog] = useState<boolean>(true);
  const [showEndGameDialog, setShowEndGameDialog] = useState<boolean>(false);
  const [autoPlayRunning, setAutoPlayRunning] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(false);
  
  // New state hooks for seeding system
  const [seedAttemptsRemaining, setSeedAttemptsRemaining] = useState<number>(3);
  const [isSeeded, setIsSeeded] = useState<boolean>(false);
  const [showSeedDialog, setShowSeedDialog] = useState<boolean>(false);
  const [seedDialogMessage, setSeedDialogMessage] = useState<string>('');
  
  const gridRef = useRef<HTMLDivElement>(null);
  const autoPlaySimulatorRef = useRef<AutoPlaySimulator | null>(null);
  const infectionModeRef = useRef<boolean>(infectionMode);
  const prevInfectionModeRef = useRef<boolean>(false);
  const seedingRef = useRef<boolean>(false);

  // Keep ref in sync with state
  useEffect(() => {
    infectionModeRef.current = infectionMode;
  }, [infectionMode]);

  // Centralized function to update time series when state changes
  const updateTimeSeriesIfChanged = (newNodes: Record<string, GridNode>, oldNodes: Record<string, GridNode>) => {
    // Check if any node actually changed state
    const hasStateChange = Object.keys(newNodes).some(nodeId =>
      newNodes[nodeId].state !== oldNodes[nodeId].state
    );

    if (hasStateChange) {
      const currentCounts = countNodeStates(newNodes);
      setTimeSeries(prev => [...prev, {
        step: prev.length,
        counts: currentCounts
      }]);
    }
  };
  // Initialize auto-play simulator
  useEffect(() => {
    autoPlaySimulatorRef.current = new AutoPlaySimulator(
      setState,
      updateTimeSeriesIfChanged,
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

  // Show end game dialog when infection mode is turned off
  useEffect(() => {
    // Check if infection mode was just turned OFF (transition from true to false)
    if (!infectionMode && prevInfectionModeRef.current) {
      setShowEndGameDialog(timeSeries.length > 1); // More than just step 0
    }

    // Update the previous value
    prevInfectionModeRef.current = infectionMode;
  }, [infectionMode, timeSeries.length]);


  function handleSessionSubmit(name: string) {
    setSessionName(name);
    setSessionDate(formatDate(new Date()));
    setGameNumber(1);

    // Initialize time series with step 0
    const initialCounts = countNodeStates(state.nodes);
    setTimeSeries([{ step: 0, counts: initialCounts }]);

    // Reset seeding state
    setSeedAttemptsRemaining(3);
    setIsSeeded(false);
    seedingRef.current = false;
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
      
      // Increment game number and reinitialize time series with step 0
      setGameNumber(prev => prev + 1);
      const freshNodes = createInitialNodes(state.gridSize.rows, state.gridSize.cols);
      setState(prev => ({
        ...prev,
        nodes: freshNodes,
        history: [],
      }));
      const initialCounts = countNodeStates(freshNodes);
      setTimeSeries([{ step: 0, counts: initialCounts }]);
      // Reset seeding state for new game
      setSeedAttemptsRemaining(3);
      setIsSeeded(false);
    seedingRef.current = false;
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

    // Initialize time series with step 0
    const initialCounts = countNodeStates(freshNodes);
    setTimeSeries([{ step: 0, counts: initialCounts }]);

    // Reset seeding state
    setSeedAttemptsRemaining(3);
    setIsSeeded(false);
    seedingRef.current = false;
  }

  function shuffleStudents() {
    if (autoPlayRunning || infectionMode || state.history.length > 0) return;

    setState(prev => {
      const positions = Object.values(prev.nodes);
      const students = positions.map(node => ({
        studentNumber: node.studentNumber,
        state: node.state,
        lastInfectSource: node.lastInfectSource,
        lastInfectSuccess: node.lastInfectSuccess,
      }));

      for (let i = students.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [students[i], students[j]] = [students[j], students[i]];
      }

      const shuffledNodes: Record<string, GridNode> = {};
      positions.forEach((position, index) => {
        shuffledNodes[position.id] = {
          ...position,
          ...students[index],
        };
      });

      return { ...prev, nodes: shuffledNodes };
    });
    setPendingSource(null);
  }

  function handleModelTypeChange(newModelType: ModelType) {
    // Check if grid is not fresh (has history or time series data)
    const hasData = state.history.length > 0 || timeSeries.length > 1; // More than just step 0

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

      // Initialize time series with step 0
      const initialCounts = countNodeStates(freshNodes);
      setTimeSeries([{ step: 0, counts: initialCounts }]);

      setGameNumber(prev => prev + 1);
      // Reset seeding state for new game
      setSeedAttemptsRemaining(3);
      setIsSeeded(false);
    seedingRef.current = false;

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
      updatedNodes[lastEvent.to] = { ...updatedNodes[lastEvent.to], state: lastEvent.previousState };
      return {
        ...prev,
        nodes: updatedNodes,
        history: newHistory,
      };
    });
    setPendingSource(null);
    setTimeSeries(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
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
    const captureElement = document.getElementById('capture-grid');
    if (!captureElement) {
      console.error('Capture element not found');
      return;
    }

    toPng(captureElement, {
      backgroundColor: darkMode ? '#374151' : '#ffffff',
      width: captureElement.scrollWidth,
      height: captureElement.scrollHeight,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `grid_snapshot_game${gameNumber}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error('Error capturing image:', error);
      });
  }

  function seedWeightedInfection() {
    if (seedingRef.current) return;
    seedingRef.current = true;

    const nodeIds = Object.keys(state.nodes);
    const weights: number[] = [];
    
    nodeIds.forEach(nodeId => {
      const node = state.nodes[nodeId];
      if (node.state !== "VaccinatedSafe") {
        weights.push(1.0);
      } else {
        // VaccinatedSafe weight based on attempts remaining
        if (seedAttemptsRemaining === 3) {
          weights.push(1.0);
        } else if (seedAttemptsRemaining === 2) {
          weights.push(0.5);
        } else if (seedAttemptsRemaining === 1) {
          weights.push(0.2);
        } else {
          weights.push(0.0);
        }
      }
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    let chosenIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        chosenIndex = i;
        break;
      }
    }
    
    const chosenNodeId = nodeIds[chosenIndex];
    const chosenNode = state.nodes[chosenNodeId];

    // Handle the chosen node
    if (chosenNode.state === "VaccinatedSafe") {
      // Decrement attempts and show popup
      const newAttemptsRemaining = seedAttemptsRemaining - 1;
      setSeedAttemptsRemaining(newAttemptsRemaining);
      
      if (newAttemptsRemaining === 0) {
        setSeedDialogMessage("Game Over! The community is safe! Well done!");
      } else {
        setSeedDialogMessage(`Infection attempt unsuccessful — ${newAttemptsRemaining}/3 tries remaining.`);
      }
      
      setShowSeedDialog(true);
      seedingRef.current = false;
      return;
    } else {
      // Successful seeding - infect the chosen node
      setState(prev => {
        const oldNodes = prev.nodes;
        const updatedNodes = { ...prev.nodes };
        updatedNodes[chosenNodeId] = { ...updatedNodes[chosenNodeId], state: "Infected" };

        const newHistoryEntry = { from: null, to: chosenNodeId, success: true, timestamp: Date.now(), previousState: oldNodes[chosenNodeId].state };
        const newState = {
          ...prev,
          nodes: updatedNodes,
          history: [...prev.history, newHistoryEntry],
        };

        // Update time series if state changed
        updateTimeSeriesIfChanged(updatedNodes, oldNodes);

        return newState;
      });
      
      // Mark as seeded and disable further seeding
      setIsSeeded(true);
      setPendingSource(null);
    }
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
  const isSeedButtonDisabled = isControlsDisabled || isSeeded || seedAttemptsRemaining === 0;
  const isShuffleDisabled = isControlsDisabled || infectionMode || state.history.length > 0;

  if (showSessionDialog) {
    return <SessionDialog onSubmit={handleSessionSubmit} darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen p-8 overflow-x-auto transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <div className={`min-w-fit mx-auto rounded-lg shadow-lg p-6 transition-colors duration-300 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>{sessionName} — {sessionDate}</h2>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-semibold transition-colors duration-300 ${
              darkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>Game #{gameNumber}</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-2 rounded transition-colors duration-300 ${
                darkMode 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              title="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
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
          <div className={`text-center mb-4 p-3 border rounded-lg transition-colors duration-300 ${
            darkMode 
              ? 'bg-yellow-900 border-yellow-700 text-yellow-200' 
              : 'bg-yellow-100 border-yellow-300 text-yellow-800'
          }`}>
            <p className="font-semibold">
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
            onClick={shuffleStudents}
            disabled={isShuffleDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isShuffleDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
            title={
              state.history.length > 0
                ? 'Reset the grid before shuffling students after infection has begun'
                : infectionMode
                ? 'Exit Infection Mode before shuffling students'
                : 'Move student numbers and their current states to new positions'
            }
          >
            Shuffle Students
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
            disabled={isSeedButtonDisabled}
            className={`px-3 py-2 rounded transition-colors ${
              isSeedButtonDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
            title={
              isSeeded 
                ? 'Already seeded - only one seed per game' 
                : seedAttemptsRemaining === 0 
                ? 'No seed attempts remaining' 
                : `Seed Infection (${seedAttemptsRemaining}/3 attempts remaining)`
            }
          >
            Seed Infection {!isSeeded && `(${seedAttemptsRemaining}/3)`}
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
            darkMode={darkMode}
          />
          <InfectionModeToggle
            infectionMode={infectionMode}
            setInfectionMode={setInfectionMode}
            disabled={isControlsDisabled}
            darkMode={darkMode}
          />
          <VaccinationEfficacyToggle
            vaccinationMode={vaccinationMode}
            setVaccinationMode={setVaccinationMode}
            vaccinationLabel={vaccinationLabel}
            setVaccinationLabel={setVaccinationLabel}
            disabled={isControlsDisabled}
            darkMode={darkMode}
          />
          <ModelTypeSelector
            modelType={state.modelType}
            setModelType={handleModelTypeChange}
            disabled={isModelTypeDisabled}
            darkMode={darkMode}
          />
        </div>

        {/* Status Message */}
        <div className="text-center mb-4">
          {autoPlayRunning ? (
            <p className={`font-semibold transition-colors duration-300 ${
              darkMode ? 'text-orange-400' : 'text-orange-600'
            }`}>
              Auto-Play is running - manual controls disabled
            </p>
          ) : pendingSource ? (
            <p className={`transition-colors duration-300 ${
              darkMode ? 'text-red-400' : 'text-red-500'
            }`}>Select a target for infection from {pendingSource}</p>
          ) : (
            <p className={`transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
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
          className="flex justify-center"
        >
          <div
            id="capture-grid"
            ref={gridRef}
            className="relative"
            style={{
              display: 'inline-block',
              padding: '16px',
              backgroundColor: darkMode ? '#374151' : '#ffffff',
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
              updateTimeSeriesIfChanged={updateTimeSeriesIfChanged}
              darkMode={darkMode}
            />
            <InfectionArrows state={state} gridRef={gridRef} />
          </div>
        </div>

        {/* Time Series Toggle + Chart */}
        {timeSeries.length > 1 && (
          <div className="mt-6">
            <button
              onClick={() => setShowChart(prev => !prev)}
              className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${
                showChart
                  ? darkMode
                    ? 'bg-teal-700 text-teal-100 hover:bg-teal-600'
                    : 'bg-teal-600 text-white hover:bg-teal-500'
                  : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showChart ? 'Hide Epidemic Trajectory' : `Show Epidemic Trajectory (${timeSeries.length} steps)`}
            </button>
            <TimeSeriesChart timeSeries={timeSeries} show={showChart} darkMode={darkMode} />
          </div>
        )}

        {/* End Game Dialog */}
        {showEndGameDialog && (
          <ConfirmationDialog
            message="Is this the end of the simulation?"
            onConfirm={() => handleEndGameConfirm(true)}
            onCancel={() => handleEndGameConfirm(false)}
            darkMode={darkMode}
          />
        )}

        {/* Seed Attempt Dialog */}
        {showSeedDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg p-6 max-w-md w-full transition-colors duration-300 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}>
              <p className="text-lg mb-6">{seedDialogMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSeedDialog(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
