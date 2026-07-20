import { useReport } from '../../context/ReportContext';
import { useProjectContext } from '../../context/ProjectContext';
import { useCoordinates } from '../../hooks/useCoordinates';
import { useMeasurements } from '../../hooks/useMeasurements';

export default function ReportPreview() {
  const { showPreview, exportPDF, closePreview, isGenerating } = useReport();
  const { activeProject } = useProjectContext();
  const { coordinates } = useCoordinates();
  const { measurements } = useMeasurements();

  if (!showPreview || !activeProject) return null;

  // Helper to map lat/lon into the mini SVG preview box
  const getMiniSvgPath = () => {
    if (!measurements || coordinates.length === 0) return '';
    const bounds = measurements.boundingBox;
    const width = 360;
    const height = 180;
    const padding = 15;

    const latRange = bounds.maxLat - bounds.minLat || 1;
    const lonRange = bounds.maxLon - bounds.minLon || 1;

    const scaleX = (width - padding * 2) / lonRange;
    const scaleY = (height - padding * 2) / latRange;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (width - lonRange * scale) / 2;
    const offsetY = (height - latRange * scale) / 2;

    const points = coordinates.map((c) => {
      const x = offsetX + (c.longitude - bounds.minLon) * scale;
      const y = height - (offsetY + (c.latitude - bounds.minLat) * scale);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')} Z`;
  };

  const handleExportClick = async () => {
    let base64Image: string | undefined;
    try {
      const svgElement = document.getElementById('map-svg-element');
      if (svgElement) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        base64Image = await new Promise<string>((resolve) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 520;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#0f172a'; // match slate-900 background
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/png'));
            } else {
              resolve('');
            }
          };
          img.onerror = () => resolve('');
          img.src = url;
        });
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to capture canvas screenshot:', err);
    }

    await exportPDF(base64Image);
  };

  const centroid = measurements?.centroid;
  const bounds = measurements?.boundingBox;
  const zone = centroid ? Math.floor((centroid.longitude + 180) / 6) + 1 : null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-6 overflow-hidden">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in">
        {/* Modal Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-surface-1">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Project Report Preview</h2>
            <p className="text-[10px] text-text-muted mt-0.5">
              Review formatting and page structures before exporting.
            </p>
          </div>
          <button
            onClick={closePreview}
            disabled={isGenerating}
            className="text-text-muted hover:text-text-primary text-xs transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Styled like white document pages on grey background */}
        <div className="flex-1 overflow-y-auto p-8 bg-surface-3 flex flex-col items-center gap-8">
          {/* PAGE 1: OVERVIEW PAGE */}
          <div className="bg-white text-slate-800 shadow-lg w-[210mm] min-h-[297mm] p-[20mm] box-border flex flex-col font-sans select-none text-[11px] leading-relaxed relative">
            {/* Header logo */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-6 bg-green-500 rounded"></span>
              <span className="font-bold tracking-wider text-slate-900 text-xs uppercase">
                GeoTerrain Analyzer
              </span>
            </div>

            {/* Document Title */}
            <h1 className="text-xl font-bold text-slate-900 uppercase border-b border-slate-200 pb-3 mb-6">
              Project Geospatial Analysis Report
            </h1>

            {/* Project details */}
            <div className="mb-6">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Project Information
              </h2>
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="font-bold py-1.5 w-32">Project Name:</td>
                    <td className="py-1.5 text-slate-700">{activeProject.name}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="font-bold py-1.5 valign-top">Description:</td>
                    <td className="py-1.5 text-slate-700 whitespace-pre-wrap">
                      {activeProject.description || 'No description provided.'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="font-bold py-1.5">Created Date:</td>
                    <td className="py-1.5 text-slate-700">
                      {new Date(activeProject.createdAt).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="font-bold py-1.5">Last Modified:</td>
                    <td className="py-1.5 text-slate-700">
                      {new Date(activeProject.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Polygon mini map vector display */}
            {coordinates.length >= 3 && (
              <div className="mb-6 flex flex-col items-center">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 w-[360px] h-[180px] flex items-center justify-center relative overflow-hidden">
                  <svg width="100%" height="100%" viewBox="0 0 360 180" className="block">
                    <path
                      d={getMiniSvgPath()}
                      fill="rgba(34, 197, 94, 0.15)"
                      stroke="#22c55e"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-500">
                    Vector Boundary Preview
                  </span>
                </div>
              </div>
            )}

            {/* Calculations metrics summary */}
            <div className="mb-6">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Geometry & Calculations
              </h2>
              {measurements ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Calculated Area
                    </div>
                    <div className="font-bold text-slate-800 text-xs mt-1">
                      {measurements.areaSqMeters.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      m²
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {measurements.areaSqKilometers.toFixed(4)} km² |{' '}
                      {measurements.areaHectares.toFixed(3)} ha |{' '}
                      {measurements.areaAcres.toFixed(3)} ac
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Total Perimeter
                    </div>
                    <div className="font-bold text-slate-800 text-xs mt-1">
                      {measurements.perimeterMeters.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      m
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {measurements.perimeterKilometers.toFixed(4)} km
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded p-3 col-span-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Geometric Centroid
                    </div>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      Lat: {centroid?.latitude.toFixed(6)}° , Lon: {centroid?.longitude.toFixed(6)}°
                    </div>
                  </div>
                  {bounds && (
                    <div className="bg-slate-50 border border-slate-100 rounded p-3 col-span-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        Bounding Box Limits
                      </div>
                      <div className="text-slate-800 mt-0.5 font-medium">
                        Min Lat: {bounds.minLat.toFixed(5)}° , Max Lat: {bounds.maxLat.toFixed(5)}°
                      </div>
                      <div className="text-slate-800 font-medium">
                        Min Lon: {bounds.minLon.toFixed(5)}° , Max Lon: {bounds.maxLon.toFixed(5)}°
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-50 border border-slate-100 rounded p-3 col-span-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Projection System
                    </div>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      UTM Zone {zone}
                      {centroid && centroid.latitude >= 0 ? 'N' : 'S'} (WGS84 EPSG:4326 Datum)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-500 font-semibold italic p-3 bg-red-50 border border-red-100 rounded">
                  No valid calculations found.
                </div>
              )}
            </div>

            {/* Cover footer page details */}
            <div className="absolute bottom-10 left-[20mm] right-[20mm] flex justify-between border-t border-slate-150 pt-2 text-[9px] text-slate-400">
              <span>GeoTerrain v1.0.0</span>
              <span>Page 1 of 2</span>
            </div>
          </div>

          {/* PAGE 2: COORDINATES VERTICES PAGE */}
          <div className="bg-white text-slate-800 shadow-lg w-[210mm] min-h-[297mm] p-[20mm] box-border flex flex-col font-sans select-none text-[11px] leading-relaxed relative">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Coordinate Vertices Index
            </h2>
            <div className="flex-1">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                    <th className="p-2 border border-slate-200">Index</th>
                    <th className="p-2 border border-slate-200">Latitude (WGS84)</th>
                    <th className="p-2 border border-slate-200">Longitude (WGS84)</th>
                    <th className="p-2 border border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinates.map((c) => (
                    <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 font-bold">{c.pointOrder}</td>
                      <td className="p-2 border border-slate-200">{c.latitude.toFixed(7)}°</td>
                      <td className="p-2 border border-slate-200">{c.longitude.toFixed(7)}°</td>
                      <td className="p-2 border border-slate-200 text-green-600 font-semibold">
                        Valid Vertex
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vertices page footer */}
            <div className="absolute bottom-10 left-[20mm] right-[20mm] flex justify-between border-t border-slate-150 pt-2 text-[9px] text-slate-400">
              <span>GeoTerrain v1.0.0</span>
              <span>Page 2 of 2</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3 bg-surface-1">
          <button
            onClick={closePreview}
            disabled={isGenerating}
            className="px-4 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary disabled:opacity-40 hover:bg-surface-3 transition-colors text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleExportClick}
            disabled={isGenerating}
            className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isGenerating ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
