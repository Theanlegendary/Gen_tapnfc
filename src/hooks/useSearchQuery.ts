import { useCallback, useEffect, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 300;

/** Draft input vs applied filter query (debounced + explicit submit). */
export function useSearchQuery(debounceMs = DEFAULT_DEBOUNCE_MS) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [input, debounceMs]);

  const submitSearch = useCallback(() => {
    setQuery(input.trim());
  }, [input]);

  const clearSearch = useCallback(() => {
    setInput('');
    setQuery('');
  }, []);

  return { input, setInput, query, submitSearch, clearSearch };
}

export function searchEmptyMessage(
  loading: boolean,
  hasQuery: boolean,
  query: string,
  fallback: string,
  loadingLabel = 'Loading…'
): string {
  if (loading) return loadingLabel;
  if (hasQuery) return `No results for "${query}".`;
  return fallback;
}
