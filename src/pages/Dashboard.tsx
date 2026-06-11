import { 
  FolderOpen, 
  Image, 
  ClipboardList, 
  CheckSquare, 
  TrendingUp,
  Users
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { StatCard } from '../components/Common/StatCard';
import { useStore } from '../store';
import { getStatusText, getStatusColor } from '../utils/helpers';

interface DashboardProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const Dashboard = ({ onNavigate, currentPath }: DashboardProps) => {
  const { batches, tasks, annotations, users, user } = useStore();
  
  const totalBatches = batches.length;
  const totalImages = batches.reduce((sum, b) => sum + b.imageCount, 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const reviewingTasks = tasks.filter(t => t.status === 'reviewing').length;
  const totalAnnotations = annotations.length;
  const totalUsers = users.length;
  
  const userTasks = user 
    ? tasks.filter(t => t.assigneeId === user.id) 
    : [];
  const userCompleted = userTasks.filter(t => t.status === 'completed').length;
  const userProgress = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;

  return (
    <Layout 
      title="仪表盘" 
      subtitle="数据概览与工作进度"
      onNavigate={onNavigate}
      currentPath={currentPath}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard 
          title="数据批次" 
          value={totalBatches} 
          icon={FolderOpen} 
          color="blue"
        />
        <StatCard 
          title="图片总数" 
          value={totalImages} 
          icon={Image} 
          color="purple"
        />
        <StatCard 
          title="任务总数" 
          value={totalTasks} 
          icon={ClipboardList} 
          color="orange"
        />
        <StatCard 
          title="已完成任务" 
          value={completedTasks} 
          icon={CheckSquare} 
          color="green"
          trend={{ value: 25, isUp: true }}
        />
        <StatCard 
          title="标注总数" 
          value={totalAnnotations} 
          icon={TrendingUp} 
          color="cyan"
        />
        <StatCard 
          title="团队成员" 
          value={totalUsers} 
          icon={Users} 
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">任务状态分布</h2>
          <div className="space-y-3">
            {[
              { status: 'pending', label: '待开始', count: pendingTasks, color: 'bg-gray-500' },
              { status: 'in_progress', label: '进行中', count: inProgressTasks, color: 'bg-blue-500' },
              { status: 'reviewing', label: '审核中', count: reviewingTasks, color: 'bg-yellow-500' },
              { status: 'completed', label: '已完成', count: completedTasks, color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600">{item.label}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${totalTasks > 0 ? (item.count / totalTasks) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-gray-700 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">我的工作进度</h2>
          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#1e3a5f"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${userProgress * 2.51} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute text-2xl font-bold text-gray-800">{userProgress}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">已完成 {userCompleted}/{userTasks.length} 个任务</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">待处理</span>
              <span className="font-medium text-gray-700">{pendingTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">进行中</span>
              <span className="font-medium text-gray-700">{inProgressTasks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">已审核</span>
              <span className="font-medium text-gray-700">{completedTasks}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">最近任务</h2>
            <button 
              onClick={() => onNavigate('/tasks')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => {
              const batch = batches.find(b => b.id === task.batchId);
              const assignee = users.find(u => u.id === task.assigneeId);
              return (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onNavigate('/tasks')}
                >
                  <div>
                    <p className="font-medium text-gray-800">{batch?.name}</p>
                    <p className="text-sm text-gray-500">{assignee?.name}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">最近批次</h2>
            <button 
              onClick={() => onNavigate('/batches')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {batches.slice(0, 5).map((batch) => (
              <div 
                key={batch.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => onNavigate('/batches')}
              >
                <div>
                  <p className="font-medium text-gray-800">{batch.name}</p>
                  <p className="text-sm text-gray-500">{batch.imageCount} 张图片</p>
                </div>
                <span className="text-sm text-gray-400">{batch.collectionDate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
