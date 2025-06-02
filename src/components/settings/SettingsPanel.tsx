import React from 'react';
import { useUIStore } from '../../store';
import { TabId } from './settings-types';
import Tabs from './Tabs';
import PromptsTab from './PromptsTab';
import GeneralTab from './GeneralTab';
import ApiTab from './ApiTab';

interface SettingsPanelProps {
  isPopup?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isPopup = false }) => {
  const activeTab = useUIStore((state) => state.activeTab) as TabId;
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <div className={isPopup ? '' : 'bg-gray-50 min-h-screen'}>
      <div className={isPopup ? '' : 'max-w-6xl mx-auto py-6'}>
        <div className={isPopup ? 'bg-white' : 'bg-white shadow rounded-lg'}>
          <Tabs activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId)} />
          {activeTab === 'prompts' && <PromptsTab />}
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'api' && <ApiTab />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
