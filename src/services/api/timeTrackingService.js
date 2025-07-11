import { startTaskTimer, stopTaskTimer, getTaskTimeLogs } from "@/services/api/taskService";
import { getAllTasks } from "@/services/api/taskService";

export const startTimer = async (taskId) => {
  try {
    const timerData = await startTaskTimer(taskId);
    return timerData;
  } catch (error) {
    throw new Error(`Failed to start timer: ${error.message}`);
  }
};

export const stopTimer = async (taskId) => {
  try {
    const timeLog = await stopTaskTimer(taskId);
    return timeLog;
  } catch (error) {
    throw new Error(`Failed to stop timer: ${error.message}`);
  }
};

export const getActiveTimer = async (taskId) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const tasks = await getAllTasks();
  const task = tasks.find(t => t.Id === parseInt(taskId));
  
  if (!task) {
    throw new Error("Task not found");
  }

  return task.timeTracking?.activeTimer || null;
};

export const getTimeLogs = async (taskId) => {
  try {
    const timeLogs = await getTaskTimeLogs(taskId);
    return timeLogs;
  } catch (error) {
    throw new Error(`Failed to get time logs: ${error.message}`);
  }
};

export const getProjectTimeTracking = async (projectId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
const tasks = await getAllTasks();
    const projectTasks = tasks.filter(t => t.project_id === String(projectId));
    
    let totalTime = 0;
    let activeTimers = 0;
    let totalEntries = 0;
    const timeLogs = [];

projectTasks.forEach(task => {
      totalTime += task.total_time || 0;
      
      if (task.active_timer) {
        activeTimers++;
      }
      
      if (task.time_tracking) {
        try {
          const timeTrackingData = JSON.parse(task.time_tracking);
          if (timeTrackingData.timeLogs) {
            totalEntries += timeTrackingData.timeLogs.length;
            timeLogs.push(...timeTrackingData.timeLogs.map(log => ({
              ...log,
              taskId: task.Id,
              taskTitle: task.title
            })));
          }
        } catch (e) {
          // Handle invalid JSON
        }
      }
    });

    // Sort time logs by date (newest first)
    timeLogs.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

    return {
      totalTime,
      activeTimers,
      totalEntries,
      timeLogs: timeLogs.slice(0, 10) // Return last 10 entries
    };
  } catch (error) {
    throw new Error(`Failed to get project time tracking: ${error.message}`);
  }
};

export const getAllTimeTracking = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    const tasks = await getAllTasks();
    
    const summary = {
      totalTime: 0,
      activeTimers: 0,
      totalEntries: 0,
      taskBreakdown: []
    };

tasks.forEach(task => {
      summary.totalTime += task.total_time || 0;
      
      if (task.active_timer) {
        summary.activeTimers++;
      }
      
      if (task.time_tracking) {
        try {
          const timeTrackingData = JSON.parse(task.time_tracking);
          if (timeTrackingData.timeLogs) {
            summary.totalEntries += timeTrackingData.timeLogs.length;
          }
        } catch (e) {
          // Handle invalid JSON
        }
      }

      if ((task.total_time && task.total_time > 0) || task.active_timer) {
        summary.taskBreakdown.push({
          taskId: task.Id,
          taskTitle: task.title,
          projectId: task.project_id,
          totalTime: task.total_time || 0,
          hasActiveTimer: !!task.active_timer,
          entryCount: 0 // Will be calculated from time_tracking field
        });
      }
    });

    // Sort by total time descending
    summary.taskBreakdown.sort((a, b) => b.totalTime - a.totalTime);

    return summary;
  } catch (error) {
    throw new Error(`Failed to get all time tracking data: ${error.message}`);
  }
};