import { useState, useEffect } from 'react';

export default function LoadingSpinner({ message = "Loading...", fullScreen = false }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const containerClass = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-3xl">🎵</span>
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {message}{dots}
        </h2>
        <p className="text-gray-400 text-sm">
          Preparing your FlowCue experience
        </p>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
