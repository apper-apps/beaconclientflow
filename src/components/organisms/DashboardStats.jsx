import React from "react";
import StatCard from "@/components/molecules/StatCard";

const DashboardStats = ({ summary }) => {
  // Handle case where summary data is not yet loaded
  if (!summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Clients",
      value: summary.totalClients?.toString() || "0",
      change: summary.totalClients > 0 ? `${summary.totalClients} total` : "No clients yet",
      changeType: summary.totalClients > 0 ? "positive" : "neutral",
      icon: "Users",
      delay: 0
    },
    {
      title: "Active Projects",
      value: summary.activeProjects?.toString() || "0",
      change: summary.activeProjects > 0 ? `${summary.activeProjects} active` : "No active projects",
      changeType: summary.activeProjects > 0 ? "positive" : "neutral",
      icon: "FolderOpen",
      delay: 0.1
    },
    {
      title: "Pending Tasks",
      value: summary.pendingTasks?.toString() || "0",
      change: summary.pendingTasks > 0 ? `${summary.pendingTasks} pending` : "No pending tasks",
      changeType: summary.pendingTasks > 0 ? "neutral" : "positive",
      icon: "CheckSquare",
      delay: 0.2
    },
    {
      title: "Monthly Revenue",
      value: summary.monthlyRevenue ? `$${summary.monthlyRevenue.toLocaleString()}` : "$0",
      change: summary.monthlyRevenue > 0 ? "This month" : "No revenue yet",
      changeType: summary.monthlyRevenue > 0 ? "positive" : "neutral",
      icon: "DollarSign",
      delay: 0.3
    },
    {
      title: "Completed Tasks",
      value: summary.completedTasks?.toString() || "0",
      change: summary.completedTasks > 0 ? `${summary.completedTasks} completed` : "No completed tasks",
      changeType: summary.completedTasks > 0 ? "positive" : "neutral",
      icon: "CheckCircle2",
      delay: 0.4
    },
    {
      title: "Overdue Items",
      value: summary.overdueItems?.toString() || "0",
      change: summary.overdueItems > 0 ? `${summary.overdueItems} overdue` : "No overdue items",
      changeType: summary.overdueItems > 0 ? "negative" : "positive",
      icon: "AlertTriangle",
      delay: 0.5
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          gradient={index % 2 === 0}
          delay={stat.delay}
        />
      ))}
    </div>
  );
};

export default DashboardStats;