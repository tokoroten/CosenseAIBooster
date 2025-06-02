import React from 'react';
import Header from './Header';
import SettingsPanel from './SettingsPanel';

const AppContainer: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />      <main className="flex-grow">
        <SettingsPanel />
      </main>
    </div>
  );
};

export default AppContainer;
