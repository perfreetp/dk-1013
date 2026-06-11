import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Mail,
  User
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { useStore } from '../store';
import { getRoleText, getRoleColor, formatDate } from '../utils/helpers';

interface MemberListProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const MemberList = ({ onNavigate, currentPath }: MemberListProps) => {
  const { users, tasks, annotations, addUser, updateUser, deleteUser, user, setUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'annotator' as 'admin' | 'annotator' | 'reviewer',
  });

  const filteredUsers = users.filter(userItem => 
    userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userItem.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assigneeId === userId);
    const userAnnotations = annotations.filter(a => {
      const task = tasks.find(t => t.id === a.taskId);
      return task?.assigneeId === userId;
    });
    return {
      totalTasks: userTasks.length,
      completedTasks: userTasks.filter(t => t.status === 'completed').length,
      totalAnnotations: userAnnotations.length,
    };
  };

  const handleCreate = () => {
    addUser({
      name: formData.name,
      email: formData.email,
      role: formData.role,
    });
    setShowCreateModal(false);
    setFormData({ name: '', email: '', role: 'annotator' });
  };

  const handleEdit = () => {
    if (selectedUser) {
      updateUser(selectedUser, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
      
      if (selectedUser === user?.id && formData.role !== user.role) {
        setUser({ ...user, role: formData.role });
      }
    }
    setShowEditModal(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '', role: 'annotator' });
  };

  const handleDelete = () => {
    if (selectedUser && selectedUser !== user?.id) {
      deleteUser(selectedUser);
    }
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const getSelectedUserObj = () => {
    if (!selectedUser) return null;
    return users.find(u => u.id === selectedUser);
  };

  if (user?.role !== 'admin') {
    return (
      <Layout 
        title="成员管理" 
        subtitle="团队成员管理"
        onNavigate={onNavigate}
        currentPath={currentPath}
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">权限不足</h3>
          <p className="text-yellow-700">您的角色没有成员管理权限，请联系管理员获取权限。</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="成员管理" 
      subtitle="团队成员管理与权限配置"
      onNavigate={onNavigate}
      currentPath={currentPath}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索成员姓名或邮箱..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          添加成员
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((userItem) => {
          const stats = getUserStats(userItem.id);
          const isCurrentUser = userItem.id === user?.id;
          
          return (
            <div 
              key={userItem.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-lg font-bold text-primary-600">
                  {userItem.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{userItem.name}</h3>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">当前用户</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{userItem.email}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(userItem.role)}`}>
                  {getRoleText(userItem.role)}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-800">{stats.totalTasks}</p>
                  <p className="text-xs text-gray-500">总任务</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{stats.completedTasks}</p>
                  <p className="text-xs text-green-600">已完成</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{stats.totalAnnotations}</p>
                  <p className="text-xs text-blue-600">标注数</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedUser(userItem.id);
                    setFormData({ name: userItem.name, email: userItem.email, role: userItem.role });
                    setShowEditModal(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => {
                    if (!isCurrentUser) {
                      setSelectedUser(userItem.id);
                      setShowDeleteModal(true);
                    }
                  }}
                  disabled={isCurrentUser}
                  className={`p-2 rounded-lg transition-colors ${
                    isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
                  }`}
                >
                  <Trash2 className={`w-4 h-4 ${isCurrentUser ? 'text-gray-300' : 'text-red-500'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">没有找到匹配的成员</p>
        </div>
      )}

      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="添加成员"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入邮箱"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'annotator' | 'reviewer' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="annotator">标注员</option>
              <option value="reviewer">审核员</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>
              添加成员
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        title="编辑成员信息"
      >
        {getSelectedUserObj() && (
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'annotator' | 'reviewer' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="annotator">标注员</option>
                <option value="reviewer">审核员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}>
                取消
              </Button>
              <Button onClick={handleEdit}>
                保存修改
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="确认删除"
      >
        <div className="space-y-4">
          <p className="text-gray-600">确定要删除成员 <span className="font-medium">{getSelectedUserObj()?.name}</span> 吗？</p>
          <p className="text-sm text-gray-500">此操作将删除该成员的所有关联数据，且无法撤销。</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
