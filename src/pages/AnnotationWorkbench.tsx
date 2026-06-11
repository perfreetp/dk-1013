import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Save, 
  Send, 
  Undo, 
  Delete, 
  ChevronLeft, 
  ChevronRight,
  Square,
  Circle,
  Type,
  Info,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/Common/Button';
import { Modal } from '../components/Common/Modal';
import { useStore } from '../store';
import { Box, Category, Image } from '../types';
import { generateId } from '../utils/helpers';

interface AnnotationWorkbenchProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const AnnotationWorkbench = ({ onNavigate, currentPath }: AnnotationWorkbenchProps) => {
  const { 
    draftBoxes, 
    setDraftBoxes, 
    addDraftBox, 
    updateDraftBox, 
    removeDraftBox, 
    clearDraft,
    annotations,
    reviews,
    saveAnnotationDraft,
    submitAnnotation,
    categories,
    tasks,
    images,
    batches,
    users,
    updateTask,
    user,
    currentTask,
    setCurrentTask,
    currentImageId,
    setCurrentImageId,
    deleteOldAnnotations,
    getRejectedImages,
  } = useStore();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const task = useMemo(() => {
    if (currentTask) {
      return tasks.find(t => t.id === currentTask.id);
    }
    if (user?.role === 'annotator') {
      return tasks.find(t => t.assigneeId === user.id && (t.status === 'pending' || t.status === 'in_progress'));
    }
    return tasks[0] || null;
  }, [currentTask, tasks, user]);

  const taskImages = useMemo(() => {
    if (!task) return [];
    return images.filter(img => img.batchId === task.batchId);
  }, [task, images]);

  const currentImage = taskImages[currentImageIndex] || { id: 'temp', batchId: '', fileName: 'road.jpg', storagePath: '', width: 1920, height: 1080, createdAt: '' };
  const scale = 0.5;

  const getImageStatus = (image: Image) => {
    const annotation = annotations.find(a => a.imageId === image.id);
    if (!annotation || annotation.boxes.length === 0) return 'unmarked';
    
    if (annotation.status === 'draft') {
      const imageReviews = reviews.filter(r => r.annotationId === annotation.id);
      const hasRejection = imageReviews.some(r => r.result === 'rejected');
      const lastReview = imageReviews.sort((a, b) => 
        (new Date(b.createdAt).getTime() as number) - (new Date(a.createdAt).getTime() as number)
      )[0];
      
      if (hasRejection && lastReview?.result === 'rejected') {
        return 'rejected';
      }
    }
    
    if (annotation.status === 'draft') return 'draft';
    if (annotation.status === 'submitted') return 'submitted';
    if (annotation.status === 'reviewed') return 'reviewed';
    return 'unmarked';
  };

  const filteredImages = useMemo(() => {
    if (filterType === 'all') return taskImages;
    return taskImages.filter(img => getImageStatus(img) === filterType);
  }, [taskImages, filterType]);

  useEffect(() => {
    const imageIndex = taskImages.findIndex(img => img.id === currentImageId);
    if (imageIndex >= 0) {
      setCurrentImageIndex(imageIndex);
    } else if (currentTask && taskImages.length > 0) {
      const rejectedIndex = taskImages.findIndex(img => {
        const annotation = annotations.find(a => a.imageId === img.id);
        return annotation?.status === 'draft' && annotation.boxes.length > 0;
      });
      if (rejectedIndex >= 0) {
        setCurrentImageIndex(rejectedIndex);
      }
    }
    setCurrentImageId(null);
  }, [currentTask, taskImages, annotations, currentImageId, setCurrentImageId]);

  useEffect(() => {
    if (currentImage.id !== 'temp') {
      const savedAnnotation = annotations.find(a => a.imageId === currentImage.id);
      if (savedAnnotation && savedAnnotation.boxes.length > 0) {
        setDraftBoxes(savedAnnotation.boxes);
      } else {
        setDraftBoxes([]);
      }
    }
  }, [currentImage.id, annotations, setDraftBoxes]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    setIsDrawing(true);
    setStartPoint({ x, y });
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);
    const boxX = Math.min(startPoint.x, x);
    const boxY = Math.min(startPoint.y, y);
    
    const tempBox: Box = {
      id: 'temp',
      x: boxX,
      y: boxY,
      width,
      height,
      category: selectedCategory?.code || '',
      categoryName: selectedCategory?.name || '',
      properties: {},
    };
    
