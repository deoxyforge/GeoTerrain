import { useProjectContext } from '../../context/ProjectContext';
import { useCoordinates } from '../../hooks/useCoordinates';
import { truncate } from '../../utils/helpers';

export default function StatusBar() {
  const { activeProject, projects } = useProjectContext();
  const { coordinates, saveStatus } = useCoordinates();

  return (
    <footer className="flex items-center justify-between h-6 px-4 bg-surface-2 border-t border-border shrink-0 text-xs text-text-muted font-mono">
      <div className="flex items-center gap-4">
        <span>{activeProject ? '● Active' : 'Ready'}</span>
        <span className="opacity-40">|</span>
        <span>{activeProject ? truncate(activeProject.name, 24) : 'No project open'}</span>
        {activeProject && (
          <>
            <span className="opacity-40">|</span>
            <span>
              {coordinates.length} point{coordinates.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
        {projects.length > 0 && (
          <>
            <span className="opacity-40">|</span>
            <span>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>WGS84</span>
        <span className="opacity-40">|</span>
        <span
          className={
            saveStatus === 'saving'
              ? 'text-accent animate-pulse font-semibold'
              : 'text-geo-green font-semibold'
          }
        >
          Autosave: {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
        </span>
        <span className="opacity-40">|</span>
        <span>SQLite ✓</span>
      </div>
    </footer>
  );
}
