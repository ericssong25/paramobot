import React from 'react';

const SimpleHeader: React.FC = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🤖</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SocialBot Pro</h1>
            <p className="text-gray-400 text-sm">WhatsApp Automation</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <span className="text-lg">🔔</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <span className="text-lg">⚙️</span>
          </button>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
