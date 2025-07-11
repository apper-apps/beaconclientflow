import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import { getAllProjects } from "@/services/api/projectService";

const InvoiceModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
const [formData, setFormData] = useState({
    projectId: '',
    dueDate: '',
    status: 'draft',
    paymentDate: '',
    lineItems: [{ description: '', amount: 0 }]
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isOpen) {
      loadProjects();
      if (initialData) {
setFormData({
          projectId: initialData.projectId || '',
          dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
          status: initialData.status || 'draft',
          paymentDate: initialData.paymentDate ? initialData.paymentDate.split('T')[0] : '',
          lineItems: initialData.lineItems || [{ description: '', amount: 0 }]
        });
      } else {
        setFormData({
          projectId: '',
          dueDate: '',
          status: 'draft',
          paymentDate: '',
          lineItems: [{ description: '', amount: 0 }]
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsData = await getAllProjects();
      // Filter for active projects only for invoicing
      const activeProjects = projectsData.filter(project => 
        project.status === 'active' || project.status === 'completed'
      );
      setProjects(activeProjects);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedLineItems = [...formData.lineItems];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      lineItems: updatedLineItems
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', amount: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((total, item) => total + (item.amount || 0), 0);
  };

const getProjectName = (projectId) => {
    const project = projects.find(p => p.Id === parseInt(projectId));
    return project ? project.Name : 'Unknown Project';
  };

  const getProjectClientId = (projectId) => {
    const project = projects.find(p => p.Id === parseInt(projectId));
    return project ? project.client_id : '';
  };

  const getSelectedProjectDetails = () => {
    if (!formData.projectId) return null;
    return projects.find(p => p.Id === parseInt(formData.projectId));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    // Validate line items
    const hasValidLineItems = formData.lineItems.some(item => 
      item.description.trim() && item.amount > 0
    );
    if (!hasValidLineItems) {
      newErrors.lineItems = 'At least one line item with description and amount is required';
    }

    formData.lineItems.forEach((item, index) => {
      if (item.description.trim() && item.amount <= 0) {
        newErrors[`lineItem_${index}_amount`] = 'Amount must be greater than 0';
      }
      if (item.amount > 0 && !item.description.trim()) {
        newErrors[`lineItem_${index}_description`] = 'Description is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
try {
      const total = calculateTotal();
      const invoiceData = {
        projectId: parseInt(formData.projectId),
        clientId: getProjectClientId(formData.projectId),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        amount: total,
        lineItems: formData.lineItems.filter(item => 
          item.description.trim() && item.amount > 0
        )
      };

      // Add payment date if status is paid
      if (formData.status === 'paid' && formData.paymentDate) {
        invoiceData.paymentDate = new Date(formData.paymentDate).toISOString();
      }

      await onSubmit(invoiceData);
      onClose();
      toast.success(initialData ? "Invoice updated successfully!" : "Invoice created successfully!");
    } catch (error) {
      toast.error("Failed to save invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={initialData ? "Edit Invoice" : "Create New Invoice"}
    size="xl">
    <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <div>
            <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project *
                                          </label>
            <select
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loadingProjects}>
                <option value="">Select a billable project</option>
                {projects.map(project => <option key={project.Id} value={project.Id}>
                    {project.Name}- {project.status}
                </option>)}
            </select>
            {errors.projectId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectId}</p>}
            {getSelectedProjectDetails() && <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selected Project Details
                                    </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Project: {getSelectedProjectDetails().Name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status: {getSelectedProjectDetails().status}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Client ID: {getSelectedProjectDetails().client_id}
                </p>
            </div>}
        </div>
        {errors.projectId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectId}</p>}
        {/* Due Date */}
        <div>
            <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *
                                          </label>
            <Input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full" />
            {errors.dueDate && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dueDate}</p>}
        </div>
        {/* Status */}
        <div>
            <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status
                                          </label>
            <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
            </select>
        </div>
        {/* Payment Date - Only show if status is paid */}
        {formData.status === "paid" && <div>
            <label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Date
                                            </label>
            <Input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleInputChange}
                className="w-full"
                max={new Date().toISOString().split("T")[0]} />
        </div>}
        {/* Line Items */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Line Items *
                                                    </label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <ApperIcon name="Plus" size={14} className="mr-2" />Add Item
                                                    </Button>
            </div>
            <div className="space-y-3">
                {formData.lineItems.map((item, index) => <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Item description..."
                                value={item.description}
                                onChange={e => handleLineItemChange(index, "description", e.target.value)}
                                className="mb-2" />
                            {errors[`lineItem_${index}_description`] && <p className="text-sm text-red-600 dark:text-red-400">{errors[`lineItem_${index}_description`]}</p>}
                        </div>
                        <div className="w-32">
                            <Input
                                type="number"
                                placeholder="Amount"
                                value={item.amount}
                                onChange={e => handleLineItemChange(index, "amount", e.target.value)}
                                min="0"
                                step="0.01"
                                className="mb-2" />
                            {errors[`lineItem_${index}_amount`] && <p className="text-sm text-red-600 dark:text-red-400">{errors[`lineItem_${index}_amount`]}</p>}
                        </div>
                        {formData.lineItems.length > 1 && <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                            <ApperIcon name="Trash2" size={16} />
                        </Button>}
                    </div>
                </Card>)}
            </div>
            {errors.lineItems && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.lineItems}</p>}
        </div>
        {/* Total */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-white">Total Amount:
                                                    </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">${calculateTotal().toLocaleString()}
                </span>
            </div>
        </div>
        {/* Actions */}
        <div
            className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel
                                          </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <>
                    <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                    {initialData ? "Updating..." : "Creating..."}
                </> : <>
                    <ApperIcon name="Save" size={16} className="mr-2" />
                    {initialData ? "Update Invoice" : "Create Invoice"}
                </>}
            </Button>
        </div>
    </form>
</Modal>
  );
};

export default InvoiceModal;