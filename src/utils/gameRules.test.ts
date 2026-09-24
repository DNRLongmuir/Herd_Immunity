import { describe, expect, it } from 'vitest';
import {
  isManualTargetEligible,
  isSeedCandidate,
  resolveManualExposure,
} from './gameRules';

describe('seed eligibility', () => {
  it('allows only susceptible and protected vaccinated students', () => {
    expect(isSeedCandidate('Susceptible')).toBe(true);
    expect(isSeedCandidate('VaccinatedSafe')).toBe(true);
    expect(isSeedCandidate('VaccinatedFailed')).toBe(false);
    expect(isSeedCandidate('Infected')).toBe(false);
    expect(isSeedCandidate('Immune')).toBe(false);
    expect(isSeedCandidate('InfectionAttemptFailed')).toBe(false);
  });
});

describe('manual exposure targets', () => {
  it('allows susceptible students and permits vaccinated targets only when enabled', () => {
    expect(isManualTargetEligible('Susceptible', false)).toBe(true);
    expect(isManualTargetEligible('VaccinatedSafe', false)).toBe(false);
    expect(isManualTargetEligible('VaccinatedSafe', true)).toBe(true);
    expect(isManualTargetEligible('Infected', true)).toBe(false);
    expect(isManualTargetEligible('Immune', true)).toBe(false);
  });
});

describe('manual exposure outcomes', () => {
  it('records ordinary and breakthrough infections', () => {
    expect(resolveManualExposure('Susceptible', true, 'SIR', false)).toBe('Infected');
    expect(resolveManualExposure('VaccinatedSafe', true, 'SIR', true)).toBe('VaccinatedFailed');
  });

  it('records resistance according to the selected classroom model', () => {
    expect(resolveManualExposure('Susceptible', false, 'SIR', false)).toBe('Immune');
    expect(resolveManualExposure('Susceptible', false, 'SI', false)).toBe('InfectionAttemptFailed');
  });
});
