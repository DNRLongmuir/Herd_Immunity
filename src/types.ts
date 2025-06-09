// Define the possible states for a grid node
export type NodeState = 
  | "Susceptible"
  | "VaccinatedSafe"
  | "VaccinatedFailed"
  | "Infected"
  | "Immune"
  | "InfectionAttemptFailed"
  | "Recovered"; // New state for SIR model

// Define model types
export type ModelType = "SIR" | "SI";

// Define the structure for a single grid node
export interface GridNode {
  id: string;                  // e.g. "r2c3", uniquely identifies a cell
  row: number;                 // 0-based row index
  col: number;                 // 0-based column index
  state: NodeState;
  lastInfectSource?: string;   // id of the node that infected this one
  lastInfectSuccess?: boolean;
}

// Define the structure for the overall game state
export interface GameState {
  gridSize: { rows: number; cols: number };
  nodes: Record<string, GridNode>;
  history: Array<{ 
    from: string | null;       // if null, it means a seeded infection
    to: string; 
    success: boolean; 
    timestamp: number 
  }>;
  modelType: ModelType;        // New field for model type
}

// Props for StatePalette component
export interface StatePaletteProps {
  selectedState: NodeState | null;
  setSelectedState: (newState: NodeState | null) => void;
  disabled?: boolean;
  modelType: ModelType;        // New prop for model type
}

// Props for InfectionModeToggle component
export interface InfectionModeToggleProps {
  infectionMode: boolean;
  setInfectionMode: (flag: boolean) => void;
  disabled?: boolean;
}

// Props for VaccinationEfficacyToggle component
export interface VaccinationEfficacyToggleProps {
  vaccinationMode: boolean;
  setVaccinationMode: (flag: boolean) => void;
  vaccinationLabel: string | null;
  setVaccinationLabel: (label: string | null) => void;
  disabled?: boolean;
}

// Props for ModelTypeSelector component
export interface ModelTypeSelectorProps {
  modelType: ModelType;
  setModelType: (modelType: ModelType) => void;
  disabled?: boolean;
}

// Props for Grid component
export interface GridProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  selectedState: NodeState | null;
  infectionMode: boolean;
  vaccinationMode: boolean;
  pendingSource: string | null;
  setPendingSource: (id: string | null) => void;
  disabled?: boolean;
}

// Props for InfectionArrows component
export interface InfectionArrowsProps {
  state: GameState;
  gridRef: React.RefObject<HTMLDivElement>;
}

// Props for TimeSeriesViewer component
export interface TimeSeriesViewerProps {
  timeSeries: Array<{ step: number; counts: Record<NodeState, number> }>;
  show: boolean;
}

// Session data structure
export interface SessionData {
  games: Record<number, {
    timeSeries: Array<{ step: number; counts: Record<NodeState, number> }>;
    completedAt: string;
  }>;
}

// Auto-play state
export interface AutoPlayState {
  isRunning: boolean;
  queue: string[];
  currentStep: number;
}