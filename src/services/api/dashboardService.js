const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getDashboardData = async () => {
  try {
    // Fetch dashboard statistics using aggregators
    const statsParams = {
      aggregators: [
        {
          id: "totalClients",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ]
        },
        {
          id: "activeProjects", 
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "status",
              Operator: "EqualTo",
              Values: ["active"]
            }
          ]
        },
        {
          id: "pendingTasks",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "status", 
              Operator: "ExactMatch",
              Values: ["todo", "in-progress"]
            }
          ]
        },
        {
          id: "completedTasks",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "status",
              Operator: "EqualTo", 
              Values: ["done"]
            }
          ]
        },
        {
          id: "overdueItems",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "due_date",
              Operator: "LessThan",
              Values: [new Date().toISOString().split('T')[0]]
            },
            {
              FieldName: "status",
              Operator: "NotEqualTo",
              Values: ["done"]
            }
          ]
        }
      ]
    };

    // Get client statistics
    const clientResponse = await apperClient.fetchRecords("client", statsParams);
    if (!clientResponse.success) {
      throw new Error(clientResponse.message);
    }

    // Get project statistics  
    const projectParams = {
      aggregators: [
        {
          id: "activeProjects",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "status",
              Operator: "EqualTo",
              Values: ["active"]
            }
          ]
        }
      ]
    };

    const projectResponse = await apperClient.fetchRecords("project", projectParams);
    if (!projectResponse.success) {
      throw new Error(projectResponse.message);
    }

    // Get task statistics
    const taskParams = {
      aggregators: [
        {
          id: "pendingTasks",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "status",
              Operator: "ExactMatch", 
              Values: ["todo", "in-progress"]
            }
          ]
        },
        {
          id: "completedTasks",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "status",
              Operator: "EqualTo",
              Values: ["done"]
            }
          ]
        },
        {
          id: "overdueItems",
          fields: [
            {
              field: { Name: "Id" },
              Function: "Count"
            }
          ],
          where: [
            {
              FieldName: "due_date",
              Operator: "LessThan",
              Values: [new Date().toISOString().split('T')[0]]
            },
            {
              FieldName: "status",
              Operator: "NotEqualTo", 
              Values: ["done"]
            }
          ]
        }
      ]
    };

    const taskResponse = await apperClient.fetchRecords("task", taskParams);
    if (!taskResponse.success) {
      throw new Error(taskResponse.message);
    }

    // Get invoice statistics for revenue
    const invoiceParams = {
      aggregators: [
        {
          id: "monthlyRevenue",
          fields: [
            {
              field: { Name: "amount" },
              Function: "Sum"
            }
          ],
          where: [
            {
              FieldName: "CreatedOn",
              Operator: "RelativeMatch",
              Values: ["this month"]
            },
            {
              FieldName: "status",
              Operator: "EqualTo",
              Values: ["paid"]
            }
          ]
        }
      ]
    };

    const invoiceResponse = await apperClient.fetchRecords("app_invoice", invoiceParams);
    if (!invoiceResponse.success) {
      throw new Error(invoiceResponse.message);
    }

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

    // Extract aggregator results
    const totalClients = clientResponse.aggregators?.find(a => a.id === "totalClients")?.value || 0;
    const activeProjects = projectResponse.aggregators?.find(a => a.id === "activeProjects")?.value || 0;
    const pendingTasks = taskResponse.aggregators?.find(a => a.id === "pendingTasks")?.value || 0;
    const completedTasks = taskResponse.aggregators?.find(a => a.id === "completedTasks")?.value || 0;
    const overdueItems = taskResponse.aggregators?.find(a => a.id === "overdueItems")?.value || 0;
    const monthlyRevenue = invoiceResponse.aggregators?.find(a => a.id === "monthlyRevenue")?.value || 0;

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
        totalClients,
        activeProjects,
        pendingTasks,
        monthlyRevenue,
        completedTasks,
        overdueItems
      },
      recentActivity: limitedActivity,
      quickStats: {
        projectsThisWeek: activeProjects,
        tasksCompleted: completedTasks,
        hoursTracked: 0, // This would need time tracking data
        invoicesSent: 0  // This would need sent invoices count
      }
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