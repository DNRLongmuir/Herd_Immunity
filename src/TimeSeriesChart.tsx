import React from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { NodeState } from './types';

type TSEntry = {
  step: number;
  counts: Record<NodeState, number>;
};

type Props = {
  timeSeries: TSEntry[];
  show: boolean;
  darkMode?: boolean;
};

const seriesConfig: { key: string; dataKey: NodeState; label: string; color: string }[] = [
  { key: 'susceptible', dataKey: 'Susceptible', label: 'Susceptible', color: '#9ca3af' },
  { key: 'vaccSafe', dataKey: 'VaccinatedSafe', label: 'Vacc Safe', color: '#add8e6' },
  { key: 'vaccFailed', dataKey: 'VaccinatedFailed', label: 'Vacc Failed', color: '#4169e1' },
  { key: 'infected', dataKey: 'Infected', label: 'Infected', color: '#ff4444' },
  { key: 'immune', dataKey: 'Immune', label: 'Immune (R)', color: '#90EE90' },
  { key: 'infFailed', dataKey: 'InfectionAttemptFailed', label: 'Inf Failed', color: '#ffd700' },
];

const TimeSeriesChart: React.FC<Props> = ({ timeSeries, show, darkMode = false }) => {
  if (!show) return null;

  const data = timeSeries.map((entry) => ({
    step: entry.step,
    Susceptible: entry.counts["Susceptible"],
    VaccinatedSafe: entry.counts["VaccinatedSafe"],
    VaccinatedFailed: entry.counts["VaccinatedFailed"],
    Infected: entry.counts["Infected"],
    Immune: entry.counts["Immune"],
    InfectionAttemptFailed: entry.counts["InfectionAttemptFailed"],
  }));

  const finalCounts = timeSeries.length > 0
    ? timeSeries[timeSeries.length - 1].counts
    : null;

  return (
    <div className="mt-4 w-full">
      <h3 className={`text-center text-xl font-bold mb-4 transition-colors duration-300 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>Epidemic Trajectory</h3>

      {finalCounts && (
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-4">
          {seriesConfig.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {s.label}
              </span>
              <span className={`text-sm font-bold tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {finalCounts[s.dataKey]}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }} key={timeSeries.length}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis
              dataKey="step"
              label={{ value: 'Time Step', position: 'insideBottomRight', offset: -5 }}
              tick={{ fill: darkMode ? '#d1d5db' : '#374151' }}
            />
            <YAxis
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
              tick={{ fill: darkMode ? '#d1d5db' : '#374151' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                border: `1px solid ${darkMode ? '#6b7280' : '#e5e7eb'}`,
                borderRadius: '6px',
                color: darkMode ? '#ffffff' : '#000000'
              }}
            />
            {seriesConfig.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                name={s.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;