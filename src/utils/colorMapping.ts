import { NodeState } from "../types";

export const getColorForState = (state: NodeState): string => {
  switch (state) {
    case "Susceptible":
      return "#e0e0e0";
    case "VaccinatedSafe":
      return "#add8e6";
    case "VaccinatedFailed":
      return "#4169e1";
    case "Infected":
      return "#ff4444";
    case "Immune":
      return "#87cefa";
    case "InfectionAttemptFailed":
      return "#ffd700";
    default:
      return "#e0e0e0";
  }
};