import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Cooking up your ad...",
  "Adding some secret sauce...",
  "The aroma is irresistible...",
  "Almost ready to serve...",
  "Garnishing with engagement...",
  "Plating your perfect ad..."
];

const AdGenerationLoadingScreen = () => {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setCurrentMessage(loadingMessages[messageIndex]);
    }, 3000); // Change message every 3 seconds

    const progressInterval = setInterval(() => {
      setProgress(oldProgress => {
        if (oldProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(oldProgress + 1, 100);
      });
    }, 100); // Update progress every 100ms (10 seconds to reach 100%)

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-4">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Creating Your Ad</h2>
        <p className="text-lg text-gray-600 mb-4">{currentMessage}</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-100 ease-out"
            style={{width: `${progress}%`}}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AdGenerationLoadingScreen;