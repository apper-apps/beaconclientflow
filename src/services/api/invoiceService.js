const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const getAllInvoices = async () => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "client_id" } },
        { field: { Name: "project_id" } },
        { field: { Name: "amount" } },
        { field: { Name: "status" } },
        { field: { Name: "due_date" } },
        { field: { Name: "payment_date" } },
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

    const response = await apperClient.fetchRecords("app_invoice", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    return response.data || [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }
};

export const getInvoiceById = async (id) => {
  try {
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "client_id" } },
        { field: { Name: "project_id" } },
        { field: { Name: "amount" } },
        { field: { Name: "status" } },
        { field: { Name: "due_date" } },
        { field: { Name: "payment_date" } },
        { field: { Name: "Tags" } }
      ]
    };

    const response = await apperClient.getRecordById("app_invoice", parseInt(id), params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (!response.data) {
      throw new Error("Invoice not found");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    throw new Error(`Failed to fetch invoice: ${error.message}`);
  }
};

export const createInvoice = async (invoiceData) => {
  try {
    // Validate required fields
    if (!invoiceData.project_id) {
      throw new Error("Project ID is required");
    }
    if (!invoiceData.amount || invoiceData.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
    if (!invoiceData.due_date) {
      throw new Error("Due date is required");
    }

    const params = {
      records: [
        {
          Name: `Invoice-${Date.now()}`,
          client_id: parseInt(invoiceData.client_id) || 0,
          project_id: parseInt(invoiceData.project_id),
          amount: parseFloat(invoiceData.amount),
          status: invoiceData.status || 'draft',
          due_date: invoiceData.due_date,
          payment_date: invoiceData.payment_date || null,
          Tags: invoiceData.tags || ""
        }
      ]
    };

    const response = await apperClient.createRecord("app_invoice", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || "Failed to create invoice");
      }
      
      const createdInvoice = successfulRecords[0].data;
      
      // Log activity for invoice creation
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Created',
          entityName: createdInvoice.Name,
          entityType: 'Invoice',
          description: `New invoice "${createdInvoice.Name}" has been created`,
          clientId: createdInvoice.client_id,
          projectId: createdInvoice.project_id,
          invoiceId: createdInvoice.Id
        });
      } catch (activityError) {
        console.error('Failed to log invoice creation activity:', activityError);
      }
      
      return createdInvoice;
    }
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
};

export const updateInvoice = async (id, invoiceData) => {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      throw new Error("Invalid invoice ID");
    }

    const params = {
      records: [
        {
          Id: parsedId,
          client_id: parseInt(invoiceData.client_id) || 0,
          project_id: parseInt(invoiceData.project_id),
          amount: parseFloat(invoiceData.amount),
          status: invoiceData.status,
          due_date: invoiceData.due_date,
          payment_date: invoiceData.payment_date || null,
          Tags: invoiceData.tags || ""
        }
      ]
    };

    const response = await apperClient.updateRecord("app_invoice", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to update invoice");
      }
      
      const updatedInvoice = successfulUpdates[0].data;
      
      // Log activity for invoice update
      try {
        const { logUserActivity } = await import('./recentActivityService');
        await logUserActivity({
          type: 'Updated',
          entityName: updatedInvoice.Name,
          entityType: 'Invoice',
          description: `Invoice "${updatedInvoice.Name}" has been updated`,
          clientId: updatedInvoice.client_id,
          projectId: updatedInvoice.project_id,
          invoiceId: updatedInvoice.Id
        });
      } catch (activityError) {
        console.error('Failed to log invoice update activity:', activityError);
      }
      
      return updatedInvoice;
    }
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw new Error(`Failed to update invoice: ${error.message}`);
  }
};

export const markInvoiceAsSent = async (id) => {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      throw new Error("Invalid invoice ID");
    }

    const params = {
      records: [
        {
          Id: parsedId,
          status: "sent"
        }
      ]
    };

    const response = await apperClient.updateRecord("app_invoice", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to mark invoice as sent for ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to mark invoice as sent");
      }
      
      return successfulUpdates[0].data;
    }
  } catch (error) {
    console.error("Error marking invoice as sent:", error);
    throw new Error(`Failed to mark invoice as sent: ${error.message}`);
  }
};

export const markInvoiceAsPaid = async (id, paymentDate) => {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      throw new Error("Invalid invoice ID");
    }

    if (!paymentDate) {
      throw new Error("Payment date is required");
    }

    const params = {
      records: [
        {
          Id: parsedId,
          status: "paid",
          payment_date: paymentDate
        }
      ]
    };

    const response = await apperClient.updateRecord("app_invoice", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to mark invoice as paid for ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        throw new Error(failedUpdates[0].message || "Failed to mark invoice as paid");
      }
      
      return successfulUpdates[0].data;
    }
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    throw new Error(`Failed to mark invoice as paid: ${error.message}`);
  }
};

export const deleteInvoice = async (id) => {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      throw new Error("Invalid invoice ID");
    }

    const params = {
      RecordIds: [parsedId]
    };

    const response = await apperClient.deleteRecord("app_invoice", params);
    
    if (!response.success) {
      console.error(response.message);
      throw new Error(response.message);
    }

    if (response.results) {
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        throw new Error(failedDeletions[0].message || "Failed to delete invoice");
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw new Error(`Failed to delete invoice: ${error.message}`);
  }
};