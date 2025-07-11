import React from "react";
import { useSelector } from "react-redux";
import StatCard from "@/components/molecules/StatCard";

const DashboardStats = ({ summary }) => {
  const { metrics, loading } = useSelector((state) => state.dashboard);
  
  // Handle case where data is not yet loaded
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Clients",
      value: metrics.clientCount?.toString() || "0",
      change: metrics.clientCount > 0 ? `${metrics.clientCount} total` : "No clients yet",
      changeType: metrics.clientCount > 0 ? "positive" : "neutral",
      icon: "Users",
      delay: 0
    },
    {
      title: "Projects",
      value: metrics.projectCount?.toString() || "0",
      change: metrics.projectCount > 0 ? `${metrics.projectCount} total` : "No projects yet",
      changeType: metrics.projectCount > 0 ? "positive" : "neutral",
      icon: "FolderOpen",
      delay: 0.1
    },
    {
      title: "Tasks",
      value: metrics.taskCount?.toString() || "0",
      change: metrics.taskCount > 0 ? `${metrics.taskCount} total` : "No tasks yet",
      changeType: metrics.taskCount > 0 ? "positive" : "neutral",
      icon: "CheckSquare",
      delay: 0.2
    },
    {
      title: "Time Tracking",
      value: metrics.timeTrackingCount?.toString() || "0",
      change: metrics.timeTrackingCount > 0 ? `${metrics.timeTrackingCount} tracked` : "No time tracked",
      changeType: metrics.timeTrackingCount > 0 ? "positive" : "neutral",
      icon: "Clock",
      delay: 0.3
    },
    {
      title: "Invoices",
      value: metrics.invoiceCount?.toString() || "0",
      change: metrics.invoiceCount > 0 ? `${metrics.invoiceCount} total` : "No invoices yet",
      changeType: metrics.invoiceCount > 0 ? "positive" : "neutral",
      icon: "FileText",
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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