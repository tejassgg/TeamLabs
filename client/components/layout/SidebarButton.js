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
        className={`flex items-center w-full py-1.5 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-sm
          ${active
            ? `bg-blue-100 text-blue-700 font-bold dark:bg-blue-800 dark:text-white dark:font-bold shadow-sm`
            : 'hover:bg-blue-100 text-blue-600 dark:hover:bg-dark-hover dark:text-blue-200'}
          px-3 justify-start
        `}
        onClick={onClick}
        tabIndex={0}
        aria-label={label}
        onMouseEnter={handleShowTooltip}
        onFocus={handleShowTooltip}
        onMouseLeave={() => setShowTooltip(false)}
        onBlur={() => setShowTooltip(false)}
      >
        <span className="text-lg flex items-center justify-center flex-shrink-0">{icon}</span>
        <span className={`font-medium text-sm inline-block truncate transition-all duration-300 ease-in-out origin-left
          ${!isMobile && collapsed ? 'opacity-0 scale-95 max-w-0 ml-0 pointer-events-none' : 'opacity-100 scale-100 max-w-[200px] ml-3'}
        `}>
          {label}
        </span>
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
