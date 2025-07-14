import React from "react";
import Error from "@/components/ui/Error";
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

// Real-time metrics service for dashboard
export const getRealTimeMetrics = async () => {
  try {
    // Get client count
    const clientParams = {
      aggregators: [
        {
          id: "totalClients",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ]
        }
      ]
    };

    const clientResponse = await apperClient.fetchRecords("client", clientParams);
    if (!clientResponse.success) {
      throw new Error(clientResponse.message);
    }

    // Get project count
    const projectParams = {
      aggregators: [
        {
          id: "totalProjects",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ]
        }
      ]
    };

    const projectResponse = await apperClient.fetchRecords("project", projectParams);
    if (!projectResponse.success) {
      throw new Error(projectResponse.message);
    }

    // Get task count
    const taskParams = {
      aggregators: [
        {
          id: "totalTasks",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ]
        }
      ]
    };

    const taskResponse = await apperClient.fetchRecords("task", taskParams);
    if (!taskResponse.success) {
      throw new Error(taskResponse.message);
    }

    // Get time tracking count (tasks with time tracking data)
    const timeTrackingParams = {
      aggregators: [
        {
          id: "timeTrackingCount",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "time_tracking",
              Operator: "HasValue",
              Values: []
            }
          ]
        }
      ]
    };

    const timeTrackingResponse = await apperClient.fetchRecords("task", timeTrackingParams);
    if (!timeTrackingResponse.success) {
      throw new Error(timeTrackingResponse.message);
    }

    // Get invoice count
    const invoiceParams = {
      aggregators: [
        {
          id: "totalInvoices",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ]
        }
      ]
    };

    const invoiceResponse = await apperClient.fetchRecords("app_invoice", invoiceParams);
    if (!invoiceResponse.success) {
      throw new Error(invoiceResponse.message);
    }

    // Extract counts from aggregator results
    const clientCount = clientResponse.aggregators?.find(a => a.id === "totalClients")?.value || 0;
    const projectCount = projectResponse.aggregators?.find(a => a.id === "totalProjects")?.value || 0;
    const taskCount = taskResponse.aggregators?.find(a => a.id === "totalTasks")?.value || 0;
    const timeTrackingCount = timeTrackingResponse.aggregators?.find(a => a.id === "timeTrackingCount")?.value || 0;
    const invoiceCount = invoiceResponse.aggregators?.find(a => a.id === "totalInvoices")?.value || 0;

    return {
      clientCount,
      projectCount,
      taskCount,
      timeTrackingCount,
      invoiceCount
    };

  } catch (error) {
    console.error("Error fetching real-time metrics:", error);
    throw new Error(`Failed to fetch real-time metrics: ${error.message}`);
  }
};

