import React from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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

  return (
    <div className="mt-4 w-full h-[400px]">
      <h3 className={`text-center text-xl font-bold mb-4 transition-colors duration-300 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>Epidemic Trajectory</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
          <Legend verticalAlign="top" height={36} />
          
          <Line
            type="monotone"
            dataKey="Susceptible"
            stroke="#e0e0e0"
            strokeWidth={2}
            dot={false}
            name="Susceptible"
          />
          <Line
            type="monotone"
            dataKey="VaccinatedSafe"
            stroke="#add8e6"
            strokeWidth={2}
            dot={false}
            name="Vacc Safe"
          />
          <Line
            type="monotone"
            dataKey="VaccinatedFailed"
            stroke="#4169e1"
            strokeWidth={2}
            dot={false}
            name="Vacc Failed"
          />
          <Line
            type="monotone"
            dataKey="Infected"
            stroke="#ff4444"
            strokeWidth={2}
            dot={false}
            name="Infected"
          />
          <Line
            type="monotone"
            dataKey="Immune"
            stroke="#90EE90"
            strokeWidth={2}
            dot={false}
            name="Immune (R)"
          />
          <Line
            type="monotone"
            dataKey="InfectionAttemptFailed"
            stroke="#ffd700"
            strokeWidth={2}
            dot={false}
            name="Inf Failed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeSeriesChart;