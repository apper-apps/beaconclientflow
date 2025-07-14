import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  metrics: {
    clientCount: 0,
    projectCount: 0,
    taskCount: 0,
    timeTrackingCount: 0,
    invoiceCount: 0,
  },
  loading: false,
  error: null,
  lastUpdated: null,
recentActivity: [],
  activityLoading: false,
  activityError: null,
  selectedActivity: null,
  selectedActivityLoading: false,
  selectedActivityError: null,
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
reducers: {
    setMetricsLoading: (state, action) => {
      state.loading = action.payload;
    },
    setMetrics: (state, action) => {
      state.metrics = action.payload;
      state.loading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setMetricsError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateClientCount: (state, action) => {
      state.metrics.clientCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateProjectCount: (state, action) => {
      state.metrics.projectCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateTaskCount: (state, action) => {
      state.metrics.taskCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateTimeTrackingCount: (state, action) => {
      state.metrics.timeTrackingCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateInvoiceCount: (state, action) => {
      state.metrics.invoiceCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    setActivityLoading: (state, action) => {
      state.activityLoading = action.payload;
    },
    setRecentActivity: (state, action) => {
      state.recentActivity = action.payload;
      state.activityLoading = false;
      state.activityError = null;
    },
    setActivityError: (state, action) => {
      state.activityError = action.payload;
      state.activityLoading = false;
},
    addRecentActivity: (state, action) => {
      state.recentActivity.unshift(action.payload);
      if (state.recentActivity.length > 10) {
        state.recentActivity = state.recentActivity.slice(0, 10);
      }
    },
    updateRecentActivity: (state, action) => {
      const index = state.recentActivity.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.recentActivity[index] = action.payload;
      }
    },
    setSelectedActivity: (state, action) => {
      state.selectedActivity = action.payload;
      state.selectedActivityLoading = false;
      state.selectedActivityError = null;
    },
    setSelectedActivityLoading: (state, action) => {
      state.selectedActivityLoading = action.payload;
    },
    setSelectedActivityError: (state, action) => {
      state.selectedActivityError = action.payload;
      state.selectedActivityLoading = false;
    },
    clearSelectedActivity: (state) => {
      state.selectedActivity = null;
      state.selectedActivityLoading = false;
      state.selectedActivityError = null;
    },
    clearMetrics: (state) => {
      state.metrics = initialState.metrics;
      state.error = null;
      state.lastUpdated = null;
    },
    clearRecentActivity: (state) => {
      state.recentActivity = [];
      state.activityError = null;
    },
  },
});

export const {
  setMetricsLoading,
  setMetrics,
  setMetricsError,
  updateClientCount,
  updateProjectCount,
  updateTaskCount,
  updateTimeTrackingCount,
  updateInvoiceCount,
  setActivityLoading,
  setRecentActivity,
setActivityError,
  addRecentActivity,
  updateRecentActivity,
  setSelectedActivity,
  setSelectedActivityLoading,
  setSelectedActivityError,
  clearSelectedActivity,
  clearMetrics,
  clearRecentActivity,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;