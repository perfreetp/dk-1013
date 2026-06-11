import { useState } from 'react';
import { 
  Check, 
  X, 
  Download, 
  Search, 
  Filter,
  ChevronDown,
  Eye,
  BarChart3,
  Shuffle,
  AlertCircle
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { mockAnnotations, mockReviews, mockImages, mockUsers, mockCategories } from '../data/mockData';
import { getStatusText, getStatusColor, downloadJSON, downloadCSV } from '../utils/helpers';
import { useStore } from '../store';

interface ReviewListProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const ReviewList = ({ onNavigate, currentPath }: ReviewListProps) => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'review' | 'statistics' | 'audit'>('review');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const pendingAnnotations = mockAnnotations.filter(a => a.status === 'submitted');
  const reviewedAnnotations = mockAnnotations.filter(a => a.status === 'reviewed' || a.status === 'rejected');

  const filteredAnnotations = [...pendingAnnotations, ...reviewedAnnotations].filter(annotation => {
    const image = mockImages.find(i => i.id === annotation.imageId);
    const matchesSearch = image?.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || annotation.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getAnnotation = (id: string | null) => {
    if (!id) return null;
    const annotation = mockAnnotations.find(a => a.id === id);
    if (!annotation) return null;
    return {
      ...annotation,
      image: mockImages.find(i => i.id === annotation.imageId),
      review: mockReviews.find(r => r.annotationId === annotation.id),
    };
  };

  const handleApprove = () => {
    setShowDetailModal(false);
    setSelectedAnnotation(null);
    setReviewComment('');
    alert('标注已审核通过');
  };

  const handleReject = () => {
    setShowDetailModal(false);
    setSelectedAnnotation(null);
    setReviewComment('');
    alert('标注已退回修改');
  };

  const categoryStats = mockCategories.map(category => {
    const count = mockAnnotations.reduce((sum, annotation) => {
      return sum + annotation.boxes.filter(box => box.category === category.code).length;
    }, 0);
    return { category: category.name, count };
  });

  const userStats = mockUsers.map(user => {
    const annotations = mockAnnotations.filter(a => {
      const task = mockReviews.find(r => r.annotationId === a.id);
      return task?.reviewerId === user.id;
    });
    return {
      name: user.name,
      reviewed: annotations.length,
      approved: annotations.filter(a => a.status === 'reviewed').length,
      rejected: annotations.filter(a => a.status === 'rejected').length,
    };
  }).filter(u => u.reviewed > 0);

  const qualityIssues = [
    { id: '1', description: '标注框位置不准确', severity: 'high' },
    { id: '2', description: '类别选择错误', severity: 'high' },
    { id: '3', description: '属性信息缺失', severity: 'medium' },
    { id: '4', description: '多个标注框重叠', severity: 'medium' },
    { id: '5', description: '标注框过大包含无关内容', severity: 'low' },
  ];

  const sampleAnnotations = [...mockAnnotations].sort(() => Math.random() - 0.5).slice(0, 3);

  const handleExport = (format: 'json' | 'csv') => {
    const exportData = mockAnnotations.map(a => ({
      id: a.id,
      imageId: a.imageId,
      status: getStatusText(a.status),
      boxCount: a.boxes.length,
      boxes: a.boxes.map(b => ({
        category: b.categoryName,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        properties: b.properties,
      })),
    }));

    if (format === 'json') {
      downloadJSON(exportData, 'annotations.json');
    } else {
      downloadCSV(exportData.flatMap(a => 
        a.boxes.map(box => ({
          annotationId: a.id,
          imageId: a.imageId,
          category: box.category,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          ...box.properties,
        }))
      ), 'annotations.csv');
    }
    setShowExportModal(false);
  };

  const handleExportIssues = () => {
    downloadJSON(qualityIssues, 'quality_issues.json');
    setShowExportModal(false);
  };

  return (
    <Layout 
      title="审核统计" 
      subtitle="标注审核与质量统计"
      onNavigate={onNavigate}
      currentPath={currentPath}
    >
      {user?.role === 'annotator' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-700">您的角色没有审核权限，请联系管理员获取权限。</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'review' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            待审核列表
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'statistics' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            统计报表
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'audit' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            质量抽查
          </button>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'reviewer') && (
          <Button onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4" />
            导出数据
          </Button>
        )}
      </div>

      {activeTab === 'review' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索图片名称..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters ? 'border-primary-600 text-primary-600' : 'border-gray-300 text-gray-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                筛选
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">待审核: <span className="font-medium text-blue-600">{pendingAnnotations.length}</span></span>
              <span className="text-gray-500">已审核: <span className="font-medium text-green-600">{reviewedAnnotations.length}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnnotations.map((annotation) => {
              const image = mockImages.find(i => i.id === annotation.imageId);
              const review = mockReviews.find(r => r.annotationId === annotation.id);
              const reviewer = review ? mockUsers.find(u => u.id === review.reviewerId) : null;
              
              return (
                <div 
                  key={annotation.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={`https://picsum.photos/400/225?random=${annotation.imageId}`}
                      alt={image?.fileName}
                      className="w-full h-40 object-cover"
                    />
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(annotation.status)}`}>
                      {getStatusText(annotation.status)}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-800 truncate">{image?.fileName}</p>
                      <span className="text-sm text-gray-500">{annotation.boxes.length} 个标注</span>
                    </div>
                    {review && (
                      <div className="text-xs text-gray-500 mb-3">
                        审核人: {reviewer?.name} | {review.createdAt}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedAnnotation(annotation.id);
                          setShowDetailModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      {annotation.status === 'submitted' && (
                        <>
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={handleApprove}
                          >
                            <Check className="w-4 h-4" />
                            通过
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => {
                              setSelectedAnnotation(annotation.id);
                              setShowDetailModal(true);
                            }}
                          >
                            <X className="w-4 h-4" />
                            退回
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAnnotations.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500">没有找到匹配的标注</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">标注总数</p>
              <p className="text-2xl font-bold text-gray-800">
                {mockAnnotations.reduce((sum, a) => sum + a.boxes.length, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">图片数量</p>
              <p className="text-2xl font-bold text-gray-800">{mockImages.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">审核通过</p>
              <p className="text-2xl font-bold text-green-600">
                {mockAnnotations.filter(a => a.status === 'reviewed').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">审核退回</p>
              <p className="text-2xl font-bold text-red-600">
                {mockAnnotations.filter(a => a.status === 'rejected').length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                类别统计
              </h3>
              <div className="space-y-3">
                {categoryStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-gray-600">{stat.category}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${(stat.count / Math.max(...categoryStats.map(s => s.count))) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-medium text-gray-700 text-right">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">审核员统计</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left text-sm text-gray-500">
                    <tr>
                      <th className="pb-2">审核员</th>
                      <th className="pb-2">审核数量</th>
                      <th className="pb-2">通过率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userStats.map((user, index) => (
                      <tr key={index}>
                        <td className="py-2">{user.name}</td>
                        <td className="py-2">{user.reviewed}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${(user.approved / user.reviewed) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {Math.round((user.approved / user.reviewed) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">问题清单</h3>
            <div className="space-y-2">
              {qualityIssues.map((issue) => (
                <div 
                  key={issue.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      issue.severity === 'high' ? 'bg-red-500' : 
                      issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-gray-700">{issue.description}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    issue.severity === 'high' ? 'bg-red-100 text-red-600' :
                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Shuffle className="w-5 h-5" />
                随机抽查
              </h3>
              <Button variant="secondary">
                <Shuffle className="w-4 h-4" />
                重新抽取
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleAnnotations.map((annotation) => {
                const image = mockImages.find(i => i.id === annotation.imageId);
                return (
                  <div 
                    key={annotation.id}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <img
                      src={`https://picsum.photos/300/169?random=${annotation.imageId}`}
                      alt={image?.fileName}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <p className="text-sm font-medium text-gray-800 mb-1">{image?.fileName}</p>
                    <p className="text-xs text-gray-500">{annotation.boxes.length} 个标注</p>
                    <button 
                      onClick={() => {
                        setSelectedAnnotation(annotation.id);
                        setShowDetailModal(true);
                      }}
                      className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
                    >
                      查看详情
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">质量评估</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">92%</div>
                <div className="text-sm text-gray-600 mt-1">准确率</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">88%</div>
                <div className="text-sm text-gray-600 mt-1">完整率</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">4</div>
                <div className="text-sm text-gray-600 mt-1">问题数量</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAnnotation(null);
          setReviewComment('');
        }}
        title="标注详情"
        size="xl"
      >
        {getAnnotation(selectedAnnotation) && (
          <div className="space-y-4">
            <div className="flex gap-6">
              <div className="flex-1">
                <img
                  src={`https://picsum.photos/600/338?random=${getAnnotation(selectedAnnotation)?.image?.id}`}
                  alt={getAnnotation(selectedAnnotation)?.image?.fileName}
                  className="w-full rounded-lg"
                />
              </div>
              <div className="w-64">
                <h4 className="font-medium text-gray-800 mb-3">标注信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">图片名称</span>
                    <span className="text-gray-800">{getAnnotation(selectedAnnotation)?.image?.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">标注状态</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(getAnnotation(selectedAnnotation)?.status || '')}`}>
                      {getStatusText(getAnnotation(selectedAnnotation)?.status || '')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">标注数量</span>
                    <span className="text-gray-800">{getAnnotation(selectedAnnotation)?.boxes.length} 个</span>
                  </div>
                </div>

                <h4 className="font-medium text-gray-800 mt-4 mb-3">标注详情</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getAnnotation(selectedAnnotation)?.boxes.map((box, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">{box.categoryName}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>位置: ({box.x}, {box.y})</div>
                        <div>尺寸: {box.width} x {box.height}</div>
                        {Object.entries(box.properties).map(([key, value]) => (
                          <div key={key}>{key}: {value}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {getAnnotation(selectedAnnotation)?.status === 'submitted' && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">审核意见</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                  placeholder="请输入审核意见（退回时必填）"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="secondary" onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAnnotation(null);
                    setReviewComment('');
                  }}>
                    关闭
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleReject}
                    disabled={!reviewComment}
                  >
                    <X className="w-4 h-4" />
                    退回修改
                  </Button>
                  <Button onClick={handleApprove}>
                    <Check className="w-4 h-4" />
                    审核通过
                  </Button>
                </div>
              </div>
            )}

            {getAnnotation(selectedAnnotation)?.review && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">审核记录</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      getAnnotation(selectedAnnotation)?.review?.result === 'approved' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {getStatusText(getAnnotation(selectedAnnotation)?.review?.result || '')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {mockUsers.find(u => u.id === getAnnotation(selectedAnnotation)?.review?.reviewerId)?.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{getAnnotation(selectedAnnotation)?.review?.comments}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出数据"
      >
        <div className="space-y-4">
          <p className="text-gray-600">选择导出格式：</p>
          <div className="space-y-3">
            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={() => handleExport('json')}
            >
              <Download className="w-4 h-4" />
              JSON 格式
            </Button>
            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={() => handleExport('csv')}
            >
              <Download className="w-4 h-4" />
              CSV 格式
            </Button>
            <Button 
              variant="secondary" 
              className="w-full justify-start"
              onClick={handleExportIssues}
            >
              <Download className="w-4 h-4" />
              问题清单
            </Button>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
