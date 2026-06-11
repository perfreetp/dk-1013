import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Box, Category, Annotation, Task, Batch, Image, Review } from '../types';
import { 
  mockUsers as initialUsers, 
  mockBatches as initialBatches, 
  mockImages as initialImages, 
  mockTasks as initialTasks, 
  mockAnnotations as initialAnnotations, 
  mockCategories as initialCategories, 
  mockReviews as initialReviews 
} from '../data/mockData';

interface Store {
  user: User | null;
  setUser: (user: User | null) => void;
  
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  currentBox: Box | null;
  setCurrentBox: (box: Box | null) => void;
  
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  
  currentImageId: string | null;
  setCurrentImageId: (imageId: string | null) => void;
  
  draftBoxes: Box[];
  setDraftBoxes: (boxes: Box[]) => void;
  addDraftBox: (box: Box) => void;
  updateDraftBox: (id: string, updates: Partial<Box>) => void;
  removeDraftBox: (id: string) => void;
  clearDraft: () => void;

  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  findUserByEmail: (email: string) => User | undefined;
  findUserById: (id: string) => User | undefined;

  batches: Batch[];
  addBatch: (batch: Omit<Batch, 'id' | 'createdAt'>) => void;
  deleteBatch: (id: string) => void;

  images: Image[];
  addImages: (images: Omit<Image, 'id' | 'createdAt'>[]) => void;
  getImagesByBatchId: (batchId: string) => Image[];

  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  reassignTasks: (oldAssigneeId: string, newAssigneeId: string) => void;

  annotations: Annotation[];
  saveAnnotationDraft: (taskId: string, imageId: string, boxes: Box[]) => void;
  submitAnnotation: (taskId: string, imageId: string, boxes: Box[]) => void;
  approveAnnotation: (id: string) => void;
  rejectAnnotation: (id: string, comments: string) => void;
  getAnnotationForImage: (imageId: string) => Annotation | undefined;
  getLatestAnnotationForImage: (imageId: string) => Annotation | undefined;
  getRejectedImages: (taskId: string) => string[];
  deleteOldAnnotations: (imageId: string) => void;
  getLatestAnnotations: () => Annotation[];

  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  getReviewsForAnnotation: (annotationId: string) => Review[];

  categories: Category[];
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const now = () => new Date().toISOString().split('T')[0];

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      currentBox: null,
      setCurrentBox: (box) => set({ currentBox: box }),
      
      selectedCategory: null,
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      currentTask: null,
      setCurrentTask: (task) => set({ currentTask: task }),
      
      currentImageId: null,
      setCurrentImageId: (imageId) => set({ currentImageId: imageId }),
      
      draftBoxes: [],
      setDraftBoxes: (boxes) => set({ draftBoxes: boxes }),
      addDraftBox: (box) => set((state) => ({ draftBoxes: [...state.draftBoxes, box] })),
      updateDraftBox: (id, updates) => set((state) => ({
        draftBoxes: state.draftBoxes.map((box) =>
          box.id === id ? { ...box, ...updates } : box
        ),
      })),
      removeDraftBox: (id) => set((state) => ({
        draftBoxes: state.draftBoxes.filter((box) => box.id !== id),
      })),
      clearDraft: () => set({ draftBoxes: [], currentBox: null }),

