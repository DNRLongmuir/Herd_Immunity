import { NodeState } from "../types";

export const getColorForState = (state: NodeState): string => {
  switch (state) {
    case "Susceptible":
      return "#c0c0c0";
    case "VaccinatedSafe":
      return "#4682b4"; // Steel blue - darker blue for projectors
    case "VaccinatedFailed":
      return "#9370db"; // Medium slate blue - darker purple for projectors
    case "Infected":
      return "#ff4444";
    case "Immune":
      return "#32cd32"; // Lime green - darker green for projectors
    case "InfectionAttemptFailed":
      return "#daa520"; // Goldenrod - darker yellow for projectors
    default:
      return "#c0c0c0";
  }
};