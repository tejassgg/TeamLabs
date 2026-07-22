import { useState, useRef } from 'react';
import TooltipPortal from '../shared/TooltipPortal';

const SidebarButton = ({ icon, label, active, onClick, theme, isMobile, collapsed }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const btnRef = useRef(null);

  const handleShowTooltip = () => {
    if (!isMobile && collapsed && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setTooltipPos({
        left: rect.right + 8,
        top: rect.top + rect.height / 2
      });
      setShowTooltip(true);
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        className={`flex items-center gap-3 w-full py-1.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-sm
          ${active
            ? `bg-blue-100 text-blue-700 font-bold dark:bg-blue-800 dark:text-white dark:font-bold shadow-sm`
            : 'hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200'}
          ${!isMobile && collapsed ? 'px-0 justify-center' : 'px-3 justify-start'}
        `}
        onClick={onClick}
        tabIndex={0}
        aria-label={label}
        onMouseEnter={handleShowTooltip}
        onFocus={handleShowTooltip}
        onMouseLeave={() => setShowTooltip(false)}
        onBlur={() => setShowTooltip(false)}
      >
        <span className="text-lg flex items-center justify-center">{icon}</span>
        {(!isMobile && collapsed) ? null : <span className="font-medium text-base">{label}</span>}
      </button>
      {!isMobile && collapsed && showTooltip && (
        <TooltipPortal position={tooltipPos}>
          <div className={`px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50 text-sm font-semibold
            bg-white text-gray-900 border border-gray-200 dark:bg-dark-hover dark:text-[#F3F6FA]`}
          >
            {label}
          </div>
        </TooltipPortal>
      )}
    </div>
  );
};

export default SidebarButton;
