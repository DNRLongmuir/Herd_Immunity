import { ModelType, NodeState } from '../types';

export const isSeedCandidate = (state: NodeState): boolean =>
  state === "Susceptible" || state === "VaccinatedSafe";

export const isManualTargetEligible = (
  state: NodeState,
  vaccinationMode: boolean
): boolean =>
  state === "Susceptible" || (state === "VaccinatedSafe" && vaccinationMode);

export const resolveManualExposure = (
  state: NodeState,
  success: boolean,
  modelType: ModelType,
  vaccinationMode: boolean
): NodeState => {
  if (success) {
    return vaccinationMode && state === "VaccinatedSafe"
      ? "VaccinatedFailed"
      : "Infected";
  }

  return modelType === "SIR" ? "Immune" : "InfectionAttemptFailed";
};
