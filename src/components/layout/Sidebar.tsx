import { useState, useMemo } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useSettings } from '../../context/SettingsContext';
import ProjectListItem from '../project/ProjectListItem';
import ProjectModal from '../project/ProjectModal';
import ConfirmDeleteDialog from '../project/ConfirmDeleteDialog';
import type { Project } from '../../types/project';

type SortKey = 'updated' | 'created' | 'name';

export default function Sidebar() {
  const {
    projects,
    activeProject,
    isLoading,
    error,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const { setShowSettings } = useSettings();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? projects.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        )
      : [...projects];

    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'created') return b.createdAt.localeCompare(a.createdAt);
      const timeA = a.lastOpened || a.updatedAt;
      const timeB = b.lastOpened || b.updatedAt;
      return timeB.localeCompare(timeA);
    });
    return list;
  }, [projects, search, sort]);

  async function handleCreate(
    name: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await createProject({ name, description });
    if (res.success) setShowCreate(false);
    return res;
  }

  async function handleUpdate(
    name: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!editTarget) return { success: false, error: 'No project selected for editing' };
    const res = await updateProject({ id: editTarget.id, name, description });
    if (res.success) setEditTarget(null);
    return res;
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteProject(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <>
      <aside className="w-64 shrink-0 flex flex-col bg-surface-1 border-r border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
            Projects
          </span>
          <button
            onClick={() => setShowCreate(true)}
            className="text-text-muted hover:text-accent transition-colors text-base leading-none"
            title="New Project"
            aria-label="Create new project"
          >
            +
          </button>
        </div>

        {/* Search + Sort */}
        <div className="px-3 py-2 space-y-2 border-b border-border">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <div className="flex gap-1">
            {(['updated', 'created', 'name'] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`flex-1 text-[10px] px-1 py-0.5 rounded transition-colors ${
                  sort === key
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {key === 'updated' ? 'Recent' : key === 'created' ? 'Date' : 'A–Z'}
              </button>
            ))}
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {isLoading && (
            <div className="flex justify-center py-6">
              <span className="text-xs text-text-muted animate-pulse">Loading…</span>
            </div>
          )}
          {error && !isLoading && (
            <div className="px-2 py-4 text-xs text-geo-red text-center">{error}</div>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-28 text-text-muted text-xs text-center gap-1.5">
              <span className="text-2xl opacity-20">📂</span>
              {search ? (
                <span>No projects match &quot;{search}&quot;</span>
              ) : (
                <>
                  <span>No projects yet</span>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-accent hover:underline"
                  >
                    Create one to get started
                  </button>
                </>
              )}
            </div>
          )}
          {!isLoading &&
            filtered.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                isActive={activeProject?.id === project.id}
                onSelect={() => selectProject(project.id)}
                onEdit={() => setEditTarget(project)}
                onDelete={() => setDeleteTarget(project)}
              />
            ))}
        </div>

        {/* Tools section — placeholder, disabled */}
        <div className="border-t border-border px-4 py-3">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
            Tools
          </span>
          <div className="mt-2 space-y-1">
            {['Coordinates', 'Polygon', 'Measurements', 'Export'].map((tool) => (
              <div
                key={tool}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-text-muted text-xs opacity-40 cursor-not-allowed select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {tool}
              </div>
            ))}
          </div>
        </div>

        {/* Settings button */}
        <div className="border-t border-border px-4 py-3 flex flex-col gap-2 shrink-0 bg-surface-1">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary hover:bg-surface-3 transition-colors text-xs font-semibold"
          >
            <span>⚙</span> Settings
          </button>
        </div>
      </aside>

      {/* Modals — rendered outside aside to avoid clipping */}
      <ProjectModal
        open={showCreate}
        onConfirm={handleCreate}
        onCancel={() => setShowCreate(false)}
      />
      <ProjectModal
        open={!!editTarget}
        editProject={editTarget}
        onConfirm={handleUpdate}
        onCancel={() => setEditTarget(null)}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        projectName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
