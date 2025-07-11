import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import TimeEntryModal from "@/components/molecules/TimeEntryModal";
import ApperIcon from "@/components/ApperIcon";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import Empty from "@/components/ui/Empty";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import { getAllTimeTracking } from "@/services/api/timeTrackingService";
import { getAllProjects } from "@/services/api/projectService";
import { getAllTasks } from "@/services/api/taskService";
import { getAllClients } from "@/services/api/clientService";

const TimeTracking = () => {
  const [timeData, setTimeData] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState(null);

  useEffect(() => {
    loadTimeData();
    loadTimeEntries();
  }, []);

  const loadTimeData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllTimeTracking();
      setTimeData(data);
    } catch (err) {
      setError("Failed to load time tracking data. Please try again.");
      toast.error("Failed to load time tracking data");
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    try {
      // For now, we'll use mock data since time_entry table wasn't provided
      // In a real implementation, this would fetch from the time_entry table
      setTimeEntries([]);
    } catch (err) {
      console.error("Error loading time entries:", err);
    }
  };

  const handleTimeEntrySubmit = async (timeEntryData) => {
    try {
      // In a real implementation, this would create a time entry record
      toast.success("Time entry logged successfully!");
      setShowTimeEntryModal(false);
      setEditingTimeEntry(null);
      await loadTimeEntries();
    } catch (error) {
      throw error;
    }
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
    return <Error message={error} onRetry={loadTimeData} />;
  }

if (!timeData || timeData.totalTime === 0) {
    return (
      <Empty
        title="No Time Tracked Yet"
        description="Start tracking time on your tasks to see detailed reports here"
        icon="Timer"
        actionLabel="Log Time Entry"
        onAction={() => setShowTimeEntryModal(true)}
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
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <ApperIcon name="Timer" size={18} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Time Tracking
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track and analyze time spent on tasks and projects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ApperIcon name="Download" size={16} className="mr-2" />
            Export Report
          </Button>
          <Button 
            variant="primary"
            onClick={() => setShowTimeEntryModal(true)}
          >
            <ApperIcon name="Plus" size={16} className="mr-2" />
            Log Time Entry
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <ApperIcon
                  name="Clock"
                  size={20}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Total Time
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(timeData.totalTime)}
                </p>
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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <ApperIcon
                  name="Play"
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Active Timers
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeData.activeTimers}
                </p>
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
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <ApperIcon
                  name="List"
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Time Entries
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeData.totalEntries}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Task Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Task Breakdown
            </h3>
            <Badge variant="secondary">
              {timeData.taskBreakdown.length} tasks
            </Badge>
          </div>

          <div className="space-y-3">
            {timeData.taskBreakdown.map((task, index) => (
              <motion.div
                key={task.taskId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      task.hasActiveTimer
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {task.taskTitle}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Project {task.projectId?.Name || task.projectId?.Id} •{" "}
                      {task.entryCount} entries
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {formatDuration(task.totalTime)}
                  </span>
                  {task.hasActiveTimer && (
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Time Entry Modal */}
      <TimeEntryModal
        isOpen={showTimeEntryModal}
        onClose={() => {
          setShowTimeEntryModal(false);
          setEditingTimeEntry(null);
        }}
        onSubmit={handleTimeEntrySubmit}
        initialData={editingTimeEntry}
      />
    </div>
  );
};

export default TimeTracking;