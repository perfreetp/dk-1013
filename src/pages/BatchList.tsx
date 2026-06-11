import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin,
  Eye,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { useStore } from '../store';
import { formatDate } from '../utils/helpers';

interface BatchListProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const BatchList = ({ onNavigate, currentPath }: BatchListProps) => {
  const { batches, addBatch, deleteBatch, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    collectionDate: '',
    description: '',
    imageCount: 0,
  });

  const sections = [...new Set(batches.map(b => b.section))];

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = !selectedSection || batch.section === selectedSection;
    const matchesDate = !selectedDate || batch.collectionDate === selectedDate;
    return matchesSearch && matchesSection && matchesDate;
  });

  const handleCreate = () => {
    addBatch({
      name: formData.name,
      section: formData.section,
      collectionDate: formData.collectionDate,
      description: formData.description,
      imageCount: formData.imageCount || Math.floor(Math.random() * 100) + 50,
      createdBy: user?.id || '',
    });
    setShowCreateModal(false);
    setFormData({ name: '', section: '', collectionDate: '', description: '', imageCount: 0 });
  };

  const handleDelete = () => {
    if (deletingBatch) {
      deleteBatch(deletingBatch);
    }
    setShowDeleteModal(false);
    setDeletingBatch(null);
  };

  return (
    <Layout 
      title="数据批次" 
      subtitle="管理道路图片数据批次"
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
              placeholder="搜索批次名称或路段..."
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
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          导入批次
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部路段</option>
                {sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={() => {
                setSelectedSection('');
                setSelectedDate('');
              }}
            >
              重置筛选
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.map((batch) => (
          <div 
            key={batch.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 truncate flex-1 mr-2">{batch.name}</h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onNavigate(`/batches/${batch.id}`)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button 
                  onClick={() => {
                    setDeletingBatch(batch.id);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{batch.section}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(batch.collectionDate)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-500">{batch.imageCount} 张图片</span>
                <span className="text-gray-400 text-xs">创建于 {formatDate(batch.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">没有找到匹配的数据批次</p>
        </div>
      )}

      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="导入数据批次"
        size="lg"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">批次名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入批次名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">路段 *</label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入路段名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">采集日期 *</label>
            <input
              type="date"
              value={formData.collectionDate}
              onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="输入批次描述"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">图片数量</label>
            <input
              type="number"
              value={formData.imageCount}
              onChange={(e) => setFormData({ ...formData, imageCount: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入图片数量"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">上传图片</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
              <p className="text-gray-500">点击或拖拽图片文件夹到此处</p>
              <p className="text-sm text-gray-400 mt-1">支持 JPG、PNG 格式</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>
              确认导入
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingBatch(null);
        }}
        title="确认删除"
      >
        <p className="text-gray-600">确定要删除这个数据批次吗？此操作无法撤销。</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false);
            setDeletingBatch(null);
          }}>
            取消
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            确认删除
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