// Log activity to the recent_activity table
export const logActivity = async (activityData) => {
  try {
    const { type, entityId, entityName, entityType, description, userId, clientId, projectId, taskId, invoiceId } = activityData;
    
    const activityRecord = {
      Name: `${type} ${entityType}`,
      activity_type: type,
      description: description || `${type} operation on ${entityType}: ${entityName}`,
      activity_timestamp: new Date().toISOString(),
      client_id: clientId || null,
      project_id: projectId || null,
      task_id: taskId || null,
      invoice_id: invoiceId || null,
      Owner: userId || null
    };

    // Remove null values to avoid sending unnecessary fields
    const cleanedRecord = Object.fromEntries(
      Object.entries(activityRecord).filter(([_, v]) => v != null)
    );

    const params = {
      records: [cleanedRecord]
    };

    const response = await apperClient.createRecord("recent_activity", params);
    
    if (!response.success) {
      console.error("Failed to log activity:", response.message);
      return false;
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      if (failedRecords.length > 0) {
        console.error(`Failed to log activity:${JSON.stringify(failedRecords)}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error logging activity:", error);
    return false;
  }
};

// Get real-time recent activity data
export const getRealTimeActivity = async () => {
  try {
    const activityParams = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "activity_type" } },
        { field: { Name: "client_id" } },
        { field: { Name: "project_id" } },
        { field: { Name: "task_id" } },
        { field: { Name: "invoice_id" } },
        { field: { Name: "description" } },
        { field: { Name: "activity_timestamp" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "ModifiedOn" } }
      ],
      orderBy: [
        {
          fieldName: "activity_timestamp",
          sorttype: "DESC"
        }
      ],
      pagingInfo: {
        limit: 10,
        offset: 0
      }
    };

    const response = await apperClient.fetchRecords("recent_activity", activityParams);
    
    if (!response.success) {
      throw new Error(response.message);
    }

    // Handle empty response
    if (!response.data || response.data.length === 0) {
      return [];
    }

    // Process activity data with improved mapping
    const activities = response.data.map(activity => {
      const activityType = activity.activity_type || "activity";
      const timestamp = activity.activity_timestamp || activity.ModifiedOn || activity.CreatedOn;
      
      return {
        id: activity.Id,
        type: activityType,
        title: activity.Name || activity.description || "Recent Activity",
        client: activity.client_id?.Name || "Unknown Client",
        time: formatTimeAgo(timestamp),
        icon: getActivityIcon(activityType),
        iconColor: getActivityIconColor(activityType),
        description: activity.description,
        timestamp: timestamp
      };
    });

    return activities;

  } catch (error) {
    console.error("Error fetching real-time activity:", error);
    throw new Error(`Failed to fetch real-time activity: ${error.message}`);
  }
};

// Helper function to get activity icon
const getActivityIcon = (activityType) => {
  const iconMap = {
    'client': 'UserPlus',
    'project': 'CheckCircle2',
    'task': 'Plus',
    'invoice': 'FileText',
    'payment': 'DollarSign',
    'time': 'Clock',
    'default': 'Activity'
  };
  return iconMap[activityType] || iconMap.default;
};

// Helper function to get activity icon color
const getActivityIconColor = (activityType) => {
  const colorMap = {
    'client': 'text-emerald-500',
    'project': 'text-green-500',
    'task': 'text-blue-500',
    'invoice': 'text-purple-500',
    'payment': 'text-yellow-500',
    'time': 'text-orange-500',
    'default': 'text-gray-500'
  };
  return colorMap[activityType] || colorMap.default;
};

export const getDashboardData = async () => {
  try {
    // Get real-time metrics
    const metrics = await getRealTimeMetrics();

    // Get real-time activity data
    const recentActivity = await getRealTimeActivity();

    return {
      summary: {
        totalClients: metrics.clientCount,
        activeProjects: metrics.projectCount,
        pendingTasks: metrics.taskCount,
        monthlyRevenue: 0, // Keep for compatibility
        completedTasks: 0, // Keep for compatibility
        overdueItems: 0 // Keep for compatibility
      },
      recentActivity: recentActivity,
      quickStats: {
        projectsThisWeek: metrics.projectCount,
        tasksCompleted: 0,
        hoursTracked: metrics.timeTrackingCount,
        invoicesSent: metrics.invoiceCount
      },
      realTimeMetrics: metrics
    };

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error(`Failed to fetch dashboard data: ${error.message}`);
  }
};

// Helper function to format time ago with improved accuracy
const formatTimeAgo = (dateString) => {
  if (!dateString) return "Unknown time";
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  
  // Calculate precise time differences
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  
  // Handle very recent activities (less than 1 minute)
  if (diffMinutes < 1) {
    return "Just now";
  }
  // Handle activities within the last hour with minute precision
  else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  // Handle activities within the last day with hour precision
  else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  // Handle activities within the last week with day precision
  else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  // Handle activities within the last month with week precision
  else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  }
  // For older activities, show the actual date
  else {
    return date.toLocaleDateString();
  }
};