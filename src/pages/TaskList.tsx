import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { mockTasks, mockBatches, mockUsers } from '../data/mockData';
import { getStatusText, getStatusColor, formatDate } from '../utils/helpers';
import { useStore } from '../store';

interface TaskListProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const TaskList = ({ onNavigate, currentPath }: TaskListProps) => {
  const { user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    batchId: '',
    assigneeId: '',
    deadline: '',
  });

  const annotators = mockUsers.filter(u => u.role === 'annotator');

  const filteredTasks = mockTasks.filter(task => {
    const batch = mockBatches.find(b => b.id === task.batchId);
    const assignee = mockUsers.find(u => u.id === task.assigneeId);
    const matchesSearch = batch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignee?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    const matchesAssignee = !selectedAssignee || task.assigneeId === selectedAssignee;
    
    if (user?.role === 'annotator') {
      return matchesSearch && matchesStatus && task.assigneeId === user.id;
    }
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const handleCreate = () => {
    setShowCreateModal(false);
    setFormData({ batchId: '', assigneeId: '', deadline: '' });
  };

  const getTask = (id: string | null) => {
    if (!id) return null;
    const task = mockTasks.find(t => t.id === id);
    if (!task) return null;
    return {
      ...task,
      batch: mockBatches.find(b => b.id === task.batchId),
      assignee: mockUsers.find(u => u.id === task.assigneeId),
    };
  };

  const statusOptions = [
    { value: 'pending', label: '待开始' },
    { value: 'in_progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'reviewing', label: '审核中' },
  ];

  return (
    <Layout 
      title="任务分配" 
      subtitle="管理标注任务的分配与状态"
      onNavigate={onNavigate}
      currentPath={currentPath}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索任务..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'border-primary-600 text-primary-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            创建任务
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">状态:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部状态</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {user?.role !== 'annotator' && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">全部标注员</option>
                  {annotators.map(annotator => (
                    <option key={annotator.id} value={annotator.id}>{annotator.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button 
              variant="secondary" 
              onClick={() => {
                setSelectedStatus('');
                setSelectedAssignee('');
              }}
            >
              重置筛选
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">路段</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标注员</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">截止日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTasks.map((task) => {
              const batch = mockBatches.find(b => b.id === task.batchId);
              const assignee = mockUsers.find(u => u.id === task.assigneeId);
              return (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{batch?.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{batch?.section}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
                        {assignee?.name?.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600">{assignee?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(task.deadline)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedTask(task.id);
                          setShowDetailModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">没有找到匹配的任务</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建标注任务"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择数据批次 *</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择批次</option>
              {mockBatches.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分配给 *</label>
            <select
              value={formData.assigneeId}
              onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择标注员</option>
              {annotators.map(annotator => (
                <option key={annotator.id} value={annotator.id}>{annotator.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>
              创建任务
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTask(null);
        }}
        title="任务详情"
        size="lg"
      >
        {getTask(selectedTask) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{getTask(selectedTask)?.batch?.name}</h3>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(getTask(selectedTask)?.status || '')}`}>
                {getStatusText(getTask(selectedTask)?.status || '')}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">路段</span>
                <span className="font-medium text-gray-800">{getTask(selectedTask)?.batch?.section}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">图片数量</span>
                <span className="font-medium text-gray-800">{getTask(selectedTask)?.batch?.imageCount} 张</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">标注员</span>
                <span className="font-medium text-gray-800">{getTask(selectedTask)?.assignee?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">截止日期</span>
                <span className="font-medium text-gray-800">{formatDate(getTask(selectedTask)?.deadline || '')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">创建时间</span>
                <span className="font-medium text-gray-800">{formatDate(getTask(selectedTask)?.createdAt || '')}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => {
                setShowDetailModal(false);
                setSelectedTask(null);
              }}>
                关闭
              </Button>
              {user?.role !== 'annotator' && (
                <Button onClick={() => onNavigate('/workbench')}>
                  查看详情
                </Button>
              )}
              {user?.role === 'annotator' && getTask(selectedTask)?.status === 'pending' && (
                <Button onClick={() => onNavigate('/workbench')}>
                  开始标注
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};
