const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

// Get all recent activities
export const getAll = async () => {
  try {
    const params = {
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
        limit: 20,
        offset: 0
      }
    };

    const response = await apperClient.fetchRecords("recent_activity", params);
    
    if (!response.success) {
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

// Get recent activity by ID
export const getById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "activity_type" } },
        { field: { Name: "client_id" } },
        { field: { Name: "project_id" } },
        { field: { Name: "task_id" } },
        { field: { Name: "invoice_id" } },
        { field: { Name: "description" } },
        { field: { Name: "activity_timestamp" } }
      ]
    };

    const response = await apperClient.getRecordById("recent_activity", id, params);
    
    if (!response.success) {
      throw new Error(response.message);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching recent activity with ID ${id}:`, error);
    throw error;
  }
};

// Create new recent activity
export const create = async (item) => {
  try {
    const params = {
      records: [
        {
          Name: item.Name,
          activity_type: item.activity_type,
          description: item.description,
          activity_timestamp: item.activity_timestamp || new Date().toISOString(),
          client_id: item.client_id || null,
          project_id: item.project_id || null,
          task_id: item.task_id || null,
          invoice_id: item.invoice_id || null,
          Owner: item.Owner || null
        }
      ]
    };

    // Remove null values
    const cleanedRecord = Object.fromEntries(
      Object.entries(params.records[0]).filter(([_, v]) => v != null)
    );
    params.records[0] = cleanedRecord;

    const response = await apperClient.createRecord("recent_activity", params);
    
    if (!response.success) {
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      if (failedRecords.length > 0) {
        console.error(`Failed to create recent activity:${JSON.stringify(failedRecords)}`);
        throw new Error("Failed to create recent activity");
      }
      return response.results[0].data;
    }

    return response.data;
  } catch (error) {
    console.error("Error creating recent activity:", error);
    throw error;
  }
};

// Update recent activity
export const update = async (id, data) => {
  try {
    const params = {
      records: [
        {
          Id: id,
          Name: data.Name,
          activity_type: data.activity_type,
          description: data.description,
          activity_timestamp: data.activity_timestamp,
          client_id: data.client_id || null,
          project_id: data.project_id || null,
          task_id: data.task_id || null,
          invoice_id: data.invoice_id || null,
          Owner: data.Owner || null
        }
      ]
    };

    // Remove null values
    const cleanedRecord = Object.fromEntries(
      Object.entries(params.records[0]).filter(([_, v]) => v != null)
    );
    params.records[0] = cleanedRecord;

    const response = await apperClient.updateRecord("recent_activity", params);
    
    if (!response.success) {
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      if (failedRecords.length > 0) {
        console.error(`Failed to update recent activity:${JSON.stringify(failedRecords)}`);
        throw new Error("Failed to update recent activity");
      }
      return response.results[0].data;
    }

    return response.data;
  } catch (error) {
    console.error("Error updating recent activity:", error);
    throw error;
  }
};

// Delete recent activity
export const deleteActivity = async (id) => {
  try {
    const params = {
      RecordIds: [id]
    };

    const response = await apperClient.deleteRecord("recent_activity", params);
    
    if (!response.success) {
      throw new Error(response.message);
    }

    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      if (failedRecords.length > 0) {
        console.error(`Failed to delete recent activity:${JSON.stringify(failedRecords)}`);
        throw new Error("Failed to delete recent activity");
      }
    }

    return true;
  } catch (error) {
    console.error("Error deleting recent activity:", error);
    throw error;
  }
};

// Create sample activities for initial data population
export const createSampleActivities = async () => {
  try {
    const currentTime = new Date();
    
    const sampleActivities = [
      {
        Name: "Project Created",
        activity_type: "project",
        description: "New project 'Website Redesign' has been created",
        activity_timestamp: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        Name: "Task Assigned",
        activity_type: "task",
        description: "Task 'Review wireframes' has been assigned",
        activity_timestamp: new Date(currentTime.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      },
      {
        Name: "Invoice Sent",
        activity_type: "invoice",
        description: "Invoice #1247 has been sent to client",
        activity_timestamp: new Date(currentTime.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      },
      {
        Name: "Client Added",
        activity_type: "client",
        description: "New client 'Fashion Brand' has been added to the system",
        activity_timestamp: new Date(currentTime.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        Name: "Payment Received",
        activity_type: "payment",
        description: "Payment has been received from client",
        activity_timestamp: new Date(currentTime.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        Name: "Project Updated",
        activity_type: "project",
        description: "Project status has been updated to 'In Progress'",
        activity_timestamp: new Date(currentTime.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        Name: "Task Completed",
        activity_type: "task",
        description: "Task 'Initial consultation' has been marked as completed",
        activity_timestamp: new Date(currentTime.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      },
      {
        Name: "Time Logged",
        activity_type: "time",
        description: "2.5 hours logged for project work",
        activity_timestamp: new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      }
    ];

    // Check if activities already exist
    const existingActivities = await getAll();
    if (existingActivities.length > 0) {
      console.log("Sample activities already exist, skipping creation");
      return existingActivities;
    }

    // Create activities one by one
    const createdActivities = [];
    for (const activity of sampleActivities) {
      try {
        const created = await create(activity);
        createdActivities.push(created);
        console.log(`Created sample activity: ${activity.Name}`);
      } catch (error) {
        console.error(`Failed to create sample activity ${activity.Name}:`, error);
      }
    }

    return createdActivities;
  } catch (error) {
    console.error("Error creating sample activities:", error);
    throw error;
  }
};

// Log user activity automatically
export const logUserActivity = async (activityData) => {
  try {
    const { type, entityName, entityType, description, userId, clientId, projectId, taskId, invoiceId } = activityData;
    
    const activity = {
      Name: `${type} ${entityType}`,
      activity_type: type.toLowerCase(),
      description: description || `${type} operation on ${entityType}: ${entityName}`,
      activity_timestamp: new Date().toISOString(),
      client_id: clientId ? parseInt(clientId) : null,
      project_id: projectId ? parseInt(projectId) : null,
      task_id: taskId ? parseInt(taskId) : null,
      invoice_id: invoiceId ? parseInt(invoiceId) : null,
      Owner: userId ? parseInt(userId) : null
    };

    return await create(activity);
  } catch (error) {
    console.error("Error logging user activity:", error);
    // Don't throw error for logging failures to avoid breaking main operations
    return null;
  }
};

// Get formatted recent activities for display
export const getRecentActivities = async () => {
  try {
    const activities = await getAll();
    
    // Format activities for display
    const formattedActivities = activities.map(activity => {
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

    return formattedActivities;
  } catch (error) {
    console.error("Error getting formatted recent activities:", error);
    throw error;
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

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  if (!dateString) return "Unknown time";
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};