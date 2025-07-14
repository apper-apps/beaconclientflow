import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import { getAllClients } from "@/services/api/clientService";
import { getAllProjects } from "@/services/api/projectService";
import { getAllTasks } from "@/services/api/taskService";

const TimeEntryModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    taskId: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadAllProjects();
      loadAllTasks();
      
      if (initialData) {
        setFormData({
          clientId: initialData.clientId || '',
          projectId: initialData.projectId || '',
          taskId: initialData.taskId || '',
          startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
          endTime: initialData.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : '',
          description: initialData.description || ''
        });
      } else {
        setFormData({
          clientId: '',
          projectId: '',
          taskId: '',
          startTime: '',
          endTime: '',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

// Filter projects when client changes
  useEffect(() => {
    if (formData.clientId) {
      console.log('Filtering projects for client:', formData.clientId);
      console.log('All projects:', allProjects);
      
      const selectedClientId = parseInt(formData.clientId);
      const clientProjects = allProjects.filter(project => {
        // Handle both direct client_id and nested client_id object
        const projectClientId = project.client_id?.Id || project.client_id;
        const parsedProjectClientId = parseInt(projectClientId);
        
        console.log(`Project "${project.Name}" client_id:`, projectClientId, 'comparing with:', selectedClientId);
        return parsedProjectClientId === selectedClientId;
      });
      
      console.log('Filtered projects:', clientProjects);
      setProjects(clientProjects);
      
      // Reset project and task if current selection is not valid
      if (formData.projectId && !clientProjects.find(p => p.Id === parseInt(formData.projectId))) {
        setFormData(prev => ({ ...prev, projectId: '', taskId: '' }));
      }
    } else {
      setProjects([]);
      setFormData(prev => ({ ...prev, projectId: '', taskId: '' }));
    }
  }, [formData.clientId, allProjects]);

// Filter tasks when project changes
  useEffect(() => {
    if (formData.projectId) {
      console.log('Filtering tasks for project:', formData.projectId);
      console.log('All tasks:', allTasks);
      
      const selectedProjectId = parseInt(formData.projectId);
      const projectTasks = allTasks.filter(task => {
        // Handle both direct project_id and nested project_id object
        const taskProjectId = task.project_id?.Id || task.project_id;
        const parsedTaskProjectId = parseInt(taskProjectId);
        
        // Only include active tasks
        const isActiveTask = ['todo', 'in-progress', 'review'].includes(task.status);
        
        console.log(`Task "${task.title || task.Name}" project_id:`, taskProjectId, 'status:', task.status, 'comparing with:', selectedProjectId);
        return parsedTaskProjectId === selectedProjectId && isActiveTask;
      });
      
      console.log('Filtered tasks for project:', projectTasks);
      setTasks(projectTasks);
      
      // Reset task if current selection is not valid
      if (formData.taskId && !projectTasks.find(t => t.Id === parseInt(formData.taskId))) {
        setFormData(prev => ({ ...prev, taskId: '' }));
      }
    } else {
      setTasks([]);
      setFormData(prev => ({ ...prev, taskId: '' }));
    }
  }, [formData.projectId, allTasks]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const clientsData = await getAllClients();
      const activeClients = clientsData.filter(client => client.status === 'active');
      setClients(activeClients);
    } catch (error) {
      toast.error("Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  };

const loadAllProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsData = await getAllProjects();
      
      // Filter to only active projects and ensure they have valid client_id
      const validProjects = projectsData.filter(project => {
        const hasValidClientId = project.client_id && 
          (typeof project.client_id === 'number' || 
           (typeof project.client_id === 'object' && project.client_id.Id));
        const isActiveProject = ['active', 'planning'].includes(project.status);
        return hasValidClientId && isActiveProject;
      });
      
      console.log('Loaded projects:', validProjects);
      setAllProjects(validProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
      setAllProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

const loadAllTasks = async () => {
    try {
      setLoadingTasks(true);
      const tasksData = await getAllTasks();
      
      // Filter to only active tasks
      const activeTasks = tasksData.filter(task => {
        const isActiveTask = ['todo', 'in-progress', 'review'].includes(task.status);
        const hasValidProjectId = task.project_id && 
          (typeof task.project_id === 'number' || 
           (typeof task.project_id === 'object' && task.project_id.Id));
        return isActiveTask && hasValidProjectId;
      });
      
      console.log('Loaded active tasks:', activeTasks);
      setAllTasks(activeTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
      setAllTasks([]);
    } finally {
      setLoadingTasks(false);
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

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const durationMs = end - start;
    
    return durationMs > 0 ? durationMs : 0;
  };

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return "0h 0m";
    
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.taskId) {
      newErrors.taskId = 'Task is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
      
      const durationMs = end - start;
      const maxDurationMs = 24 * 60 * 60 * 1000; // 24 hours
      
      if (durationMs > maxDurationMs) {
        newErrors.endTime = 'Duration cannot exceed 24 hours';
      }
    }

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
      const duration = calculateDuration();
      const billableHours = duration / (1000 * 60 * 60); // Convert to hours
      
      const timeEntryData = {
        clientId: parseInt(formData.clientId),
        projectId: parseInt(formData.projectId),
        taskId: parseInt(formData.taskId),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        billableHours: billableHours,
        description: formData.description || ''
      };

      await onSubmit(timeEntryData);
      onClose();
      toast.success(initialData ? "Time entry updated successfully!" : "Time entry logged successfully!");
    } catch (error) {
      toast.error("Failed to save time entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.Id === parseInt(clientId));
    return client ? client.Name : 'Unknown Client';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.Id === parseInt(projectId));
    return project ? project.Name : 'Unknown Project';
  };

  const getTaskName = (taskId) => {
    const task = tasks.find(t => t.Id === parseInt(taskId));
    return task ? task.title : 'Unknown Task';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Time Entry" : "Log Time Entry"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client *
          </label>
          {loadingClients ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
          ) : (
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.Id} value={client.Id}>
                  {client.Name} - {client.company}
                </option>
              ))}
            </select>
          )}
          {errors.clientId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clientId}</p>}
        </div>

        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project *
          </label>
          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!formData.clientId || loadingProjects}
            required
          >
            <option value="">
              {!formData.clientId ? 'Select a client first' : 'Select a project'}
            </option>
            {projects.map(project => (
              <option key={project.Id} value={project.Id}>
                {project.Name} - {project.status}
              </option>
            ))}
          </select>
          {errors.projectId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectId}</p>}
        </div>

        {/* Task Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Task *
          </label>
          <select
            name="taskId"
            value={formData.taskId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!formData.projectId || loadingTasks}
            required
          >
            <option value="">
              {!formData.projectId ? 'Select a project first' : 'Select a task'}
            </option>
            {tasks.map(task => (
              <option key={task.Id} value={task.Id}>
                {task.title} - {task.priority}
              </option>
            ))}
          </select>
          {errors.taskId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taskId}</p>}
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time *
            </label>
            <Input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="w-full"
              required
            />
            {errors.startTime && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startTime}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time *
            </label>
            <Input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full"
              required
            />
            {errors.endTime && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endTime}</p>}
          </div>
        </div>

        {/* Duration Display */}
        {formData.startTime && formData.endTime && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration:
              </span>
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {formatDuration(calculateDuration())}
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the work performed..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Summary */}
        {formData.clientId && formData.projectId && formData.taskId && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Time Entry Summary
            </h4>
            <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <p><strong>Client:</strong> {getClientName(formData.clientId)}</p>
              <p><strong>Project:</strong> {getProjectName(formData.projectId)}</p>
              <p><strong>Task:</strong> {getTaskName(formData.taskId)}</p>
              {formData.startTime && formData.endTime && (
                <p><strong>Duration:</strong> {formatDuration(calculateDuration())}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                {initialData ? "Updating..." : "Logging..."}
              </>
            ) : (
              <>
                <ApperIcon name="Save" size={16} className="mr-2" />
                {initialData ? "Update Entry" : "Log Entry"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TimeEntryModal;