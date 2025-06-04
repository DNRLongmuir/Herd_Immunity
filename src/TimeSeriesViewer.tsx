import React from 'react';
import { TimeSeriesViewerProps } from './types';

const TimeSeriesViewer: React.FC<TimeSeriesViewerProps> = ({ timeSeries, show }) => {
  if (!show) return null;

  return (
    <div className="mt-4 overflow-x-auto">
      <h3 className="text-center text-xl font-bold mb-4">Epidemic Trajectory (Time Series)</h3>
      <table className="w-full max-w-4xl mx-auto border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 bg-gray-100">Step</th>
            <th className="border border-gray-400 p-2 bg-gray-100">Sus</th>
            <th className="border border-gray-400 p-2 bg-gray-100">Vacc Safe</th>
            <th className="border border-gray-400 p-2 bg-gray-100">Vacc Fail</th>
            <th className="border border-gray-400 p-2 bg-gray-100">Infected</th>
            <th className="border border-gray-400 p-2 bg-gray-100">Immune</th>
            <th className="border border-gray-400 p-2 bg-gray-100">Inf Failed</th>
          </tr>
        </thead>
        <tbody>
          {timeSeries.map(({ step, counts }) => (
            <tr key={step}>
              <td className="border border-gray-300 p-2 text-center">{step}</td>
              <td className="border border-gray-300 p-2 text-center">{counts["Susceptible"]}</td>
              <td className="border border-gray-300 p-2 text-center">{counts["VaccinatedSafe"]}</td>
              <td className="border border-gray-300 p-2 text-center">{counts["VaccinatedFailed"]}</td>
              <td className="border border-gray-300 p-2 text-center">{counts["Infected"]}</td>
              <td className="border border-gray-300 p-2 text-center">{counts["Immune"]}</td>
              <td className="border border-gray-300 p-2 text-center">{counts["InfectionAttemptFailed"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimeSeriesViewer;