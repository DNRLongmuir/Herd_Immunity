import React from 'react';

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({ message, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <p className="text-lg mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}