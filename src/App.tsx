import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BatchList } from './pages/BatchList';
import { TaskList } from './pages/TaskList';
import { AnnotationWorkbench } from './pages/AnnotationWorkbench';
import { ReviewList } from './pages/ReviewList';
import { MemberList } from './pages/MemberList';
import { useStore } from './store';

function App() {
  const { user, setUser } = useStore();
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  };

  if (!user) {
    return <Login onNavigate={handleNavigate} />;
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <Dashboard onNavigate={handleNavigate} currentPath={currentPath} />;
      case '/batches':
        return <BatchList onNavigate={handleNavigate} currentPath={currentPath} />;
      case '/tasks':
        return <TaskList onNavigate={handleNavigate} currentPath={currentPath} />;
      case '/workbench':
        return <AnnotationWorkbench onNavigate={handleNavigate} currentPath={currentPath} />;
      case '/review':
        return <ReviewList onNavigate={handleNavigate} currentPath={currentPath} />;
      case '/members':
        return <MemberList onNavigate={handleNavigate} currentPath={currentPath} />;
      default:
        return <Dashboard onNavigate={handleNavigate} currentPath="/" />;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderPage()}</div>;
}

export default App;
