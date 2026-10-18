import React, { useState } from 'react';

const DropdownMenu = ({ label, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`hu-relative ${className}`.trim()}>
      <button
        type="button"
        className="hu-min-w-28 hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-1.5 hu-text-sm hu-font-medium hu-text-slate-800 hover:hu-bg-slate-50"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
      </button>
      {isOpen && (
        <div className="hu-absolute hu-left-0 hu-top-full hu-z-50 hu-mt-1 hu-block hu-min-w-56 hu-rounded-lg hu-border hu-border-slate-200 hu-bg-white hu-p-1 hu-shadow-lg" role="menu">
          {children}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
