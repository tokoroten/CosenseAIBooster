import React from 'react';
import { TabId, TabProps } from './settings-types';

interface TabsComponentProps {
  activeTab: string;
  onTabChange: (tabId: TabId) => void;
}

const Tabs: React.FC<TabsComponentProps> = ({ activeTab, onTabChange }) => {
  const tabs: TabProps[] = [
    { id: 'prompts', label: 'プロンプト' },
    { id: 'general', label: '一般設定' },
    { id: 'api', label: 'API設定' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
              ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;
