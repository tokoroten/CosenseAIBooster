import React from 'react';
import SettingsPanel from './SettingsPanel';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <SettingsPanel isPopup={false} />
      </main>
    </div>
  );
};

export default App;
