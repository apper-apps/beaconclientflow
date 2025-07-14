const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getAllTasks = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "title" } },
        { field: { Name: "priority" } },
        { field: { Name: "status" } },
        { field: { Name: "due_date" } },
{ field: { Name: "total_time" } },
        { field: { Name: "active_timer" } },
        { field: { Name: "time_tracking" } },
        { 
          field: { Name: "project_id" },
          referenceField: { field: { Name: "Name" } }
        },
        { field: { Name: "Tags" } }
      ],
      orderBy: [
        {
          fieldName: "CreatedOn",
          sorttype: "DESC"
        }
      ],
      pagingInfo: {
        limit: 100,
        offset: 0
      }
    };

    const response = await apperClient.fetchRecords("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};

export const getTaskById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "title" } },
        { field: { Name: "priority" } },
        { field: { Name: "status" } },
        { field: { Name: "due_date" } },
{ field: { Name: "total_time" } },
        { field: { Name: "active_timer" } },
        { field: { Name: "time_tracking" } },
        { 
          field: { Name: "project_id" },
          referenceField: { field: { Name: "Name" } }
        },
        { field: { Name: "Tags" } }
      ]
    };

    const response = await apperClient.getRecordById("task", parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (!response.data) {
      throw new Error("Task not found");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching task:", error);
    throw new Error(`Failed to fetch task: ${error.message}`);
  }
};

export const createTask = async (taskData) => {
  try {
    const params = {
      records: [
        {
          Name: taskData.name || taskData.title,
title: taskData.title,
          priority: taskData.priority,
          status: taskData.status,
          due_date: taskData.dueDate,
          total_time: 0,
          active_timer: String(taskData.active_timer || ""),
          time_tracking: String(taskData.time_tracking || ""),
          project_id: parseInt(taskData.projectId) || 0,
          Tags: taskData.tags || ""
        }
      ]
    };

    const response = await apperClient.createRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || "Failed to create task");
      }
      
      const createdTask = successfulRecords[0].data;
      
      // Log activity for task creation
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Created',
          entityName: createdTask.Name || createdTask.title,
          entityType: 'Task',
          description: `New task "${createdTask.Name || createdTask.title}" has been created`,
          projectId: createdTask.project_id,
          taskId: createdTask.Id
        });
      } catch (activityError) {
        console.error('Failed to log task creation activity:', activityError);
      }
      
      return createdTask;
    }
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const params = {
      records: [
        {
          Id: parseInt(id),
          Name: taskData.name || taskData.title,
          title: taskData.title,
          priority: taskData.priority,
          status: taskData.status,
          due_date: taskData.dueDate,
          total_time: taskData.total_time || 0,
          active_timer: String(taskData.active_timer || ""),
          time_tracking: String(taskData.time_tracking || ""),
          project_id: parseInt(taskData.projectId) || 0,
          Tags: taskData.tags || ""
        }
      ]
    };
    const response = await apperClient.updateRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update task");
      }
      
      const updatedTask = successfulUpdates[0].data;
      
      // Log activity for task update
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Updated',
          entityName: updatedTask.Name || updatedTask.title,
          entityType: 'Task',
          description: `Task "${updatedTask.Name || updatedTask.title}" has been updated`,
          projectId: updatedTask.project_id,
          taskId: updatedTask.Id
        });
      } catch (activityError) {
        console.error('Failed to log task update activity:', activityError);
      }
      
      return updatedTask;
    }
  } catch (error) {
    console.error("Error updating task:", error);
    throw new Error(`Failed to update task: ${error.message}`);
  }
};

export const updateTaskStatus = async (id, status) => {
  try {
    const params = {
      records: [
        {
          Id: parseInt(id),
          status: status
        }
      ]
    };

    const response = await apperClient.updateRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update task status");
      }
      
      return successfulUpdates[0].data;
    }
  } catch (error) {
    console.error("Error updating task status:", error);
    throw new Error(`Failed to update task status: ${error.message}`);
  }
};

export const deleteTask = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        throw new Error(failedDeletions[0].message || "Failed to delete task");
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};

export const startTaskTimer = async (id) => {
  try {
    const now = new Date().toISOString();
    const params = {
      records: [
        {
          Id: parseInt(id),
          active_timer: now
        }
      ]
    };

    const response = await apperClient.updateRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to start timer for ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to start timer");
      }
      
      return {
        Id: parseInt(id),
        startTime: now
      };
    }
  } catch (error) {
    console.error("Error starting timer:", error);
    throw new Error(`Failed to start timer: ${error.message}`);
  }
};

export const stopTaskTimer = async (id) => {
  try {
const params = {
      records: [
        {
          Id: parseInt(id),
          active_timer: String("")
        }
      ]
    };

    const response = await apperClient.updateRecord("task", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to stop timer for ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to stop timer");
      }
      
      return {
        Id: parseInt(id),
        endTime: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error("Error stopping timer:", error);
    throw new Error(`Failed to stop timer: ${error.message}`);
  }
};

export const getTaskTimeLogs = async (id) => {
  try {
    const task = await getTaskById(id);
    const timeTracking = task.time_tracking ? JSON.parse(task.time_tracking) : null;
    return timeTracking?.timeLogs || [];
  } catch (error) {
    console.error("Error fetching time logs:", error);
    throw new Error(`Failed to fetch time logs: ${error.message}`);
  }
};