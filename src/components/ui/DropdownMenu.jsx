import React, { useState } from 'react';
import './DropdownMenu.css';

const DropdownMenu = ({ label, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`btn-group dropdown-menu-wrapper ${className}`.trim()}>
      <button
        type="button"
        className="btn btn-sm btn-light dropdown-menu-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
      </button>
      {isOpen && (
        <div className="dropdown-menu show dropdown-menu-content" role="menu">
          {children}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
