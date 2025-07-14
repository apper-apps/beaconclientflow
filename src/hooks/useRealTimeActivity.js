import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setActivityLoading, 
  setRealTimePolling,
  refreshRecentActivity,
  setActivityError 
} from '@/store/dashboardSlice';
import { getRealTimeActivity } from '@/services/api/dashboardService';

const useRealTimeActivity = (options = {}) => {
  const {
    enabled = true,
    pollingInterval = 10000, // 10 seconds for activity updates
    immediate = true
  } = options;

  const dispatch = useDispatch();
  const { realTimePolling, recentActivity } = useSelector((state) => state.dashboard);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchLatestActivity = useCallback(async (showLoading = false) => {
    if (!mountedRef.current || !enabled) return;

    try {
      if (showLoading) {
        dispatch(setActivityLoading(true));
      }
      
      const latestActivity = await getRealTimeActivity();
      
      if (mountedRef.current) {
        dispatch(refreshRecentActivity(latestActivity));
        if (showLoading) {
          dispatch(setActivityLoading(false));
        }
      }
    } catch (error) {
      console.error('Error fetching real-time activity:', error);
      if (mountedRef.current) {
        dispatch(setActivityError(error.message));
        if (showLoading) {
          dispatch(setActivityLoading(false));
        }
      }
    }
  }, [dispatch, enabled]);

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current) return;

    dispatch(setRealTimePolling(true));
    
    // Fetch immediately if requested
    if (immediate && recentActivity.length === 0) {
      fetchLatestActivity(true);
    }

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchLatestActivity(false); // Background updates without loading indicator
    }, pollingInterval);
  }, [enabled, immediate, recentActivity.length, fetchLatestActivity, pollingInterval, dispatch]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    dispatch(setRealTimePolling(false));
  }, [dispatch]);

  const refreshNow = useCallback(() => {
    fetchLatestActivity(true);
  }, [fetchLatestActivity]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      startPolling();
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPolling: realTimePolling,
    refreshNow,
    startPolling,
    stopPolling
  };
};

export default useRealTimeActivity;