      users: initialUsers,
      addUser: (user) => set((state) => ({
        users: [...state.users, {
          ...user,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        }],
      })),
      updateUser: (id, updates) => set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? { ...user, ...updates, updatedAt: now() } : user
        ),
      })),
      deleteUser: (id) => set((state) => ({
        users: state.users.filter((user) => user.id !== id),
      })),
      findUserByEmail: (email) => {
        return get().users.find((user) => user.email === email);
      },
      findUserById: (id) => {
        return get().users.find((user) => user.id === id);
      },

      batches: initialBatches,
      addBatch: (batch) => set((state) => ({
        batches: [...state.batches, {
          ...batch,
          id: generateId(),
          createdAt: now(),
        }],
      })),
      deleteBatch: (id) => set((state) => ({
        batches: state.batches.filter((batch) => batch.id !== id),
        images: state.images.filter((image) => image.batchId !== id),
        tasks: state.tasks.filter((task) => task.batchId !== id),
        annotations: state.annotations.filter((a) => {
          const task = state.tasks.find(t => t.id === a.taskId);
          return task?.batchId !== id;
        }),
      })),

      images: initialImages,
      addImages: (newImages) => set((state) => ({
        images: [...state.images, ...newImages.map((img) => ({
          ...img,
          id: generateId(),
          createdAt: now(),
        }))],
      })),
      getImagesByBatchId: (batchId) => {
        return get().images.filter((image) => image.batchId === batchId);
      },

      tasks: initialTasks,
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, {
          ...task,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        }],
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt: now() } : task
        ),
      })),
      reassignTasks: (oldAssigneeId, newAssigneeId) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.assigneeId === oldAssigneeId
            ? { ...task, assigneeId: newAssigneeId, updatedAt: now() }
            : task
        ),
      })),

      annotations: initialAnnotations,
      saveAnnotationDraft: (taskId, imageId, boxes) => set((state) => {
        const existingIndex = state.annotations.findIndex(
          (a) => a.imageId === imageId
        );
        
        if (existingIndex >= 0) {
          const newAnnotations = [...state.annotations];
          newAnnotations[existingIndex] = {
            ...newAnnotations[existingIndex],
            taskId,
            boxes,
            status: 'draft',
            updatedAt: now(),
          };
          return { annotations: newAnnotations };
        } else {
          return {
            annotations: [...state.annotations, {
              id: generateId(),
              taskId,
              imageId,
              boxes,
              status: 'draft',
              createdAt: now(),
              updatedAt: now(),
            }],
          };
        }
      }),
      submitAnnotation: (taskId, imageId, boxes) => set((state) => {
        const existingIndex = state.annotations.findIndex(
          (a) => a.imageId === imageId
        );
        
        if (existingIndex >= 0) {
          const newAnnotations = [...state.annotations];
          newAnnotations[existingIndex] = {
            ...newAnnotations[existingIndex],
            taskId,
            boxes,
            status: 'submitted',
            updatedAt: now(),
          };
          return { annotations: newAnnotations };
        } else {
          return {
            annotations: [...state.annotations, {
              id: generateId(),
              taskId,
              imageId,
              boxes,
              status: 'submitted',
              createdAt: now(),
              updatedAt: now(),
            }],
          };
        }
      }),
      approveAnnotation: (id) => {
        const annotation = get().annotations.find((a) => a.id === id);
        if (annotation) {
          set((state) => ({
            annotations: state.annotations.map((a) =>
              a.id === id ? { ...a, status: 'reviewed', updatedAt: now() } : a
            ),
            tasks: state.tasks.map((t) =>
              t.id === annotation.taskId && t.status === 'reviewing'
                ? { ...t, status: 'completed', updatedAt: now() }
                : t
            ),
          }));
        }
      },
      rejectAnnotation: (id, comments) => {
        const annotation = get().annotations.find((a) => a.id === id);
        if (annotation) {
          set((state) => ({
            annotations: state.annotations.map((a) =>
              a.id === id ? { ...a, status: 'draft', updatedAt: now() } : a
            ),
            tasks: state.tasks.map((t) =>
              t.id === annotation.taskId && t.status === 'reviewing'
                ? { ...t, status: 'in_progress', updatedAt: now() }
                : t
            ),
            reviews: [...state.reviews, {
              id: generateId(),
              annotationId: id,
              reviewerId: get().user?.id || '',
              result: 'rejected',
              comments,
              createdAt: now(),
            }],
          }));
        }
      },
      getAnnotationForImage: (imageId) => {
        return get().annotations.find((a) => a.imageId === imageId);
      },
      getLatestAnnotationForImage: (imageId) => {
        const annotations = get().annotations.filter((a) => a.imageId === imageId);
        if (annotations.length === 0) return undefined;
        return annotations.reduce((latest, current) => 
          current.updatedAt > latest.updatedAt ? current : latest
        );
      },
      getRejectedImages: (taskId: string) => {
        const task = get().tasks.find(t => t.id === taskId);
        if (!task) return [];
        
        const taskImages = get().images.filter(img => img.batchId === task.batchId);
        const rejectedImages: string[] = [];
        
        taskImages.forEach(img => {
          const annotation = get().annotations.find(a => a.imageId === img.id);
          if (annotation) {
            const reviews = get().reviews.filter(r => r.annotationId === annotation.id);
            const hasRejection = reviews.some(r => r.result === 'rejected');
            const lastReview = reviews.sort((a, b) => 
              (new Date(b.createdAt).getTime() as number) - (new Date(a.createdAt).getTime() as number)
            )[0];
            
            if (hasRejection && (!lastReview || lastReview.result === 'rejected')) {
              rejectedImages.push(img.id);
            }
          }
        });
        
        return rejectedImages;
      },
      deleteOldAnnotations: (imageId) => set((state) => {
        const annotations = state.annotations.filter((a) => a.imageId === imageId);
        if (annotations.length <= 1) return state;
        
        const latest = annotations.reduce((latest, current) => 
          current.updatedAt > latest.updatedAt ? current : latest
        );
        
        return {
          annotations: state.annotations.filter((a) => 
            a.imageId !== imageId || a.id === latest.id
          ),
        };
      }),
      getLatestAnnotations: () => {
        const allAnnotations = get().annotations;
        const imageMap = new Map<string, Annotation>();
        
        allAnnotations.forEach(annotation => {
          const existing = imageMap.get(annotation.imageId);
          if (!existing || annotation.updatedAt > existing.updatedAt) {
            imageMap.set(annotation.imageId, annotation);
          }
        });
        
        return Array.from(imageMap.values());
      },

      reviews: initialReviews,
      addReview: (review) => set((state) => ({
        reviews: [...state.reviews, {
          ...review,
          id: generateId(),
          createdAt: now(),
        }],
      })),
      getReviewsForAnnotation: (annotationId) => {
        return get().reviews.filter((r) => r.annotationId === annotationId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      categories: initialCategories,
    }),
    {
      name: 'road-annotation-storage',
    }
  )
);
