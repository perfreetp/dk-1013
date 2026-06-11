import { create } from 'zustand';
import { User, Box, Category, Annotation, Task } from '../types';

interface Store {
  user: User | null;
  setUser: (user: User | null) => void;
  
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  currentBox: Box | null;
  setCurrentBox: (box: Box | null) => void;
  
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  
  annotations: Annotation[];
  setAnnotations: (annotations: Annotation[]) => void;
  
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
  
  draftBoxes: Box[];
  setDraftBoxes: (boxes: Box[]) => void;
  addDraftBox: (box: Box) => void;
  updateDraftBox: (id: string, updates: Partial<Box>) => void;
  removeDraftBox: (id: string) => void;
  
  clearDraft: () => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  currentBox: null,
  setCurrentBox: (box) => set({ currentBox: box }),
  
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  annotations: [],
  setAnnotations: (annotations) => set({ annotations }),
  
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),
  
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
}));
