import React, { useState } from 'react';
import './CollapseMenu.css';

const CollapseMenu = ({ title, children, className = '', triggerClassName = '', contentClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const resolvedContentClassName = `${contentClassName} ${isOpen ? 'show' : ''}`.trim();

  return (
    <div className={className}>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        {title}
      </button>
      <div className={`${resolvedContentClassName} ${isOpen ? 'collapse-menu-open' : 'collapse-menu-closed'}`.trim()}>
        {children}
      </div>
    </div>
  );
};

export default CollapseMenu;
