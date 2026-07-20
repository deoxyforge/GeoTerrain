import { useState, useMemo, useRef, useEffect } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { useCoordinates } from '../hooks/useCoordinates';
import { useGeometry } from '../hooks/useGeometry';
import { useMeasurements } from '../hooks/useMeasurements';
import { useRendering } from '../hooks/useRendering';
import { useImportExport } from '../context/ImportExportContext';
import { useReport } from '../context/ReportContext';
import { formatDate } from '../utils/helpers';
import CoordinateModal from '../components/coordinate/CoordinateModal';
import ConfirmDeleteCoordinateDialog from '../components/coordinate/ConfirmDeleteCoordinateDialog';
import MapCanvas from '../components/visualization/MapCanvas';
import Notification from '../components/common/Notification';
import ReportButton from '../components/common/ReportButton';
import ReportPreview from '../components/report/ReportPreview';
import type { Coordinate } from '../types/coordinate';
import type { ValidationError } from '../types/validation';

export default function WorkspacePage() {
  const { activeProject } = useProjectContext();
  const {
    coordinates,
    isLoading: coordsLoading,
    error: coordsError,
    validationResult,
    addCoordinate,
    updateCoordinate,
    deleteCoordinate,
    moveCoordinate,
  } = useCoordinates();

  const { geometry, error: geomError } = useGeometry();
  const { measurements, isLoading: measLoading, error: measError } = useMeasurements();
  const { hoveredVertexId, selectedVertexId, setHoveredVertexId, setSelectedVertexId } =
    useRendering();

  const { isOperating, successMessage, errorMessage, clearNotifications, importData, exportData } =
    useImportExport();

  const {
    isGenerating,
    error: reportError,
    success: reportSuccess,
    clearNotifications: clearReportNotifications,
  } = useReport();

  // Dropdown visibility states
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const importRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (importRef.current && !importRef.current.contains(event.target as Node)) {
        setImportMenuOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Coordinate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coordinate | null>(null);

  // Group validation errors by itemId for fast lookup
  const errorsMap = useMemo(() => {
    const map = new Map<string, ValidationError[]>();
    if (validationResult?.errors) {
      validationResult.errors.forEach((err) => {
        if (err.itemId) {
          const list = map.get(err.itemId) || [];
          list.push(err);
          map.set(err.itemId, list);
        }
      });
    }
    return map;
  }, [validationResult]);

  // Group validation warnings by itemId
  const warningsMap = useMemo(() => {
    const map = new Map<string, ValidationError[]>();
    if (validationResult?.warnings) {
      validationResult.warnings.forEach((warn) => {
        if (warn.itemId) {
          const list = map.get(warn.itemId) || [];
          list.push(warn);
          map.set(warn.itemId, list);
        }
      });
    }
    return map;
  }, [validationResult]);

  // Determine if the coordinates can form a valid polygon
  const isPolygonValid = !!validationResult?.valid && coordinates.length >= 3;

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
        <div className="text-center space-y-3">
          <div className="text-6xl opacity-10">⬡</div>
          <h1 className="text-xl font-semibold text-text-primary">GeoTerrain Analyzer</h1>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Create or select a project in the sidebar to begin entering GPS coordinates and
            analyzing your terrain polygon.
          </p>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap justify-center">
          {['Offline', 'WGS84', 'Turf.js', 'SQLite'].map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-xs text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  async function handleModalConfirm(
    latitude: number,
    longitude: number
  ): Promise<{ success: boolean; error?: string }> {
    if (editTarget) {
      const res = await updateCoordinate(editTarget.id, latitude, longitude);
      if (res.success) setEditTarget(null);
      return res;
    } else {
      const res = await addCoordinate(latitude, longitude);
      if (res.success) setModalOpen(false);
      return res;
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteCoordinate(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface">
      {/* Project Header Banner */}
      <div className="border-b border-border px-8 py-5 flex items-center justify-between gap-4 bg-surface-1 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-accent text-sm">◆</span>
            <h1 className="text-base font-semibold text-text-primary truncate">
              {activeProject.name}
            </h1>
          </div>
          {activeProject.description && (
            <p className="text-xs text-text-secondary ml-4 max-w-2xl truncate">
              {activeProject.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Import Dropdown */}
          <div ref={importRef} className="relative">
            <button
              onClick={() => setImportMenuOpen((prev) => !prev)}
              disabled={isOperating}
              className="px-3.5 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-3 transition-colors text-xs font-semibold flex items-center gap-1"
            >
              Import <span className="text-[9px] opacity-70">▼</span>
            </button>
            {importMenuOpen && (
              <div className="absolute right-0 mt-1.5 z-30 bg-surface-1 border border-border shadow-lg rounded-lg py-1 w-44 text-xs font-medium text-text-secondary">
                <button
                  onClick={() => {
                    setImportMenuOpen(false);
                    importData('csv');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-2 hover:text-text-primary transition-colors"
                >
                  Import CSV
                </button>
                <button
                  onClick={() => {
                    setImportMenuOpen(false);
                    importData('geojson');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-2 hover:text-text-primary transition-colors"
                >
                  Import GeoJSON
                </button>
                <button
                  onClick={() => {
                    setImportMenuOpen(false);
                    importData('json');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-2 hover:text-text-primary transition-colors border-t border-border"
                >
                  Import JSON Project
                </button>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportMenuOpen((prev) => !prev)}
              disabled={isOperating || coordinates.length === 0}
              title={coordinates.length === 0 ? 'No coordinates to export' : 'Export project data'}
              className="px-3.5 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-3 transition-colors text-xs font-semibold flex items-center gap-1"
            >
              Export <span className="text-[9px] opacity-70">▼</span>
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 z-30 bg-surface-1 border border-border shadow-lg rounded-lg py-1 w-44 text-xs font-medium text-text-secondary">
                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    exportData('csv');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-2 hover:text-text-primary transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    exportData('geojson');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-2 hover:text-text-primary transition-colors"
                >
                  Export GeoJSON
                </button>
                <button
                  onClick={() => {
                    setExportMenuOpen(false);
                    exportData('json');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-2 hover:text-text-primary transition-colors border-t border-border"
                >
                  Export JSON Project
                </button>
              </div>
            )}
          </div>

          <ReportButton />

          <button
            disabled={!isPolygonValid}
            title={
              isPolygonValid
                ? 'Analyze boundary polygon calculations'
                : 'Resolve validation errors to analyze polygon'
            }
            className="px-3.5 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-3 transition-colors text-xs font-semibold tracking-wide"
          >
            Analyze Polygon
          </button>
          <button
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold tracking-wide transition-colors flex items-center gap-1.5"
          >
            <span>＋</span> Add Coordinate
          </button>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="flex-1 overflow-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Map Canvas Visualizer + Coordinate Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Visualizer Panel (Main Focus) */}
          <div className="h-[380px] shrink-0">
            <MapCanvas
              onAddPoint={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}
            />
          </div>

          <div className="flex-1 space-y-4 min-h-[250px]">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Coordinate Vertices
            </h2>

            {coordsError && (
              <div className="bg-geo-red/10 border border-geo-red/20 rounded-lg p-3 text-xs text-geo-red">
                {coordsError}
              </div>
            )}

            {coordsLoading && coordinates.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <span className="text-xs text-text-muted animate-pulse">Loading coordinates…</span>
              </div>
            ) : coordinates.length === 0 ? (
              /* Empty Coordinates State */
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl p-8 text-center bg-surface-1/50 select-none">
                <span className="text-3xl opacity-20 mb-2">📍</span>
                <h3 className="text-xs font-semibold text-text-primary mb-1">No coordinates yet</h3>
                <p className="text-[11px] text-text-muted max-w-xs mb-3 leading-relaxed">
                  Add latitude and longitude vertices to build your land boundary. At least three
                  points are required to construct a valid GIS polygon.
                </p>
                <button
                  onClick={() => {
                    setEditTarget(null);
                    setModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border text-[11px] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors font-medium"
                >
                  Add First Point
                </button>
              </div>
            ) : (
              /* Coordinate Grid/Table */
              <div className="bg-surface-1 border border-border rounded-xl overflow-hidden shadow-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-2/60 border-b border-border text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                      <th className="py-2.5 px-4 w-24">Point</th>
                      <th className="py-2.5 px-4">Latitude</th>
                      <th className="py-2.5 px-4">Longitude</th>
                      <th className="py-2.5 px-4 w-40 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-text-primary">
                    {coordinates.map((coord, idx) => {
                      const rowErrors = errorsMap.get(coord.id) || [];
                      const rowWarnings = warningsMap.get(coord.id) || [];
                      const hasRowError = rowErrors.length > 0;
                      const hasRowWarning = rowWarnings.length > 0;

                      const isLatInvalid = rowErrors.some((e) => e.field === 'latitude');
                      const isLonInvalid = rowErrors.some((e) => e.field === 'longitude');

                      const isHovered = hoveredVertexId === coord.id;
                      const isSelected = selectedVertexId === coord.id;

                      return (
                        <tr
                          key={coord.id}
                          className={`transition-colors cursor-pointer ${
                            isHovered
                              ? 'bg-accent/10 border-l-2 border-l-accent'
                              : isSelected
                                ? 'bg-geo-green/10 border-l-2 border-l-geo-green'
                                : hasRowError
                                  ? 'bg-geo-red/5 hover:bg-geo-red/10 border-l-2 border-l-geo-red'
                                  : hasRowWarning
                                    ? 'bg-geo-yellow/5 hover:bg-geo-yellow/10 border-l-2 border-l-geo-yellow'
                                    : 'hover:bg-surface-2/30'
                          }`}
                          onMouseEnter={() => setHoveredVertexId(coord.id)}
                          onMouseLeave={() => setHoveredVertexId(null)}
                          onClick={() => setSelectedVertexId(isSelected ? null : coord.id)}
                        >
                          <td className="py-2 px-4 font-mono font-medium flex items-center gap-1.5">
                            <span className={hasRowError ? 'text-geo-red' : 'text-accent'}>
                              #{coord.pointOrder}
                            </span>
                            {hasRowError && (
                              <span
                                className="text-geo-red cursor-help text-[10px]"
                                title={rowErrors.map((e) => e.message).join('\n')}
                              >
                                ⚠
                              </span>
                            )}
                            {!hasRowError && hasRowWarning && (
                              <span
                                className="text-geo-yellow cursor-help text-[10px]"
                                title={rowWarnings.map((w) => w.message).join('\n')}
                              >
                                ⚠
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-2 px-4 font-mono ${isLatInvalid ? 'text-geo-red font-semibold' : ''}`}
                          >
                            {coord.latitude.toFixed(6)}
                          </td>
                          <td
                            className={`py-2 px-4 font-mono ${isLonInvalid ? 'text-geo-red font-semibold' : ''}`}
                          >
                            {coord.longitude.toFixed(6)}
                          </td>
                          <td
                            className="py-2 px-4 text-right space-x-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => moveCoordinate(coord.id, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                              className="p-1 rounded hover:bg-surface-3 disabled:opacity-20 text-text-secondary hover:text-text-primary transition-colors disabled:pointer-events-none"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveCoordinate(coord.id, 'down')}
                              disabled={idx === coordinates.length - 1}
                              title="Move Down"
                              className="p-1 rounded hover:bg-surface-3 disabled:opacity-20 text-text-secondary hover:text-text-primary transition-colors disabled:pointer-events-none"
                            >
                              ▼
                            </button>
                            <button
                              onClick={() => setEditTarget(coord)}
                              title="Edit Vertex"
                              className="px-2 py-1 rounded hover:bg-surface-3 text-text-secondary hover:text-accent transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(coord)}
                              title="Delete Vertex"
                              className="px-2 py-1 rounded hover:bg-surface-3 text-text-secondary hover:text-geo-red transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Summary Panels */}
        <div className="space-y-6">
          {/* Validation Status Panel */}
          {validationResult && coordinates.length > 0 && (
            <div className="space-y-4">
              {!validationResult.valid ? (
                <div className="border border-geo-red/20 bg-geo-red/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-geo-red text-xs font-semibold uppercase tracking-wider">
                    <span>⚠</span> Invalid Polygon Boundary
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1 list-disc pl-5">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err.message}</li>
                    ))}
                  </ul>
                </div>
              ) : validationResult.warnings && validationResult.warnings.length > 0 ? (
                <div className="border border-geo-yellow/20 bg-geo-yellow/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-geo-yellow text-xs font-semibold uppercase tracking-wider">
                    <span>⚠</span> Boundary Warnings
                  </div>
                  <ul className="text-xs text-text-secondary space-y-1 list-disc pl-5">
                    {validationResult.warnings.map((warn, i) => (
                      <li key={i}>{warn.message}</li>
                    ))}
                  </ul>
                </div>
              ) : coordinates.length >= 3 ? (
                <div className="border border-geo-green/20 bg-geo-green/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-geo-green text-xs font-semibold uppercase tracking-wider">
                    <span>✓</span> Valid Boundary Polygon
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    All coordinates are valid and ready for calculations.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Polygon Summary Card */}
          <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Polygon Summary
            </h2>

            <div className="space-y-3.5">
              {/* Vertex Count */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Vertex Count</span>
                <span className="font-mono font-semibold text-text-primary">
                  {geometry ? `${geometry.vertexCount} vertices` : `${coordinates.length} points`}
                </span>
              </div>

              {/* Polygon Status */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Polygon Status</span>
                {geometry ? (
                  <span className="px-2 py-0.5 rounded-full bg-geo-green/10 border border-geo-green/20 text-geo-green font-medium text-[10px]">
                    Closed & Valid
                  </span>
                ) : coordinates.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-geo-red/10 border border-geo-red/20 text-geo-red font-medium text-[10px]">
                    Invalid / Open
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-muted font-medium text-[10px]">
                    Empty
                  </span>
                )}
              </div>

              {/* Geometry Ready */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Geometry Ready</span>
                {geometry ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-[10px]">
                    Ready
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-muted font-medium text-[10px]">
                    Not Ready
                  </span>
                )}
              </div>

              {/* Closed Ring List */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-xs text-text-secondary block">Closed Ring Path</span>
                {geometry ? (
                  <div className="bg-surface-2 border border-border rounded-lg p-3 text-[10px] font-mono leading-relaxed max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {geometry.closedRing.map((c, i) => {
                        const isClosing = i === geometry.closedRing.length - 1;
                        return (
                          <span key={c.id} className="inline-flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                isClosing
                                  ? 'bg-accent/15 text-accent'
                                  : 'bg-surface-3 text-text-primary'
                              }`}
                              title={`[${c.longitude.toFixed(5)}, ${c.latitude.toFixed(5)}]`}
                            >
                              #{c.pointOrder}
                            </span>
                            {i < geometry.closedRing.length - 1 && (
                              <span className="text-text-muted">➔</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-2 border border-border border-dashed rounded-lg p-4 text-[10px] text-text-muted font-mono text-center">
                    Waiting for valid polygon boundary
                  </div>
                )}
              </div>

              {geomError && (
                <div className="text-[10px] text-geo-red bg-geo-red/5 border border-geo-red/10 rounded-lg p-2 mt-2">
                  {geomError}
                </div>
              )}
            </div>
          </div>

          {/* Measurement Summary Card */}
          <div className="bg-surface-1 border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Measurement Summary
              </h2>
              {measLoading && (
                <span className="text-[10px] text-accent animate-pulse">Calculating…</span>
              )}
            </div>

            {measurements ? (
              <div className="space-y-4 text-xs">
                {/* Area Metrics */}
                <div className="space-y-2">
                  <span className="text-text-muted font-medium text-[10px] uppercase tracking-wider">
                    Polygon Area
                  </span>
                  <div className="grid grid-cols-2 gap-2 bg-surface-2 border border-border rounded-lg p-2.5 font-mono">
                    <div>
                      <div className="text-[10px] text-text-muted">Square Meters</div>
                      <div className="text-text-primary text-[11px] font-semibold">
                        {measurements.areaSqMeters.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}{' '}
                        m²
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted">Hectares</div>
                      <div className="text-text-primary text-[11px] font-semibold">
                        {measurements.areaHectares.toFixed(4)} ha
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-border/40">
                      <div className="text-[10px] text-text-muted">Square Kilometers</div>
                      <div className="text-text-primary text-[11px] font-semibold">
                        {measurements.areaSqKilometers.toFixed(4)} km²
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-border/40">
                      <div className="text-[10px] text-text-muted">Acres</div>
                      <div className="text-text-primary text-[11px] font-semibold">
                        {measurements.areaAcres.toFixed(4)} ac
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perimeter Metrics */}
                <div className="space-y-2">
                  <span className="text-text-muted font-medium text-[10px] uppercase tracking-wider">
                    Polygon Perimeter
                  </span>
                  <div className="grid grid-cols-2 gap-2 bg-surface-2 border border-border rounded-lg p-2.5 font-mono">
                    <div>
                      <div className="text-[10px] text-text-muted">Meters</div>
                      <div className="text-text-primary text-[11px] font-semibold">
                        {measurements.perimeterMeters.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}{' '}
                        m
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted">Kilometers</div>
                      <div className="text-text-primary text-[11px] font-semibold">
                        {measurements.perimeterKilometers.toFixed(4)} km
                      </div>
                    </div>
                  </div>
                </div>

                {/* Centroid Coordinates */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex justify-between items-center text-[10px] text-text-secondary uppercase tracking-wider">
                    <span>Centroid (WGS84)</span>
                  </div>
                  <div className="bg-surface-2 border border-border rounded-lg p-2.5 font-mono text-[10px] leading-relaxed flex justify-between">
                    <div>
                      <span className="text-text-muted">Lat: </span>
                      <span className="font-semibold text-text-primary">
                        {measurements.centroid.latitude.toFixed(6)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Lon: </span>
                      <span className="font-semibold text-text-primary">
                        {measurements.centroid.longitude.toFixed(6)}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bounding Box coordinates */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider block">
                    Bounding Box (WGS84)
                  </span>
                  <div className="bg-surface-2 border border-border rounded-lg p-2.5 font-mono text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 text-center">
                    <div className="text-left">
                      <span className="text-text-muted">Min Lat: </span>
                      <span className="text-text-primary font-semibold">
                        {measurements.boundingBox.minLat.toFixed(5)}°
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-text-muted">Max Lat: </span>
                      <span className="text-text-primary font-semibold">
                        {measurements.boundingBox.maxLat.toFixed(5)}°
                      </span>
                    </div>
                    <div className="text-left border-t border-border/20 pt-1">
                      <span className="text-text-muted">Min Lon: </span>
                      <span className="text-text-primary font-semibold">
                        {measurements.boundingBox.minLon.toFixed(5)}°
                      </span>
                    </div>
                    <div className="text-left border-t border-border/20 pt-1">
                      <span className="text-text-muted">Max Lon: </span>
                      <span className="text-text-primary font-semibold">
                        {measurements.boundingBox.maxLon.toFixed(5)}°
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-2 border border-border border-dashed rounded-lg p-4 text-[10px] text-text-muted font-mono text-center">
                {measError ? (
                  <span className="text-geo-red">{measError}</span>
                ) : (
                  'Waiting for valid polygon geometry'
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Footer Metadata Panel */}
      <footer className="border-t border-border px-8 py-3 bg-surface-1/40 flex justify-between text-[10px] text-text-muted shrink-0">
        <div className="flex gap-4">
          <span>Created: {formatDate(activeProject.createdAt)}</span>
          <span>Modified: {formatDate(activeProject.updatedAt)}</span>
        </div>
        <div>
          <span>ID: {activeProject.id}</span>
        </div>
      </footer>

      {/* Coordinate Entry / Edit Modal */}
      <CoordinateModal
        open={modalOpen || !!editTarget}
        editCoordinate={editTarget}
        onConfirm={handleModalConfirm}
        onCancel={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteCoordinateDialog
        open={!!deleteTarget}
        pointNumber={deleteTarget?.pointOrder ?? 0}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Report Preview Modal */}
      <ReportPreview />

      {/* Toast Notifications */}
      {successMessage && (
        <Notification message={successMessage} type="success" onClose={clearNotifications} />
      )}
      {errorMessage && (
        <Notification message={errorMessage} type="error" onClose={clearNotifications} />
      )}
      {reportSuccess && (
        <Notification message={reportSuccess} type="success" onClose={clearReportNotifications} />
      )}
      {reportError && (
        <Notification message={reportError} type="error" onClose={clearReportNotifications} />
      )}

      {/* Loading Overlay */}
      {isOperating && (
        <div className="fixed inset-0 bg-surface-3/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3.5 pointer-events-auto">
          <div className="w-9 h-9 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold tracking-wider text-text-primary uppercase">
            Processing...
          </p>
        </div>
      )}
      {isGenerating && (
        <div className="fixed inset-0 bg-surface-3/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3.5 pointer-events-auto">
          <div className="w-9 h-9 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold tracking-wider text-text-primary uppercase">
            Generating Report...
          </p>
        </div>
      )}
    </div>
  );
}
