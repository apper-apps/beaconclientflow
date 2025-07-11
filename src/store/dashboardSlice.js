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
    clearMetrics: (state) => {
      state.metrics = initialState.metrics;
      state.error = null;
      state.lastUpdated = null;
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
  clearMetrics,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;