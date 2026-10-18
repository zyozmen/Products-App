import React, { useState } from 'react';

const CollapseMenu = ({ title, children, className = '', triggerClassName = '', contentClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const resolvedContentClassName = `${contentClassName} ${isOpen ? 'show hu-block' : 'hu-hidden'}`.trim();

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
      <div className={resolvedContentClassName}>
        {children}
      </div>
    </div>
  );
};

export default CollapseMenu;
