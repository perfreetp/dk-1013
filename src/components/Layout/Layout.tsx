import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const Layout = ({ children, title, subtitle, onNavigate, currentPath }: LayoutProps) => {
  const { sidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      <div 
        className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
