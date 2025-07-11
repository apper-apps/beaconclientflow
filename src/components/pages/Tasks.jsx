import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import KanbanBoard from "@/components/organisms/KanbanBoard";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import Empty from "@/components/ui/Empty";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import SearchBar from "@/components/molecules/SearchBar";
import { startTimer, stopTimer } from "@/services/api/timeTrackingService";
import { createTask, getAllTasks } from "@/services/api/taskService";

const Tasks = () => {
const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [activeTimers, setActiveTimers] = useState(new Map());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    projectId: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const taskData = await getAllTasks();
      setTasks(taskData);
    } catch (err) {
      setError("Failed to load tasks. Please try again.");
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
};

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadActiveTimers = async () => {
      const timers = new Map();
      for (const task of tasks) {
        if (task.timeTracking?.activeTimer) {
          timers.set(task.Id, task.timeTracking.activeTimer);
        }
      }
      setActiveTimers(timers);
    };

    loadActiveTimers();
  }, [tasks]);

  const handleStartTimer = async (taskId) => {
    try {
      const timerData = await startTimer(taskId);
      setActiveTimers(prev => new Map(prev).set(taskId, timerData));
      await loadTasks();
      toast.success("Timer started");
    } catch (error) {
      toast.error("Failed to start timer");
    }
  };

  const handleStopTimer = async (taskId) => {
    try {
      await stopTimer(taskId);
      setActiveTimers(prev => {
        const newTimers = new Map(prev);
        newTimers.delete(taskId);
        return newTimers;
      });
      await loadTasks();
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

  const getElapsedTime = (taskId) => {
    const timer = activeTimers.get(taskId);
    if (!timer) return 0;
    return currentTime - new Date(timer.startTime).getTime();
  };

const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityVariant = (priority) => {
    const variants = {
      low: "secondary",
      medium: "warning",
      high: "danger"
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

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={loadTasks} />;
  }

  if (tasks.length === 0) {
    return (
      <Empty
        title="No Tasks Yet"
        description="Create your first task to start tracking your work"
        icon="CheckSquare"
        actionLabel="Add Task"
        onAction={() => toast.info("Add task functionality coming soon!")}
      />
    );
  }

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
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <ApperIcon name="CheckSquare" size={18} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Tasks
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Organize and track your project tasks
          </p>
        </div>
<div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3 py-1.5"
            >
              <ApperIcon name="List" size={14} className="mr-1" />
              List
            </Button>
<Button
              variant={viewMode === "kanban" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="px-3 py-1.5"
            >
              <ApperIcon name="Columns" size={14} className="mr-1" />
              Kanban
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="primary"
              onClick={() => setShowTaskModal(true)}
            >
              <ApperIcon name="Plus" size={16} className="mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <SearchBar
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        
        <div className="flex gap-2">
<select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          
          <Button variant="outline" size="sm">
            <ApperIcon name="Download" size={16} className="mr-2" />
            Export
          </Button>
</div>
      </motion.div>

      {/* Results Count */}
      {viewMode === "list" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          Showing {filteredTasks.length} of {tasks.length} tasks
        </motion.div>
      )}

      {/* Content */}
      {viewMode === "kanban" ? (
        <KanbanBoard tasks={filteredTasks} onTaskUpdate={loadTasks} />
      ) : (
        <>
          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.Id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card hover className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <button className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors duration-200">
                        {task.status === "done" && (
                          <ApperIcon name="Check" size={14} className="text-primary-500" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-gray-900 dark:text-white mb-1 ${
                            task.status === "done" ? "line-through opacity-60" : ""
                          }`}>
                            {task.title}
</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Project: {task.project_id?.Name || task.project_id || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getPriorityVariant(task.priority)} 
                            className="flex items-center gap-1"
                          >
                            <ApperIcon name={getPriorityIcon(task.priority)} size={12} />
                            {task.priority}
                          </Badge>
                          
<Badge 
                            variant={getStatusVariant(task.status)}
                            className="flex items-center gap-1"
                          >
                            <ApperIcon name={getStatusIcon(task.status)} size={12} />
                            {task.status ? task.status.replace("-", " ") : "unknown"}
                          </Badge>
                        </div>
</div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
<ApperIcon name="Calendar" size={14} />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
{new Date(task.due_date) < new Date() && task.status !== "done" && (
                            <Badge variant="danger" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
<div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toast.info("Task editing is available through the Project detail page.")}
                          >
                            <ApperIcon name="Edit2" size={14} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ApperIcon name="MoreHorizontal" size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Time Tracking Section */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          {activeTimers.has(task.Id) && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="font-mono">
                                {formatDuration(getElapsedTime(task.Id))}
                              </span>
                            </div>
                          )}
                          {task.timeTracking?.totalTime > 0 && !activeTimers.has(task.Id) && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <ApperIcon name="Clock" size={14} />
                              <span className="font-mono">
                                {formatDuration(task.timeTracking.totalTime)}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant={activeTimers.has(task.Id) ? "error" : "primary"}
                          size="sm"
                          onClick={() => {
                            if (activeTimers.has(task.Id)) {
                              handleStopTimer(task.Id);
                            } else {
                              handleStartTimer(task.Id);
                            }
                          }}
                          className="flex items-center gap-1"
                        >
                          <ApperIcon 
                            name={activeTimers.has(task.Id) ? "Square" : "Play"} 
                            size={14} 
                          />
                          {activeTimers.has(task.Id) ? "Stop" : "Start"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {filteredTasks.length === 0 && (searchTerm || priorityFilter !== "all" || statusFilter !== "all") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Empty
                title="No Tasks Found"
                description={`No tasks match your current filters. Try adjusting your search criteria.`}
                icon="Search"
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchTerm("");
                  setPriorityFilter("all");
                  setStatusFilter("all");
                }}
              />
            </motion.div>
)}
</>
      )}

      {/* Task Creation Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setTaskFormData({
            title: "",
            description: "",
            priority: "medium",
            status: "todo",
            dueDate: "",
            projectId: ""
          });
        }}
        title="Create New Task"
        maxWidth="md"
      >
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            
            if (!taskFormData.title.trim()) {
              toast.error("Please enter a task title");
              return;
            }
            
            if (!taskFormData.dueDate) {
              toast.error("Please select a due date");
              return;
            }
            
            try {
              setIsCreating(true);
              const newTask = await createTask({
title: taskFormData.title.trim(),
                description: taskFormData.description.trim(),
                dueDate: taskFormData.dueDate,
                projectId: taskFormData.projectId,
});
              
              setTasks(prev => [...prev, newTask]);
              setShowTaskModal(false);
              setTaskFormData({
                title: "",
                description: "",
                priority: "medium",
                status: "todo",
                dueDate: "",
                projectId: ""
              });
              
              toast.success("Task created successfully!");
            } catch (error) {
              console.error("Error creating task:", error);
              toast.error("Failed to create task. Please try again.");
            } finally {
              setIsCreating(false);
            }
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
              value={taskFormData.title}
              onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={taskFormData.description}
              onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value }))}
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
                value={taskFormData.status}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, status: e.target.value }))}
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
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date *
              </label>
              <Input
                id="dueDate"
                type="date"
                value={taskFormData.dueDate}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project ID
              </label>
              <Input
                id="projectId"
                type="text"
                value={taskFormData.projectId}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, projectId: e.target.value }))}
                placeholder="Enter project ID"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTaskModal(false);
                setTaskFormData({
                  title: "",
                  description: "",
                  priority: "medium",
                  status: "todo",
                  dueDate: "",
                  projectId: ""
                });
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ApperIcon name="Plus" size={16} className="mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;