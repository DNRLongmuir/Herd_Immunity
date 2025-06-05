import React, { useState } from 'react';

interface SessionDialogProps {
  onSubmit: (name: string) => void;
}

export default function SessionDialog({ onSubmit }: SessionDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Start New Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-2">
              Session Name (e.g. "Spring 2025 Workshop")
            </label>
            <input
              type="text"
              id="sessionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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