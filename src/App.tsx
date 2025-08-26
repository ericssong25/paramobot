import React from 'react';
import SimpleHeader from './components/SimpleHeader';
import WhatsAppBot from './components/WhatsAppBot';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8">
        <WhatsAppBot />
      </div>
    </div>
  );
};

export default App;