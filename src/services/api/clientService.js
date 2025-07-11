const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getAllClients = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email" } },
        { field: { Name: "company" } },
        { field: { Name: "status" } },
        { field: { Name: "createdAt" } },
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

    const response = await apperClient.fetchRecords("client", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new Error(`Failed to fetch clients: ${error.message}`);
  }
};

export const getClientById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "email" } },
        { field: { Name: "company" } },
        { field: { Name: "status" } },
        { field: { Name: "createdAt" } },
        { field: { Name: "Tags" } }
      ]
    };

    const response = await apperClient.getRecordById("client", parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (!response.data) {
      throw new Error("Client not found");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching client:", error);
    throw new Error(`Failed to fetch client: ${error.message}`);
  }
};

export const createClient = async (clientData) => {
  try {
    const params = {
      records: [
        {
          Name: clientData.name,
          email: clientData.email,
          company: clientData.company,
          status: clientData.status,
          createdAt: new Date().toISOString(),
          Tags: clientData.tags || ""
        }
      ]
    };

    const response = await apperClient.createRecord("client", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || "Failed to create client");
      }
      
      const createdClient = successfulRecords[0].data;
      
      // Log activity for client creation
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Created',
          entityName: createdClient.Name,
          entityType: 'Client',
          description: `New client "${createdClient.Name}" has been created`,
          clientId: createdClient.Id
        });
      } catch (activityError) {
        console.error('Failed to log client creation activity:', activityError);
      }
      
      return createdClient;
    }
  } catch (error) {
    console.error("Error creating client:", error);
    throw new Error(`Failed to create client: ${error.message}`);
  }
};

export const updateClient = async (id, clientData) => {
  try {
    const params = {
      records: [
        {
          Id: parseInt(id),
          Name: clientData.name,
          email: clientData.email,
          company: clientData.company,
          status: clientData.status,
          Tags: clientData.tags || ""
        }
      ]
    };

    const response = await apperClient.updateRecord("client", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update client");
      }
      
      const updatedClient = successfulUpdates[0].data;
      
      // Log activity for client update
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Updated',
          entityName: updatedClient.Name,
          entityType: 'Client',
          description: `Client "${updatedClient.Name}" has been updated`,
          clientId: updatedClient.Id
        });
      } catch (activityError) {
        console.error('Failed to log client update activity:', activityError);
      }
      
      return updatedClient;
    }
  } catch (error) {
    console.error("Error updating client:", error);
    throw new Error(`Failed to update client: ${error.message}`);
  }
};

export const deleteClient = async (id) => {
  try {
    const params = {
      RecordIds: [parseInt(id)]
    };

    const response = await apperClient.deleteRecord("client", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        throw new Error(failedDeletions[0].message || "Failed to delete client");
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error deleting client:", error);
    throw new Error(`Failed to delete client: ${error.message}`);
  }
};