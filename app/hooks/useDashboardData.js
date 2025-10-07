"use client";

import { useState, useEffect } from 'react';

/**
 * Simple Dashboard Data Hook
 * Fetches dashboard data when stores or dates change
 */
export function useDashboardData(storeIds, dateRange, comparison = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Skip if no stores or invalid date range
    if (!storeIds || storeIds.length === 0 || !dateRange?.start || !dateRange?.end) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();

        // Add store IDs
        params.append('stores', storeIds.join(','));

        // Add date range
        const startDate = dateRange.start instanceof Date
          ? dateRange.start.toISOString()
          : dateRange.start;
        const endDate = dateRange.end instanceof Date
          ? dateRange.end.toISOString()
          : dateRange.end;

        params.append('startDate', startDate);
        params.append('endDate', endDate);

        // Add comparison dates if present
        if (comparison?.start && comparison?.end) {
          const compareStart = comparison.start instanceof Date
            ? comparison.start.toISOString()
            : comparison.start;
          const compareEnd = comparison.end instanceof Date
            ? comparison.end.toISOString()
            : comparison.end;

          params.append('compareStartDate', compareStart);
          params.append('compareEndDate', compareEnd);
        }

        const response = await fetch(`/api/dashboard?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (!cancelled) {
          setData(responseData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Dashboard fetch error:', err);
          setError(err.message);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [
    // Create stable dependency keys
    storeIds?.join(','),
    dateRange?.start?.toISOString ? dateRange.start.toISOString() : dateRange?.start,
    dateRange?.end?.toISOString ? dateRange.end.toISOString() : dateRange?.end,
    comparison?.start?.toISOString ? comparison.start.toISOString() : comparison?.start,
    comparison?.end?.toISOString ? comparison.end.toISOString() : comparison?.end
  ]);

  // Simple refresh function
  const refresh = async () => {
    if (!storeIds || storeIds.length === 0 || !dateRange?.start || !dateRange?.end) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('stores', storeIds.join(','));

      const startDate = dateRange.start instanceof Date
        ? dateRange.start.toISOString()
        : dateRange.start;
      const endDate = dateRange.end instanceof Date
        ? dateRange.end.toISOString()
        : dateRange.end;

      params.append('startDate', startDate);
      params.append('endDate', endDate);

      if (comparison?.start && comparison?.end) {
        const compareStart = comparison.start instanceof Date
          ? comparison.start.toISOString()
          : comparison.start;
        const compareEnd = comparison.end instanceof Date
          ? comparison.end.toISOString()
          : comparison.end;

        params.append('compareStartDate', compareStart);
        params.append('compareEndDate', compareEnd);
      }

      const response = await fetch(`/api/dashboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const responseData = await response.json();
      setData(responseData);
      setError(null);
    } catch (err) {
      console.error('Dashboard refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refresh
  };
}

// Empty prefetch hook - not needed for simple implementation
export function useDashboardPrefetch() {
  // No-op for now
}