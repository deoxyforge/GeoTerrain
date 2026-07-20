import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { Project } from '../types/project';

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  clearActiveProject: () => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await window.electronAPI.getAllProjects();
      if (res.success && res.data) {
        setProjects(res.data);
      } else {
        setError(res.error ?? 'Failed to load projects');
      }
    } catch (err) {
      setError('Failed to communicate with database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectProject = useCallback(async (id: string) => {
    const res = await window.electronAPI.openProject(id);
    if (res.success && res.data) {
      setActiveProject(res.data);
      // Refresh list so last_opened order updates
      setProjects((prev) => prev.map((p) => (p.id === id ? (res.data as Project) : p)));
      // Persist last opened project id
      try {
        await window.electronAPI.setSetting('lastProjectId', id);
      } catch (err) {
        console.error('Failed to save lastOpenedProjectId setting', err);
      }
    }
  }, []);

  const clearActiveProject = useCallback(() => setActiveProject(null), []);

  // Load on mount & restore last project
  useEffect(() => {
    const initProjects = async () => {
      await loadProjects();
      try {
        const settingsRes = await window.electronAPI.getAllSettings();
        if (settingsRes.success && settingsRes.data) {
          const s = settingsRes.data;
          const restore = s.restoreLastProject !== 'false'; // default to true
          if (restore && s.lastProjectId) {
            await selectProject(s.lastProjectId);
          }
        }
      } catch (err) {
        console.error('Failed to restore last active project', err);
      }
    };
    initProjects();
  }, [loadProjects, selectProject]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        error,
        loadProjects,
        selectProject,
        clearActiveProject,
        setProjects,
        setActiveProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used inside ProjectProvider');
  return ctx;
}
