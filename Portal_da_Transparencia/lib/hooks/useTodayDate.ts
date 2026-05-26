'use client';

/**
 * Returns today's date in YYYY-MM-DD format, computed once on mount.
 * Use this instead of hardcoded date strings for `lastUpdate` props,
 * so that the portal always shows the current date as "última atualização".
 */
import { useState, useEffect } from 'react';

export function useTodayDate(): string {
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  return date;
}


