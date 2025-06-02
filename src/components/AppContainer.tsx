import React from 'react';
import Header from './Header';
import Settings from './Settings';

const AppContainer: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        <Settings />
      </main>
    </div>
  );
};

export default AppContainer;
