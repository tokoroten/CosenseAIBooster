import React from 'react';
import SettingsPanel from './SettingsPanel';
import Header from './Header';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        <SettingsPanel />
      </main>
    </div>
  );
};

export default App;
