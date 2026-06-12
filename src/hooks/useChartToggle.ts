/**
 * Hook for accessible chart/table view toggle.
 * Manages focus and aria-hidden for WCAG compliance.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type DataViewMode = 'chart' | 'table';

export function useChartToggle(initialMode: DataViewMode = 'chart') {
  const [mode, setMode] = useState<DataViewMode>(initialMode);
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback((newMode: DataViewMode) => {
    setMode(newMode);
  }, []);

  // Manage focus when toggling views
  useEffect(() => {
    const activeRef = mode === 'chart' ? chartRef : tableRef;
    // Small delay to allow DOM to update
    const timer = setTimeout(() => {
      if (activeRef.current) {
        const focusable = activeRef.current.querySelector<HTMLElement>(
          '[tabindex="0"], button, table'
        );
        if (focusable) focusable.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [mode]);

  const chartProps = {
    ref: chartRef,
    'aria-hidden': mode !== 'chart' ? true : undefined,
    tabIndex: mode === 'chart' ? 0 : -1,
  } as const;

  const tableProps = {
    ref: tableRef,
    'aria-hidden': mode === 'chart' ? true : undefined,
    tabIndex: mode !== 'table' ? -1 : 0,
  } as const;

  return { mode, toggle, chartProps, tableProps };
}
