import { useReport } from '../../context/ReportContext';
import { useCoordinates } from '../../hooks/useCoordinates';

export default function ReportButton() {
  const { generatePreview, isGenerating } = useReport();
  const { coordinates } = useCoordinates();

  const isDisabled = isGenerating || coordinates.length === 0;

  return (
    <button
      onClick={generatePreview}
      disabled={isDisabled}
      title={
        coordinates.length === 0
          ? 'Add coordinates to generate a project report'
          : 'Generate printable PDF project report'
      }
      className="px-3.5 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-3 transition-colors text-xs font-semibold flex items-center gap-1.5"
    >
      <span>📄</span> Generate Report
    </button>
  );
}
