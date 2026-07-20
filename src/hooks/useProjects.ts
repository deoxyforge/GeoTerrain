import { useState, useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import type { CreateProjectInput, UpdateProjectInput } from '../types/project';

// Single hook that orchestrates all project mutations and re-syncs context
export function useProjects() {
  const ctx = useProjectContext();
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const clearError = useCallback(() => setMutationError(null), []);

  const createProject = useCallback(
    async (input: CreateProjectInput): Promise<{ success: boolean; error?: string }> => {
      setMutating(true);
      setMutationError(null);
      try {
        const res = await window.electronAPI.createProject(input);
        if (!res.success) {
          const err = res.error ?? 'Failed to create project';
          setMutationError(err);
          return { success: false, error: err };
        }
        await ctx.loadProjects();
        if (res.data) await ctx.selectProject(res.data.id);
        return { success: true };
      } catch {
        const err = 'Failed to communicate with database';
        setMutationError(err);
        return { success: false, error: err };
      } finally {
        setMutating(false);
      }
    },
    [ctx]
  );

  const updateProject = useCallback(
    async (input: UpdateProjectInput): Promise<{ success: boolean; error?: string }> => {
      setMutating(true);
      setMutationError(null);
      try {
        const res = await window.electronAPI.updateProject(input);
        if (!res.success) {
          const err = res.error ?? 'Failed to update project';
          setMutationError(err);
          return { success: false, error: err };
        }
        await ctx.loadProjects();
        if (res.data && ctx.activeProject?.id === res.data.id) {
          ctx.setActiveProject(res.data);
        }
        return { success: true };
      } catch {
        const err = 'Failed to communicate with database';
        setMutationError(err);
        return { success: false, error: err };
      } finally {
        setMutating(false);
      }
    },
    [ctx]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      setMutating(true);
      setMutationError(null);
      try {
        const res = await window.electronAPI.deleteProject(id);
        if (!res.success) {
          const err = res.error ?? 'Failed to delete project';
          setMutationError(err);
          return { success: false, error: err };
        }
        if (ctx.activeProject?.id === id) ctx.clearActiveProject();
        await ctx.loadProjects();
        return { success: true };
      } catch {
        const err = 'Failed to communicate with database';
        setMutationError(err);
        return { success: false, error: err };
      } finally {
        setMutating(false);
      }
    },
    [ctx]
  );

  return {
    ...ctx,
    mutating,
    mutationError,
    clearError,
    createProject,
    updateProject,
    deleteProject,
  };
}
