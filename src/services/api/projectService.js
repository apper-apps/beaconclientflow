const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getAllProjects = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "status" } },
        { field: { Name: "budget" } },
        { field: { Name: "start_date" } },
        { field: { Name: "end_date" } },
        { field: { Name: "description" } },
        { field: { Name: "client_id" } },
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

    const response = await apperClient.fetchRecords("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }
};

export const getProjectById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "status" } },
        { field: { Name: "budget" } },
        { field: { Name: "start_date" } },
        { field: { Name: "end_date" } },
        { field: { Name: "description" } },
        { field: { Name: "client_id" } },
        { field: { Name: "Tags" } }
      ]
    };

    const response = await apperClient.getRecordById("project", parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (!response.data) {
      throw new Error("Project not found");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw new Error(`Failed to fetch project: ${error.message}`);
  }
};

export const createProject = async (projectData) => {
  try {
    const params = {
      records: [
        {
          Name: projectData.name,
          status: projectData.status,
          budget: parseFloat(projectData.budget) || 0,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          description: projectData.description || "",
          client_id: parseInt(projectData.clientId),
          Tags: projectData.tags || ""
        }
      ]
    };

    const response = await apperClient.createRecord("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || "Failed to create project");
      }
      
      const createdProject = successfulRecords[0].data;
      
      // Log activity for project creation
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Created',
          entityName: createdProject.Name,
          entityType: 'Project',
          description: `New project "${createdProject.Name}" has been created`,
          clientId: createdProject.client_id,
          projectId: createdProject.Id
        });
      } catch (activityError) {
        console.error('Failed to log project creation activity:', activityError);
      }
      
      return createdProject;
    }
  } catch (error) {
    console.error("Error creating project:", error);
    throw new Error(`Failed to create project: ${error.message}`);
  }
};

export const updateProject = async (id, projectData) => {
  try {
    const params = {
      records: [
        {
          Id: parseInt(id),
          Name: projectData.name,
          status: projectData.status,
          budget: parseFloat(projectData.budget) || 0,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          description: projectData.description || "",
          client_id: parseInt(projectData.clientId),
          Tags: projectData.tags || ""
        }
      ]
    };

    const response = await apperClient.updateRecord("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update project");
      }
      
      const updatedProject = successfulUpdates[0].data;
      
      // Log activity for project update
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Updated',
          entityName: updatedProject.Name,
          entityType: 'Project',
          description: `Project "${updatedProject.Name}" has been updated`,
          clientId: updatedProject.client_id,
          projectId: updatedProject.Id
        });
      } catch (activityError) {
        console.error('Failed to log project update activity:', activityError);
      }
      
      return updatedProject;
    }
  } catch (error) {
    console.error("Error updating project:", error);
    throw new Error(`Failed to update project: ${error.message}`);
  }
};

export const deleteProject = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord("project", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        throw new Error(failedDeletions[0].message || "Failed to delete project");
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
};