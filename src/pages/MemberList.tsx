import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Mail,
  User,
  AlertTriangle
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
  const { users, tasks, annotations, addUser, updateUser, deleteUser, user, setUser, reassignTasks } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
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
      pendingTasks: userTasks.filter(t => t.status !== 'completed').length,
      totalAnnotations: userAnnotations.length,
    };
  };

  const getUncompletedTasks = (userId: string) => {
    return tasks.filter(t => t.assigneeId === userId && t.status !== 'completed');
  };

  const handleCreate = () => {
    const existingUser = users.find(u => u.email === formData.email);
    if (existingUser) {
      alert('该邮箱已被注册');
      return;
    }
    
    addUser({
      name: formData.name,
      email: formData.email,
      role: formData.role,
    });
    alert(`成员 ${formData.name} 添加成功！密码为: 123456`);
    setShowCreateModal(false);
    setFormData({ name: '', email: '', role: 'annotator' });
  };

  const handleEdit = () => {
    if (selectedUser) {
      const existingUser = users.find(u => u.email === formData.email && u.id !== selectedUser);
      if (existingUser) {
        alert('该邮箱已被其他成员使用');
        return;
      }
      
      const oldRole = users.find(u => u.id === selectedUser)?.role;
      const oldEmail = users.find(u => u.id === selectedUser)?.email;
      updateUser(selectedUser, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
      
      if (selectedUser === user?.id) {
        setUser({ 
          ...user, 
          name: formData.name, 
          email: formData.email, 
          role: formData.role 
        });
      }
      
      if (oldRole !== formData.role) {
        alert('角色已修改，侧边栏权限将在下一次登录时生效');
      }
      
      if (oldEmail !== formData.email) {
        alert('邮箱已修改，下次登录请使用新邮箱');
      }
    }
    setShowEditModal(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '', role: 'annotator' });
  };

  const handleDelete = () => {
    if (selectedUser && selectedUser !== user?.id) {
      deleteUser(selectedUser);
      alert('成员已删除');
    }
    setShowDeleteModal(false);
    setSelectedUser(null);
    setNewAssigneeId('');
  };

  const handleReassignAndDelete = () => {
    if (selectedUser && newAssigneeId) {
      reassignTasks(selectedUser, newAssigneeId);
      deleteUser(selectedUser);
      alert('成员已删除，关联任务已重新分配');
    }
    setShowDeleteModal(false);
    setSelectedUser(null);
    setNewAssigneeId('');
  };

  const getSelectedUserObj = () => {
    if (!selectedUser) return null;
    return users.find(u => u.id === selectedUser);
  };

  const getAvailableAssignees = () => {
    return users.filter(u => 
      u.id !== selectedUser && 
      u.id !== user?.id &&
      (u.role === 'annotator' || u.role === 'admin')
    );
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
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-800">{stats.totalTasks}</p>
                  <p className="text-xs text-gray-500">总任务</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{stats.completedTasks}</p>
                  <p className="text-xs text-green-600">已完成</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <p className="text-lg font-bold text-yellow-600">{stats.pendingTasks}</p>
                  <p className="text-xs text-yellow-600">进行中</p>
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
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              新增成员密码为：<span className="font-medium">123456</span>
            </p>
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
        {getSelectedUserObj() && (
          <div className="space-y-4">
            <p className="text-gray-600">确定要删除成员 <span className="font-medium">{getSelectedUserObj()?.name}</span> 吗？</p>
            
            {getUncompletedTasks(selectedUser!).length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">存在未完成任务</p>
                  <p className="text-sm text-yellow-600">
                    该成员有 {getUncompletedTasks(selectedUser!).length} 个未完成的任务，删除前需要处理这些任务。
                  </p>
                </div>
              </div>
            )}
            
            {getUncompletedTasks(selectedUser!).length > 0 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">将任务重新分配给</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择新的负责人</option>
                    {getAvailableAssignees().length > 0 ? (
                      getAvailableAssignees().map(assignee => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.name} ({getRoleText(assignee.role)})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>暂无可用的标注员</option>
                    )}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}>
                    取消
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleReassignAndDelete}
                    disabled={!newAssigneeId || getAvailableAssignees().length === 0}
                  >
                    确认删除并重新分配任务
                  </Button>
                </div>
                {getAvailableAssignees().length === 0 && (
                  <p className="text-sm text-red-500">
                    没有可用的标注员来接收这些任务，请先添加标注员或完成现有任务。
                  </p>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};
