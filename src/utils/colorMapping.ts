import { NodeState } from "../types";

export const getColorForState = (state: NodeState): string => {
  switch (state) {
    case "Susceptible":
      return "#e0e0e0";
    case "VaccinatedSafe":
      return "#87ceeb"; // Sky blue - better contrast for projectors
    case "VaccinatedFailed":
      return "#dda0dd"; // Plum - light purple with good contrast
    case "Infected":
      return "#ff4444";
    case "Immune":
      return "#90EE90"; // Light green for immune state (R in SIR model)
    case "InfectionAttemptFailed":
      return "#ffd700";
    default:
      return "#e0e0e0";
  }
};