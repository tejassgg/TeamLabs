import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function TooltipPortal({ children, position }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const style = {
    position: 'fixed',
    left: position.left,
    top: position.top,
    zIndex: 9999,
    minWidth: 'max-content',
    pointerEvents: 'none',
    transform: 'translateY(-50%)',
  };

  return createPortal(
    <div style={style}>
      {children}
    </div>,
    document.body
  );
} 