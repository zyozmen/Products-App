import React, { useEffect, useRef, useState } from 'react';

const defaultButtonClass = 'hu-inline-flex hu-min-h-10 hu-min-w-28 hu-cursor-pointer hu-items-center hu-justify-center hu-gap-2 hu-rounded-full hu-border-2 hu-border-solid hu-border-[#74a782] hu-bg-white hu-px-4 hu-py-1.5 hu-text-sm hu-font-bold hu-text-[#116b30] hu-transition-colors hover:hu-border-[#16833b] hover:hu-bg-[#16833b] hover:hu-text-white focus-visible:hu-outline focus-visible:hu-outline-[3px] focus-visible:hu-outline-offset-2 focus-visible:hu-outline-green-400 dark:hu-border-[#3d6b4c] dark:hu-bg-[#18251e] dark:hu-text-white dark:hover:hu-bg-[#16833b] dark:hover:hu-text-white';

const DropdownMenu = ({ label, children, className = '', buttonClassName = defaultButtonClass, menuClassName = 'hu-left-0', panelClassName = 'hu-rounded-xl hu-border hu-border-solid hu-border-[#74a782] hu-bg-white hu-shadow-lg dark:hu-border-[#3d6b4c] dark:hu-bg-[#18251e]', ariaLabel, showArrow = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer click fuera (esto también cierra el menú anterior al abrir otro) o con Escape.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`hu-relative ${className}`.trim()}>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
      >
        {label}
        {showArrow && <span aria-hidden="true" className={`hu-text-[10px] hu-transition-transform ${isOpen ? 'hu-rotate-180' : ''}`}>▼</span>}
      </button>
      {isOpen && (
        <div className={`hu-absolute hu-top-full hu-z-50 hu-mt-1 hu-block hu-min-w-56 hu-p-1 ${panelClassName} ${menuClassName}`} role="menu">
          {children}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
