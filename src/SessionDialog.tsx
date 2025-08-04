import React, { useState } from 'react';

interface SessionDialogProps {
  onSubmit: (name: string) => void;
  darkMode?: boolean;
}

export default function SessionDialog({ onSubmit, darkMode = false }: SessionDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`rounded-lg p-6 max-w-md w-full transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <h2 className="text-2xl font-bold mb-4">Start New Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="sessionName" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Session Name (e.g. "Spring 2025 Workshop")
            </label>
            <input
              type="text"
              id="sessionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter session name"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  );
}