import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { 
  setMetricsLoading, 
  setMetrics, 
  setMetricsError, 
  setActivityLoading, 
  setRecentActivity, 
  setActivityError 
} from "@/store/dashboardSlice";
import DashboardStats from "@/components/organisms/DashboardStats";
import RecentActivity from "@/components/organisms/RecentActivity";
import QuickActions from "@/components/organisms/QuickActions";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";
import { getDashboardData, getRealTimeMetrics, getRealTimeActivity } from "@/services/api/dashboardService";
import { createSampleActivities } from "@/services/api/recentActivityService";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError,
    recentActivity,
    activityLoading,
    activityError
  } = useSelector((state) => state.dashboard);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refreshIntervalRef = useRef(null);

const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const dashboardData = await getDashboardData();
      setData(dashboardData);
      
      // Update metrics and activity in Redux store
      if (dashboardData.realTimeMetrics) {
        dispatch(setMetrics(dashboardData.realTimeMetrics));
      }
      if (dashboardData.recentActivity) {
        dispatch(setRecentActivity(dashboardData.recentActivity));
      }
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
      toast.error("Failed to load dashboard data");
      dispatch(setMetricsError(err.message));
      dispatch(setActivityError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    try {
      // Refresh metrics
      dispatch(setMetricsLoading(true));
      const realTimeMetrics = await getRealTimeMetrics();
      dispatch(setMetrics(realTimeMetrics));

      // Refresh activity
      dispatch(setActivityLoading(true));
      const realTimeActivity = await getRealTimeActivity();
      dispatch(setRecentActivity(realTimeActivity));
    } catch (err) {
      console.error("Failed to refresh dashboard data:", err);
      dispatch(setMetricsError(err.message));
      dispatch(setActivityError(err.message));
    }
  };

useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Create sample activities if none exist
        await createSampleActivities();
      } catch (error) {
        console.error("Error initializing sample activities:", error);
      }
      
      // Load dashboard data
      await loadDashboardData();
    };
    
    initializeDashboard();
    
    // Set up real-time refresh every 30 seconds for both metrics and activity
    refreshIntervalRef.current = setInterval(refreshDashboardData, 30000);
    
    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [dispatch]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={loadDashboardData} />;
  }

  if (!data) {
    return (
      <Empty
        title="Dashboard Not Available"
        description="Unable to load dashboard data at this time"
        icon="BarChart3"
        actionLabel="Reload Dashboard"
        onAction={loadDashboardData}
      />
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center shadow-lg">
            <ApperIcon name="BarChart3" size={18} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
<div className="flex items-center gap-2 text-sm text-gray-500">
          <ApperIcon name="RefreshCw" size={14} className={metricsLoading || activityLoading ? "animate-spin" : ""} />
          <span>Real-time updates</span>
        </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your freelance business with real-time metrics.
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <DashboardStats summary={data?.summary} />
      </motion.div>

      {/* Content Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <RecentActivity />
        <QuickActions />
      </motion.div>
    </div>
  );
};

export default Dashboard;