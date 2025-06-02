import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl flex items-center">
      <img src="../assets/icon-48.png" alt="Cosense AI Booster" className="w-12 h-12 mr-4 bg-white p-1 rounded-full shadow" />
      <div>
        <h1 className="text-3xl font-bold flex-1">Cosense AI Booster</h1>
        <p className="text-blue-100">スマートな文章作成をサポート</p>
      </div>
    </header>
  );
};

export default Header;
