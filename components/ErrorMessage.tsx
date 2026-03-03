
import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-brand-secondary rounded-2xl border border-red-500/50 min-h-[50vh]">
      <div className="w-16 h-16 text-red-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-red-400 mb-2">Arre! Kuch gadbad ho gayi.</h2>
      <p className="text-brand-text-secondary mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-brand-accent hover:bg-brand-accent-light text-white font-semibold rounded-lg transition-colors"
        >
          Phir Try Karein
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
