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

export const getDashboardData = async () => {
  try {
    // Get real-time metrics
    const metrics = await getRealTimeMetrics();

    // Get recent activity data
    const recentActivityParams = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "CreatedBy" } }
      ],
      orderBy: [
        {
          fieldName: "CreatedOn",
          sorttype: "DESC"
        }
      ],
      pagingInfo: {
        limit: 5,
        offset: 0
      }
    };

    // Get recent clients
    const recentClientsResponse = await apperClient.fetchRecords("client", recentActivityParams);
    const recentProjectsResponse = await apperClient.fetchRecords("project", recentActivityParams);
    const recentTasksResponse = await apperClient.fetchRecords("task", recentActivityParams);
    const recentInvoicesResponse = await apperClient.fetchRecords("app_invoice", recentActivityParams);

    // Process recent activities
    const recentActivity = [];
    
    // Add recent clients
    if (recentClientsResponse.success && recentClientsResponse.data) {
      recentClientsResponse.data.slice(0, 2).forEach(client => {
        recentActivity.push({
          id: `client-${client.Id}`,
          type: "client",
          title: `New client '${client.Name}' added`,
          client: client.Name,
          time: formatTimeAgo(client.CreatedOn),
          icon: "UserPlus",
          iconColor: "text-emerald-500"
        });
      });
    }

    // Add recent projects
    if (recentProjectsResponse.success && recentProjectsResponse.data) {
      recentProjectsResponse.data.slice(0, 2).forEach(project => {
        recentActivity.push({
          id: `project-${project.Id}`,
          type: "project", 
          title: `Project '${project.Name}' updated`,
          client: project.Name,
          time: formatTimeAgo(project.CreatedOn),
          icon: "CheckCircle2",
          iconColor: "text-green-500"
        });
      });
    }

    // Add recent tasks
    if (recentTasksResponse.success && recentTasksResponse.data) {
      recentTasksResponse.data.slice(0, 2).forEach(task => {
        recentActivity.push({
          id: `task-${task.Id}`,
          type: "task",
          title: `Task '${task.Name || task.title}' created`,
          client: task.Name || task.title,
          time: formatTimeAgo(task.CreatedOn),
          icon: "Plus",
          iconColor: "text-blue-500"
        });
      });
    }

    // Add recent invoices
    if (recentInvoicesResponse.success && recentInvoicesResponse.data) {
      recentInvoicesResponse.data.slice(0, 1).forEach(invoice => {
        recentActivity.push({
          id: `invoice-${invoice.Id}`,
          type: "invoice",
          title: `Invoice '${invoice.Name}' created`,
          client: invoice.Name,
          time: formatTimeAgo(invoice.CreatedOn),
          icon: "FileText", 
          iconColor: "text-purple-500"
        });
      });
    }

    // Sort activities by time and limit to 5
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivity = recentActivity.slice(0, 5);

    return {
      summary: {
        totalClients: metrics.clientCount,
        activeProjects: metrics.projectCount,
        pendingTasks: metrics.taskCount,
        monthlyRevenue: 0, // Keep for compatibility
        completedTasks: 0, // Keep for compatibility
        overdueItems: 0 // Keep for compatibility
      },
      recentActivity: limitedActivity,
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