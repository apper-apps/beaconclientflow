import { createContext, useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from "react-toastify";
import { setUser, clearUser } from './store/userSlice';
import Sidebar from "@/components/organisms/Sidebar";
import Header from "@/components/organisms/Header";
import Login from '@/components/pages/Login';
import Signup from '@/components/pages/Signup';
import Callback from '@/components/pages/Callback';
import ErrorPage from '@/components/pages/ErrorPage';
import ResetPassword from '@/components/pages/ResetPassword';
import PromptPassword from '@/components/pages/PromptPassword';
import Dashboard from "@/components/pages/Dashboard";
import Clients from "@/components/pages/Clients";
import ClientDetail from "@/components/pages/ClientDetail";
import Projects from "@/components/pages/Projects";
import ProjectDetail from "@/components/pages/ProjectDetail";
import Tasks from "@/components/pages/Tasks";
import TaskDetail from "@/components/pages/TaskDetail";
import TimeTracking from "@/components/pages/TimeTracking";
import Invoices from "@/components/pages/Invoices";

// Create auth context
export const AuthContext = createContext(null);

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get authentication status with proper error handling
const userState = useSelector((state) => state.user);
  const isAuthenticated = userState?.isAuthenticated || false;
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);
  
  // Initialize ApperUI once when the app loads
// Error boundary effect to catch React errors
  useEffect(() => {
    const handleError = (error, errorInfo) => {
      console.error('React Error Caught:', error);
      
      // Check if this is the specific "Objects are not valid as a React child" error
      if (error.message && error.message.includes('Objects are not valid as a React child')) {
        console.error('Lookup field rendering error detected. Check components for direct object rendering.');
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo?.componentStack
        });
        
        // Set user-friendly error state
        setHasError(true);
        setErrorInfo({
          type: 'RENDER_ERROR',
          message: 'There was an issue displaying some data. Please refresh the page.',
          details: error.message
        });
      }
    };

    // Set up global error handler
    window.addEventListener('error', (event) => {
      handleError(event.error, null);
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason, null);
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  useEffect(() => {
    const { ApperClient, ApperUI } = window.ApperSDK;
    
    const client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Initialize but don't show login yet
    ApperUI.setup(client, {
      target: '#authentication',
      clientId: import.meta.env.VITE_APPER_PROJECT_ID,
      view: 'both',
      onSuccess: function (user) {
        setIsInitialized(true);
        // Clear any previous errors on successful auth
        setHasError(false);
        setErrorInfo(null);
        
        // CRITICAL: This exact currentPath logic must be preserved in all implementations
        // DO NOT simplify or modify this pattern as it ensures proper redirection flow
        let currentPath = window.location.pathname + window.location.search;
        let redirectPath = new URLSearchParams(window.location.search).get('redirect');
        const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || 
                           currentPath.includes('/callback') || currentPath.includes('/error') || 
                           currentPath.includes('/prompt-password') || currentPath.includes('/reset-password');
        
        if (user) {
          // User is authenticated
          if (redirectPath) {
            navigate(redirectPath);
          } else if (!isAuthPage) {
            if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
              navigate(currentPath);
            } else {
              navigate('/');
            }
          } else {
            navigate('/');
          }
          // Store user information in Redux
          dispatch(setUser(JSON.parse(JSON.stringify(user))));
        } else {
          // User is not authenticated
          if (!isAuthPage) {
            navigate(
              currentPath.includes('/signup')
                ? `/signup?redirect=${currentPath}`
                : currentPath.includes('/login')
                ? `/login?redirect=${currentPath}`
                : '/login'
            );
          } else if (redirectPath) {
            if (
              !['error', 'signup', 'login', 'callback', 'prompt-password', 'reset-password'].some((path) => currentPath.includes(path))
            ) {
              navigate(`/login?redirect=${redirectPath}`);
            } else {
              navigate(currentPath);
            }
          } else if (isAuthPage) {
            navigate(currentPath);
          } else {
            navigate('/login');
          }
          dispatch(clearUser());
        }
      },
      onError: function(error) {
        console.error("Authentication failed:", error);
        setHasError(true);
        setErrorInfo({
          type: 'AUTH_ERROR',
          message: 'Authentication failed. Please try again.',
          details: error.message
        });
      }
    });
  }, []);// No props and state should be bound
  
  // Authentication methods to share via context
  const authMethods = {
    isInitialized,
    logout: async () => {
      try {
        const { ApperUI } = window.ApperSDK;
        await ApperUI.logout();
        dispatch(clearUser());
        navigate('/login');
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };
  
  // Don't render routes until initialization is complete
  if (!isInitialized) {
    return <div className="loading flex items-center justify-center p-6 h-full w-full"><svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M12 2v4"></path><path d="m16.2 7.8 2.9-2.9"></path><path d="M18 12h4"></path><path d="m16.2 16.2 2.9 2.9"></path><path d="M12 18v4"></path><path d="m4.9 19.1 2.9-2.9"></path><path d="M2 12h4"></path><path d="m4.9 4.9 2.9 2.9"></path></svg></div>;
  }

  // Render auth pages or main app based on authentication status
  if (!isAuthenticated) {
    return (
      <AuthContext.Provider value={authMethods}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/prompt-password/:appId/:emailAddress/:provider" element={<PromptPassword />} />
          <Route path="/reset-password/:appId/:fields" element={<ResetPassword />} />
          <Route path="*" element={<Login />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{ zIndex: 9999 }}
        />
      </AuthContext.Provider>
    );
  }
  
// Show error boundary if there's a critical error
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {errorInfo?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                setHasError(false);
                setErrorInfo(null);
              }}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
          {errorInfo?.details && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                {errorInfo.details}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authMethods}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
<Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/time-tracking" element={<TimeTracking />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/error" element={<ErrorPage />} />
                <Route path="/prompt-password/:appId/:emailAddress/:provider" element={<PromptPassword />} />
                <Route path="/reset-password/:appId/:fields" element={<ResetPassword />} />
              </Routes>
            </main>
          </div>
        </div>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{ zIndex: 9999 }}
        />
      </div>
    </AuthContext.Provider>
  );
}

export default App;