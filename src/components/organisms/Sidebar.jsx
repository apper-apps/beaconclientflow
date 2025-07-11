import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import NavigationItem from "@/components/molecules/NavigationItem";
import ApperIcon from "@/components/ApperIcon";
import { useSidebar } from "@/hooks/useSidebar";

const Sidebar = () => {
  const { isOpen, closeSidebar } = useSidebar();
  const { metrics } = useSelector((state) => state.dashboard);

  const navigationItems = [
    { to: "/", icon: "LayoutDashboard", label: "Dashboard" },
    { to: "/clients", icon: "Users", label: "Clients", badge: metrics.clientCount > 0 ? metrics.clientCount.toString() : "0" },
    { to: "/projects", icon: "FolderOpen", label: "Projects", badge: metrics.projectCount > 0 ? metrics.projectCount.toString() : "0" },
    { to: "/tasks", icon: "CheckSquare", label: "Tasks", badge: metrics.taskCount > 0 ? metrics.taskCount.toString() : "0" },
    { to: "/time-tracking", icon: "Timer", label: "Time Tracking", badge: metrics.timeTrackingCount > 0 ? metrics.timeTrackingCount.toString() : "0" },
    { to: "/invoices", icon: "FileText", label: "Invoices", badge: metrics.invoiceCount > 0 ? metrics.invoiceCount.toString() : "0" }
  ];

  // Desktop Sidebar - Static positioning
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:dark:bg-gray-900 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
              <ApperIcon name="Briefcase" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                ClientFlow Pro
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Project Tracker</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => (
            <NavigationItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
              <ApperIcon name="User" size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                John Doe
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Freelancer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Sidebar - Overlay with transform
  const MobileSidebar = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={closeSidebar}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                      <ApperIcon name="Briefcase" size={20} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        ClientFlow Pro
                      </h1>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Project Tracker</p>
                    </div>
                  </div>
                  <button
                    onClick={closeSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ApperIcon name="X" size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.to} onClick={closeSidebar}>
                    <NavigationItem {...item} />
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
                    <ApperIcon name="User" size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      John Doe
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Freelancer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;