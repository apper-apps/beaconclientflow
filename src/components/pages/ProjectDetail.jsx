import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import KanbanBoard from "@/components/organisms/KanbanBoard";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Empty from "@/components/ui/Empty";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import Tasks from "@/components/pages/Tasks";
import ProjectModal from "@/components/molecules/ProjectModal";
import { getProjectTimeTracking } from "@/services/api/timeTrackingService";
import { deleteProject, getProjectById, updateProject } from "@/services/api/projectService";
import { getAllTasks } from "@/services/api/taskService";
import { getAllClients } from "@/services/api/clientService";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projectTimeTracking, setProjectTimeTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState("list");

  useEffect(() => {
    if (id) {
      loadProjectDetails();
    }
  }, [id]);

const loadProjectDetails = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [projectData, clientsData, tasksData, timeTrackingData] = await Promise.all([
        getProjectById(id),
        getAllClients(),
        getAllTasks(),
        getProjectTimeTracking(id)
      ]);

      setProject(projectData);
      
      // Find the client for this project
      const projectClient = clientsData.find(c => c.Id === parseInt(projectData.client_id));
      setClient(projectClient);
      
      // Filter tasks for this project - ensures real-time updates
      const projectTasks = tasksData.filter(t => t.project_id === String(projectData.Id));
      setTasks(projectTasks);
      setProjectTimeTracking(timeTrackingData);
      
    } catch (err) {
      setError("Failed to load project details. Please try again.");
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  // Real-time update handler for task changes
  const handleTaskUpdate = async () => {
    try {
      // Refresh all project-related data to ensure real-time synchronization
      const [tasksData, timeTrackingData] = await Promise.all([
        getAllTasks(),
        getProjectTimeTracking(id)
      ]);
      
      // Update tasks with latest data
      const projectTasks = tasksData.filter(t => t.project_id === String(project.Id));
      setTasks(projectTasks);
      setProjectTimeTracking(timeTrackingData);
      
    } catch (err) {
      console.error("Error updating task data:", err);
      // Silently handle errors to avoid disrupting user experience
    }
  };

  const handleEditProject = async (projectData) => {
    try {
      const updatedProject = await updateProject(id, projectData);
      setProject(updatedProject);
      toast.success("Project updated successfully");
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error("Failed to update project");
      throw err;
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeleting(true);
      await deleteProject(id);
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch (err) {
      toast.error("Failed to delete project");
      setDeleting(false);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      planning: "secondary",
      active: "primary",
      completed: "success",
      "on-hold": "warning"
    };
    return variants[status] || "default";
  };

  const getStatusIcon = (status) => {
    const icons = {
      planning: "Calendar",
      active: "Play",
      completed: "CheckCircle2",
      "on-hold": "Pause"
    };
    return icons[status] || "Circle";
  };

  const getPriorityVariant = (priority) => {
    const variants = {
      high: "error",
      medium: "warning",
      low: "success"
    };
    return variants[priority] || "default";
  };

const getTaskStatusVariant = (status) => {
    const variants = {
      todo: "secondary",
      "in-progress": "primary",
      review: "warning",
      done: "success"
    };
    return variants[status] || "default";
  };

  const calculateProgress = () => {
    if (!tasks.length) return 0;
    const completedTasks = tasks.filter(t => t.status === "done").length;
    return Math.round((completedTasks / tasks.length) * 100);
  };
const calculateTimeProgress = () => {
    if (!project?.start_date || !project?.end_date) return 0;
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const now = new Date();
    const totalDuration = end - start;
const elapsed = now - start;
    return Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

const getDaysRemaining = () => {
    if (!project?.end_date) return null;
    const end = new Date(project.end_date);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

  const formatDuration = (milliseconds) => {
    if (!milliseconds || milliseconds === 0) return "0h 0m";
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={loadProjectDetails} />;
  }

  if (!project) {
    return (
      <Empty
        title="Project Not Found"
        description="The project you're looking for doesn't exist or has been deleted."
        icon="FolderOpen"
        actionLabel="Back to Projects"
        onAction={() => navigate("/projects")}
      />
    );
  }

  const progress = calculateProgress();
  const timeProgress = calculateTimeProgress();
  const daysRemaining = getDaysRemaining();
  const actualSpend = Math.round(project.budget * 0.7); // Mock actual spending

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/projects")}
              className="p-2"
            >
              <ApperIcon name="ArrowLeft" size={16} />
            </Button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <ApperIcon name="FolderOpen" size={18} className="text-white" />
            </div>
            <div>
<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {project.Name}
</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {client?.Name || `Client ID: ${project.client_id}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={getStatusVariant(project.status)} className="flex items-center gap-1">
              <ApperIcon name={getStatusIcon(project.status)} size={12} />
              {project.status}
            </Badge>
            {daysRemaining !== null && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 
                 daysRemaining === 0 ? 'Due today' : 
                 `${Math.abs(daysRemaining)} days overdue`}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            <ApperIcon name="Edit2" size={16} className="mr-2" />
            Edit Project
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <ApperIcon name="Trash2" size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </motion.div>

{/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <ApperIcon name="DollarSign" size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Budget</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(project.budget)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Spent</span>
                <span className="font-medium">{formatCurrency(actualSpend)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((actualSpend / project.budget) * 100, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(project.budget - actualSpend)} remaining
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <ApperIcon name="CheckCircle2" size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Progress</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {progress}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tasks</span>
                <span className="font-medium">
                  {tasks.filter(t => t.status === "done").length} of {tasks.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <ApperIcon name="Clock" size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Timeline</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeProgress}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Time elapsed</span>
                <span className="font-medium">{timeProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <ApperIcon name="ListTodo" size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Tasks</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.length}
                </p>
              </div>
            </div>
<div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">To Do</span>
                <span className="font-medium">{tasks.filter(t => t.status === "todo").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                <span className="font-medium">{tasks.filter(t => t.status === "in-progress").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Review</span>
                <span className="font-medium">{tasks.filter(t => t.status === "review").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Done</span>
                <span className="font-medium">{tasks.filter(t => t.status === "done").length}</span>
              </div>
            </div>
          </Card>
</motion.div>

        {/* Time Tracking Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <ApperIcon name="Timer" size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Time Tracked</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(projectTimeTracking?.totalTime || 0)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Active Timers</span>
                <span className="font-medium">{projectTimeTracking?.activeTimers || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Time Entries</span>
                <span className="font-medium">{projectTimeTracking?.totalEntries || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Avg per Task</span>
                <span className="font-medium">
                  {tasks.length > 0 ? formatDuration((projectTimeTracking?.totalTime || 0) / tasks.length) : "0m"}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Project Details and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Project Information
            </h3>
            <div className="space-y-4">
              {project.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-white">{project.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(project.start_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(project.end_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client
</label>
                  <p className="text-gray-900 dark:text-white">
                    {client?.Name || `Client ID: ${project.client_id}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <Badge variant={getStatusVariant(project.status)} className="flex items-center gap-1 w-fit">
                    <ApperIcon name={getStatusIcon(project.status)} size={12} />
                    {project.status}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Timeline Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
<div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Project Started</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDate(project.start_date)}
                  </p>
                </div>
              </div>
              
              <div className="ml-1.5 border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2">
                <div className="space-y-3">
                  {tasks.filter(t => t.status === "done").slice(0, 3).map((task, index) => (
                    <div key={task.Id} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-gray-900 dark:text-white">{task.title}</p>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === "done").length > 3 && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                      +{tasks.filter(t => t.status === "done").length - 3} more completed
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  project.status === "completed" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                }`}></div>
<div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Project End</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDate(project.end_date)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Tasks Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="p-6">
<div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tasks ({tasks.length})
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={taskViewMode === "list" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setTaskViewMode("list")}
                  className="px-3 py-1.5"
                >
                  <ApperIcon name="List" size={12} className="mr-1" />
                  List
                </Button>
                <Button
                  variant={taskViewMode === "kanban" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setTaskViewMode("kanban")}
                  className="px-3 py-1.5"
                >
                  <ApperIcon name="Columns" size={12} className="mr-1" />
                  Kanban
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tasks")}
              >
                <ApperIcon name="ExternalLink" size={14} className="mr-2" />
                View All Tasks
              </Button>
            </div>
          </div>
          
{tasks.length === 0 ? (
            <Empty
              title="No Tasks"
              description="No tasks have been created for this project yet."
              icon="ListTodo"
            />
) : taskViewMode === "kanban" ? (
            <div className="mt-4">
              <KanbanBoard tasks={tasks} projectId={parseInt(id)} onTaskUpdate={handleTaskUpdate} />
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task, index) => (
                <motion.div
                  key={task.Id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === "done" ? "bg-green-500" :
                      task.status === "in-progress" ? "bg-blue-500" : 
                      task.status === "review" ? "bg-yellow-500" : "bg-gray-400"
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
<p className="text-xs text-gray-600 dark:text-gray-400">
                        Due: {formatDate(task.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityVariant(task.priority)} size="sm">
                      {task.priority}
                    </Badge>
                    <Badge variant={getTaskStatusVariant(task.status)} size="sm">
                      {task.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
              {tasks.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/tasks")}
                  >
                    View {tasks.length - 5} more tasks
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Edit Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditProject}
        project={project}
        title="Edit Project"
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <ApperIcon name="AlertTriangle" size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Project
              </h3>
</div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{project.Name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="error"
                onClick={handleDeleteProject}
                loading={deleting}
                disabled={deleting}
              >
                Delete Project
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;