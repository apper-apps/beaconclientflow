import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Modal from '@/components/atoms/Modal';
import Empty from '@/components/ui/Empty';
import Error from '@/components/ui/Error';
import Loading from '@/components/ui/Loading';
import { getTaskById, updateTask } from '@/services/api/taskService';
import { getAllProjects } from '@/services/api/projectService';
import { startTimer, stopTimer } from '@/services/api/timeTrackingService';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    priority: "",
    status: "",
    due_date: "",
    project_id: ""
  });
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const loadTaskData = async () => {
    try {
      setLoading(true);
      setError("");
      const taskData = await getTaskById(id);
      setTask(taskData);
      
      // Set up edit form data
      setEditFormData({
        title: taskData.title || "",
        priority: taskData.priority || "",
        status: taskData.status || "",
        due_date: taskData.due_date || "",
        project_id: taskData.project_id || ""
      });
      
      // Check for active timer
      if (taskData.active_timer) {
        setActiveTimer({ 
          Id: taskData.Id, 
          startTime: taskData.active_timer 
        });
      }
    } catch (err) {
      setError("Failed to load task details. Please try again.");
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      const projectData = await getAllProjects();
      const activeProjects = projectData.filter(project => project.status === 'active');
      setProjects(activeProjects);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadTaskData();
      loadProjects();
    }
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartTimer = async (taskId) => {
    try {
      const timerData = await startTimer(taskId);
      setActiveTimer(timerData);
      await loadTaskData();
      toast.success("Timer started");
    } catch (error) {
      toast.error("Failed to start timer");
    }
  };

  const handleStopTimer = async (taskId) => {
    try {
      await stopTimer(taskId);
      setActiveTimer(null);
      await loadTaskData();
      toast.success("Timer stopped");
    } catch (error) {
      toast.error("Failed to stop timer");
    }
  };

  const formatDuration = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = () => {
    if (!activeTimer) return 0;
    return currentTime - new Date(activeTimer.startTime).getTime();
  };

  const handleBackToTasks = () => {
    navigate('/tasks');
  };

  const handleUpdateTask = async () => {
    if (!editFormData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!editFormData.due_date) {
      toast.error("Please select a due date");
      return;
    }

    if (!editFormData.project_id) {
      toast.error("Please select a project");
      return;
    }

    try {
      setIsUpdating(true);
      await updateTask(id, {
        title: editFormData.title.trim(),
        priority: editFormData.priority,
        status: editFormData.status,
        dueDate: editFormData.due_date,
        projectId: parseInt(editFormData.project_id)
      });
      
      await loadTaskData();
      setIsEditing(false);
      toast.success("Task updated successfully!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityVariant = (priority) => {
    const variants = {
      low: "secondary",
      medium: "warning",
      high: "error"
    };
    return variants[priority] || "default";
  };

  const getStatusVariant = (status) => {
    const variants = {
      todo: "secondary",
      "in-progress": "primary",
      review: "warning",
      done: "success"
    };
    return variants[status] || "default";
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: "ArrowDown",
      medium: "ArrowRight",
      high: "ArrowUp"
    };
    return icons[priority] || "Circle";
  };

  const getStatusIcon = (status) => {
    const icons = {
      todo: "Circle",
      "in-progress": "Clock",
      review: "Eye",
      done: "CheckCircle2"
    };
    return icons[status] || "Circle";
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={loadTaskData} />;
  }

  if (!task) {
    return (
      <Empty
        title="Task Not Found"
        description="The task you're looking for doesn't exist or has been deleted."
        icon="AlertCircle"
        actionLabel="Back to Tasks"
        onAction={handleBackToTasks}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToTasks}
            className="flex items-center gap-2"
          >
            <ApperIcon name="ArrowLeft" size={16} />
            Back to Tasks
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <ApperIcon name="CheckSquare" size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Task Details
            </h1>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2"
        >
          <ApperIcon name="Edit2" size={16} />
          Edit Task
        </Button>
      </motion.div>

      {/* Task Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="space-y-6">
            {/* Title and Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {task.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Project: {task.project_id?.Name || task.project_id || 'Unknown'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getPriorityVariant(task.priority)}
                  className="flex items-center gap-1"
                >
                  <ApperIcon name={getPriorityIcon(task.priority)} size={14} />
                  {task.priority}
                </Badge>
                <Badge 
                  variant={getStatusVariant(task.status)}
                  className="flex items-center gap-1"
                >
                  <ApperIcon name={getStatusIcon(task.status)} size={14} />
                  {task.status ? task.status.replace("-", " ") : "unknown"}
                </Badge>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2">
              <ApperIcon name="Calendar" size={16} className="text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Due: {formatDate(task.due_date)}
              </span>
              {isOverdue(task.due_date) && task.status !== "done" && (
                <Badge variant="error" size="sm">
                  Overdue
                </Badge>
              )}
            </div>

            {/* Time Tracking */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Time Tracking
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {activeTimer && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-mono text-lg font-semibold">
                        {formatDuration(getElapsedTime())}
                      </span>
                      <span className="text-sm">Active</span>
                    </div>
                  )}
                  {task.total_time > 0 && !activeTimer && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <ApperIcon name="Clock" size={16} />
                      <span className="font-mono text-lg">
                        {formatDuration(task.total_time)}
                      </span>
                      <span className="text-sm">Total</span>
                    </div>
                  )}
                  {!activeTimer && (!task.total_time || task.total_time === 0) && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <ApperIcon name="Clock" size={16} />
                      <span className="text-sm">No time tracked yet</span>
                    </div>
                  )}
                </div>
                <Button
                  variant={activeTimer ? "error" : "primary"}
                  onClick={() => {
                    if (activeTimer) {
                      handleStopTimer(task.Id);
                    } else {
                      handleStartTimer(task.Id);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <ApperIcon 
                    name={activeTimer ? "Square" : "Play"} 
                    size={16} 
                  />
                  {activeTimer ? "Stop Timer" : "Start Timer"}
                </Button>
              </div>
            </div>

            {/* Tags */}
            {task.Tags && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.Tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Task"
        maxWidth="md"
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateTask();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Title *
            </label>
            <Input
              id="title"
              type="text"
              value={editFormData.title}
              onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={editFormData.priority}
                onChange={(e) => setEditFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                value={editFormData.status}
                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date *
              </label>
              <Input
                id="due_date"
                type="date"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData(prev => ({ ...prev, due_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project *
              </label>
              <select
                id="project_id"
                value={editFormData.project_id}
                onChange={(e) => setEditFormData(prev => ({ ...prev, project_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select a project</option>
                {projectsLoading ? (
                  <option disabled>Loading projects...</option>
                ) : projects.length === 0 ? (
                  <option disabled>No active projects available</option>
                ) : (
                  projects.map(project => (
                    <option key={project.Id} value={project.Id}>
                      {project.Name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <ApperIcon name="Save" size={16} className="mr-2" />
                  Update Task
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskDetail;