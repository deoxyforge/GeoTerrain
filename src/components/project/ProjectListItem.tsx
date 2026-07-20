import { useState, type MouseEvent } from 'react';
import type { Project } from '../../types/project';
import ContextMenu from './ContextMenu';

interface Props {
  project: Project;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ProjectListItem({ project, isActive, onSelect, onEdit, onDelete }: Props) {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <button
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
          isActive
            ? 'bg-accent/20 border border-accent/30'
            : 'hover:bg-surface-2 border border-transparent'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs shrink-0 ${isActive ? 'text-accent' : 'text-text-muted'}`}>
              ◆
            </span>
            <span
              className={`text-xs font-medium truncate ${
                isActive ? 'text-accent' : 'text-text-primary'
              }`}
            >
              {project.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCtxMenu({ x: e.clientX, y: e.clientY });
            }}
            className="text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs px-1"
            aria-label="Project options"
          >
            ⋯
          </button>
        </div>
        {project.description && (
          <p className="text-[10px] text-text-muted mt-0.5 ml-4 truncate">{project.description}</p>
        )}
        <p className="text-[10px] text-text-muted mt-0.5 ml-4">
          {formatRelative(project.updatedAt)}
        </p>
      </button>

      <ContextMenu
        open={!!ctxMenu}
        x={ctxMenu?.x ?? 0}
        y={ctxMenu?.y ?? 0}
        onClose={() => setCtxMenu(null)}
        items={[
          { label: 'Open', onClick: onSelect },
          { label: 'Edit / Rename', onClick: onEdit },
          { label: 'Delete', danger: true, onClick: onDelete },
        ]}
      />
    </>
  );
}
