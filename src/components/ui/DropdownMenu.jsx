import React, { useState } from 'react';

const DropdownMenu = ({ label, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`btn-group ${className}`.trim()}>
      <button
        type="button"
        className="btn btn-sm btn-light"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
      </button>
      {isOpen && (
        <div className="dropdown-menu show" role="menu" style={{ display: 'block', position: 'absolute' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
