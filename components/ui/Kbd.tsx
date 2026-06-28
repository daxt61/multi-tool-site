import React, { useMemo } from 'react';
import { cn } from './utils';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The modifier key to display. Defaults to 'Ctrl' (automatically becomes '⌘' on Mac).
   * Set to null or empty string to display no modifier.
   */
  modifier?: string | null;
  children: React.ReactNode;
}

export function Kbd({ modifier = 'Ctrl', children, className, ...props }: KbdProps) {
  const isMac = useMemo(() =>
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent),
  []);

  const displayModifier = useMemo(() => {
    if (modifier === 'Ctrl') return isMac ? '⌘' : 'Ctrl';
    return modifier;
  }, [modifier, isMac]);

  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 transition-colors",
        className
      )}
      {...props}
    >
      {displayModifier && <span>{displayModifier}{children ? ' + ' : ''}</span>}
      {children}
    </kbd>
  );
}