    setDraftBoxes([...draftBoxes.filter(b => b.id !== 'temp'), tempBox]);
  }, [isDrawing, startPoint, scale, selectedCategory, draftBoxes, setDraftBoxes]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const tempBox = draftBoxes.find(b => b.id === 'temp');
    if (tempBox && tempBox.width > 10 && tempBox.height > 10) {
      const newBox: Box = {
        ...tempBox,
        id: generateId(),
        category: selectedCategory?.code || '',
        categoryName: selectedCategory?.name || '',
      };
      addDraftBox(newBox);
      setSelectedBox(newBox.id);
      if (!selectedCategory) {
        setShowCategoryModal(true);
      }
    }
    
    setDraftBoxes(draftBoxes.filter(b => b.id !== 'temp'));
  }, [isDrawing, draftBoxes, selectedCategory, addDraftBox, setDraftBoxes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleMouseLeave = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setDraftBoxes(draftBoxes.filter(b => b.id !== 'temp'));
      }
    };
    
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => canvas.removeEventListener('mouseleave', handleMouseLeave);
  }, [isDrawing, draftBoxes, setDraftBoxes]);

  const handleBoxClick = (boxId: string) => {
    setSelectedBox(boxId);
    const box = draftBoxes.find(b => b.id === boxId);
    if (box) {
      const category = categories.find(c => c.code === box.category);
      setSelectedCategory(category || null);
      setProperties(box.properties);
    }
  };

  const handlePropertyChange = (name: string, value: string) => {
    setProperties(prev => ({ ...prev, [name]: value }));
    if (selectedBox) {
      const box = draftBoxes.find(b => b.id === selectedBox);
      if (box) {
        updateDraftBox(selectedBox, { properties: { ...box.properties, [name]: value } });
      }
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setProperties({});
    
    if (selectedBox) {
      const box = draftBoxes.find(b => b.id === selectedBox);
      if (box) {
        updateDraftBox(selectedBox, { 
          category: category.code, 
          categoryName: category.name,
          properties: {}
        });
      }
    }
    setShowCategoryModal(false);
  };

  const handleDeleteBox = () => {
    if (selectedBox) {
      removeDraftBox(selectedBox);
      setSelectedBox(null);
      setSelectedCategory(null);
      setProperties({});
    }
  };

  const handleSaveDraft = () => {
    if (task && currentImage.id !== 'temp') {
      saveAnnotationDraft(task.id, currentImage.id, draftBoxes);
      deleteOldAnnotations(currentImage.id);
    }
  };

  const handleSubmit = () => {
    if (task && currentImage.id !== 'temp') {
      submitAnnotation(task.id, currentImage.id, draftBoxes);
      deleteOldAnnotations(currentImage.id);

      if (task.status === 'pending') {
        updateTask(task.id, { status: 'in_progress' });
      } else if (task.status === 'in_progress') {
        const allSubmitted = taskImages.every(img => {
          const annotation = annotations.find(a => a.imageId === img.id);
          return annotation?.status === 'submitted';
        });
        if (allSubmitted) {
          updateTask(task.id, { status: 'reviewing' });
        }
      }

      setShowSubmitModal(false);
      clearDraft();
      setSelectedBox(null);
      setSelectedCategory(null);
      setProperties({});
      alert('提交成功，已进入审核队列');
    }
  };

  const handlePrevImage = () => {
    handleSaveDraft();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      clearDraft();
      setSelectedBox(null);
      setSelectedCategory(null);
      setProperties({});
    }
  };

  const handleNextImage = () => {
    handleSaveDraft();
    if (currentImageIndex < taskImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      clearDraft();
      setSelectedBox(null);
      setSelectedCategory(null);
      setProperties({});
    }
  };

  const handleImageClick = (index: number) => {
    handleSaveDraft();
    setCurrentImageIndex(index);
    clearDraft();
    setSelectedBox(null);
    setSelectedCategory(null);
    setProperties({});
  };

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const getCategoryColor = (categoryCode: string) => {
    const index = categories.findIndex(c => c.code === categoryCode);
    return colors[index % colors.length];
  };

  const currentBatch = batches.find(b => b.id === currentImage.batchId);
  const assignee = task ? users.find(u => u.id === task.assigneeId) : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unmarked': return <Eye className="w-4 h-4 text-gray-400" />;
      case 'draft': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'submitted': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'reviewed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <X className="w-4 h-4 text-red-500" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'unmarked': return 'bg-gray-100';
      case 'draft': return 'bg-yellow-50';
      case 'submitted': return 'bg-blue-50';
      case 'reviewed': return 'bg-green-50';
      case 'rejected': return 'bg-red-50';
      default: return 'bg-gray-100';
    }
  };

  return (
    <Layout 
      title="标注工作台" 
      subtitle={task ? `${task.batchId ? batches.find(b => b.id === task.batchId)?.name : '任务'} - ${assignee?.name || ''}` : '选择任务开始标注'}
      onNavigate={onNavigate}
      currentPath={currentPath}
    >
      {!task ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无可用任务</h3>
          <p className="text-gray-500">请先在任务分配中创建或分配任务</p>
          <Button onClick={() => onNavigate('/tasks')} className="mt-4">
            前往任务分配
          </Button>
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="secondary" 
                    onClick={handlePrevImage}
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一张
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentImageIndex + 1} / {taskImages.length}
                  </span>
                  <Button 
                    variant="secondary" 
                    onClick={handleNextImage}
                    disabled={currentImageIndex === taskImages.length - 1}
                  >
                    下一张
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{currentBatch?.name || '-'}</span>
                  <span className="text-sm text-gray-500">{currentImage?.fileName}</span>
                </div>
              </div>
              
              <div 
                ref={canvasRef}
                className="relative bg-gray-100 rounded-lg overflow-hidden cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ 
                  width: `${(currentImage?.width || 1920) * scale}px`, 
                  height: `${(currentImage?.height || 1080) * scale}px` 
                }}
              >
                <img
                  ref={imageRef}
                  src={`https://picsum.photos/${currentImage?.width || 1920}/${currentImage?.height || 1080}?random=${currentImage.id}`}
                  alt="Road"
                  className="absolute top-0 left-0"
                  style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                />
                
                {draftBoxes.map((box) => (
                  <div
                    key={box.id}
                    className={`absolute border-2 rounded-sm cursor-pointer transition-all ${
                      selectedBox === box.id 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-red-500 hover:border-red-400'
                    }`}
                    style={{
                      left: `${box.x * scale}px`,
                      top: `${box.y * scale}px`,
                      width: `${box.width * scale}px`,
                      height: `${box.height * scale}px`,
                      backgroundColor: `${getCategoryColor(box.category)}20`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoxClick(box.id);
                    }}
                  >
                    <div 
                      className="absolute -top-6 left-0 px-2 py-0.5 text-xs text-white rounded"
                      style={{ backgroundColor: getCategoryColor(box.category) }}
                    >
                      {box.categoryName}
                    </div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-white border-2 border-red-500 rounded-full cursor-se-resize" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={handleSaveDraft}>
                <Save className="w-4 h-4" />
                保存草稿
              </Button>
              <Button onClick={() => setShowSubmitModal(true)}>
                <Send className="w-4 h-4" />
                提交审核
              </Button>
            </div>
          </div>

          <div className="w-80">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4">标注工具</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    selectedCategory 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: selectedCategory ? getCategoryColor(selectedCategory.code) : '#e5e7eb' }}
                  >
                    <Square className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {selectedCategory ? selectedCategory.name : '选择类别'}
                    </p>
                    <p className="text-xs text-gray-500">点击选择标注类别</p>
                  </div>
                </button>

                {selectedBox && (
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={handleDeleteBox}
                    className="w-full"
                  >
                    <Delete className="w-4 h-4" />
                    删除选中框
                  </Button>
                )}
              </div>

              {selectedCategory && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    属性编辑
                  </h4>
                  <div className="space-y-3">
                    {selectedCategory.properties.map((prop) => (
                      <div key={prop.name}>
                        <label className="block text-sm text-gray-600 mb-1">{prop.name}</label>
                        {prop.type === 'enum' && prop.options ? (
                          <select
                            value={properties[prop.name] || ''}
                            onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">请选择</option>
                            {prop.options.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={properties[prop.name] || ''}
                            onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={`输入${prop.name}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  图片筛选
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'unmarked', label: '未标' },
                    { value: 'draft', label: '草稿' },
                    { value: 'submitted', label: '待提交' },
                    { value: 'rejected', label: '退回' },
                    { value: 'reviewed', label: '已审核' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setFilterType(filter.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        filterType === filter.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">图片队列</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredImages.map((img, index) => {
                    const actualIndex = taskImages.indexOf(img);
                    const status = getImageStatus(img);
                    return (
                      <button
                        key={img.id}
                        onClick={() => handleImageClick(actualIndex)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                          currentImageIndex === actualIndex
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 ${getStatusBg(status)} rounded flex items-center justify-center`}>
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{img.fileName}</p>
                        </div>
                        <span className="text-xs text-gray-400">{actualIndex + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    在图片上拖拽鼠标创建标注框，然后选择类别并填写属性信息。切换图片时自动保存草稿。
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">当前标注 ({draftBoxes.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {draftBoxes.map((box) => (
                    <div
                      key={box.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                        selectedBox === box.id ? 'bg-primary-50' : 'bg-gray-50'
                      }`}
                      onClick={() => handleBoxClick(box.id)}
                    >
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: getCategoryColor(box.category) }}
                      />
                      <span className="text-sm text-gray-700 truncate">{box.categoryName}</span>
                    </div>
                  ))}
                  {draftBoxes.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">暂无标注</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="选择标注类别"
      >
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedCategory?.id === category.id 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Circle 
                  className="w-3 h-3" 
                  style={{ color: getCategoryColor(category.code) }}
                  fill={getCategoryColor(category.code)}
                />
                <span className="font-medium text-gray-800">{category.name}</span>
              </div>
              <p className="text-xs text-gray-500">{category.description}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal 
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="确认提交"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-700">
              提交后标注将进入审核队列，审核通过后无法修改。
            </p>
          </div>
          <div>
            <p className="text-gray-600">本次标注信息：</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-500">
              <li>图片：{currentImage?.fileName}</li>
              <li>标注框数量：{draftBoxes.length} 个</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              确认提交
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
