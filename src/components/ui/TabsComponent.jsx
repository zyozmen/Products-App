import React, { useState } from 'react';

const TabsComponent = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || '');

  return (
    <div>
      <div className="nav nav-tabs mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`nav-item nav-link text-dark ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs.map((tab) => (
          <div key={tab.key} className={`tab-pane fade ${activeTab === tab.key ? 'show active' : ''}`}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabsComponent;
