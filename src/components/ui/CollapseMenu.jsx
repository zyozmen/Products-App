import React, { useState } from 'react';

const CollapseMenu = ({ title, children, className = '', triggerClassName = '', contentClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

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
      {isOpen && <div className={contentClassName}>{children}</div>}
    </div>
  );
};

export default CollapseMenu;
