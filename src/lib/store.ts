import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BuilderData } from "./schema";

interface BuilderStore {
  data: BuilderData | null;
  projects: Record<string, BuilderData>;
  currentProject: string | null;
  setData: (data: BuilderData) => void;
  saveProject: (slug: string, data: BuilderData) => void;
  loadProject: (slug: string) => BuilderData | null;
  deleteProject: (slug: string) => void;
  setCurrentProject: (slug: string | null) => void;
  getAllProjects: () => BuilderData[];
}

export const useBuilder = create<BuilderStore>()(
  persist(
    (set, get) => ({
      data: null,
      projects: {},
      currentProject: null,
      
      setData: (data) => set({ data }),
      
      saveProject: (slug, data) => {
        set((state) => ({
          projects: { ...state.projects, [slug]: data },
          currentProject: slug,
          data
        }));
      },
      
      loadProject: (slug) => {
        const project = get().projects[slug];
        if (project) {
          set({ data: project, currentProject: slug });
          return project;
        }
        return null;
      },
      
      deleteProject: (slug) => {
        set((state) => {
          const newProjects = { ...state.projects };
          delete newProjects[slug];
          return {
            projects: newProjects,
            currentProject: state.currentProject === slug ? null : state.currentProject,
            data: state.currentProject === slug ? null : state.data
          };
        });
      },
      
      setCurrentProject: (slug) => set({ currentProject: slug }),
      
      getAllProjects: () => Object.values(get().projects),
    }),
    {
      name: "mx-builder-storage",
      partialize: (state) => ({ projects: state.projects, currentProject: state.currentProject }),
    }
  )
);