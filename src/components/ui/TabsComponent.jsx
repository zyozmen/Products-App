import React, { useState } from 'react';

const TabsComponent = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || '');

  return (
    <div>
      <div className="hu-mb-4 hu-flex hu-gap-2 hu-overflow-x-auto hu-border-b hu-border-slate-200" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`hu-whitespace-nowrap hu-border-0 hu-border-b-2 hu-bg-transparent hu-px-4 hu-py-2.5 hu-text-sm hu-font-medium ${activeTab === tab.key ? 'hu-border-blue-700 hu-text-blue-700' : 'hu-border-transparent hu-text-slate-600 hover:hu-text-slate-900'}`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {tabs.map((tab) => (
          activeTab === tab.key && <div key={tab.key} role="tabpanel">{tab.content}</div>
        ))}
      </div>
    </div>
  );
};

export default TabsComponent;
