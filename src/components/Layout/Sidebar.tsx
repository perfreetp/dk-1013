import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  PenTool, 
  ClipboardList, 
  CheckSquare, 
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useStore } from '../../store';
import { getRoleText } from '../../utils/helpers';

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/' },
  { id: 'batches', label: '数据批次', icon: FolderOpen, path: '/batches' },
  { id: 'workbench', label: '标注工作台', icon: PenTool, path: '/workbench' },
  { id: 'tasks', label: '任务分配', icon: ClipboardList, path: '/tasks' },
  { id: 'review', label: '审核统计', icon: CheckSquare, path: '/review' },
  { id: 'members', label: '成员管理', icon: Users, path: '/members' },
];

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar = ({ currentPath, onNavigate }: SidebarProps) => {
  const { sidebarOpen, setSidebarOpen, user } = useStore();
  const [activeItem, setActiveItem] = useState(currentPath);

  const handleNavigate = (path: string) => {
    setActiveItem(path);
    onNavigate(path);
  };

  const handleLogout = () => {
    useStore.getState().setUser(null);
    onNavigate('/login');
  };

  const role = user?.role || 'annotator';
  const allowedItems = role === 'admin' 
    ? menuItems 
    : role === 'reviewer'
      ? menuItems.filter(item => ['dashboard', 'review', 'workbench'].includes(item.id))
      : menuItems.filter(item => ['dashboard', 'workbench', 'tasks'].includes(item.id));

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-primary-600 text-white transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary-700">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">道路标注平台</span>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.path;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-accent-500 text-white shadow-lg' 
                      : 'hover:bg-primary-700 text-white/80'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700">
        <div className={`flex items-center gap-3 px-3 py-2 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-lg font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-sm text-white/60">{getRoleText(role)}</p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-3 text-white/60 hover:text-white hover:bg-primary-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        )}
      </div>
    </aside>
  );
};
