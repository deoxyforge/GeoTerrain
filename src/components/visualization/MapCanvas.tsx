import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useCoordinates } from '../../hooks/useCoordinates';
import { useGeometry } from '../../hooks/useGeometry';
import { useRendering } from '../../hooks/useRendering';
import { useImportExport } from '../../context/ImportExportContext';
import { useSettings } from '../../context/SettingsContext';
import { toProjected, getUtmZone } from '../../utils/projection';

interface MapCanvasProps {
  onAddPoint: () => void;
}

export default function MapCanvas({ onAddPoint }: MapCanvasProps) {
  const { coordinates } = useCoordinates();
  const { geometry } = useGeometry();
  const { importData } = useImportExport();
  const { settings, updateSetting } = useSettings();
  const {
    zoom,
    pan,
    showBoundingBox,
    hoveredVertexId,
    selectedVertexId,
    setZoom,
    setPan,
    setHoveredVertexId,
    setSelectedVertexId,
    zoomIn,
    zoomOut,
    resetView,
    setShowBoundingBox,
  } = useRendering();

  const showGrid = settings.gridVisibility;
  const showLabels = settings.vertexLabels;

  const setShowGrid = useCallback(
    (val: boolean) => {
      updateSetting('gridVisibility', val);
    },
    [updateSetting]
  );

  const setShowLabels = useCallback(
    (val: boolean) => {
      updateSetting('vertexLabels', val);
    },
    [updateSetting]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(100, entry.contentRect.width),
          height: Math.max(100, entry.contentRect.height),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute projection parameters based on coordinates WGS84 bounds
  const projData = useMemo(() => {
    if (coordinates.length === 0) return null;

    let minLat = Infinity,
      maxLat = -Infinity;
    let minLon = Infinity,
      maxLon = -Infinity;
    let sumLat = 0,
      sumLon = 0;

    coordinates.forEach((c) => {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLon) minLon = c.longitude;
      if (c.longitude > maxLon) maxLon = c.longitude;
      sumLat += c.latitude;
      sumLon += c.longitude;
    });

    const centerLat = sumLat / coordinates.length;
    const centerLon = sumLon / coordinates.length;

    // Project all coordinates to local cartesian coordinates
    const projectedCoords = coordinates.map((c) => ({
      id: c.id,
      pointOrder: c.pointOrder,
      lat: c.latitude,
      lon: c.longitude,
      ...toProjected(c.latitude, c.longitude, centerLat),
    }));

    // Find local projected bounds
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    projectedCoords.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const centerProjX = (minX + maxX) / 2;
    const centerProjY = (minY + maxY) / 2;

    const widthProj = Math.max(1, maxX - minX);
    const heightProj = Math.max(1, maxY - minY);

    return {
      coords: projectedCoords,
      centerLat,
      centerLon,
      centerProjX,
      centerProjY,
      widthProj,
      heightProj,
      minLat,
      maxLat,
      minLon,
      maxLon,
      minX,
      maxX,
      minY,
      maxY,
    };
  }, [coordinates]);

  // Compute the scale to fit the polygon inside the viewport with a padding of 50px
  const baseScale = useMemo(() => {
    if (!projData) return 1;
    const padding = 80;
    const scaleX = (dimensions.width - padding) / projData.widthProj;
    const scaleY = (dimensions.height - padding) / projData.heightProj;
    return Math.min(scaleX, scaleY);
  }, [projData, dimensions]);

  // Helper to map projected local meters to SVG screen coordinates
  const toScreen = useCallback(
    (x: number, y: number) => {
      if (!projData) return { cx: 0, cy: 0 };
      const cx = dimensions.width / 2 + (x - projData.centerProjX) * baseScale * zoom + pan.x;
      // Invert Y axis for screen mapping
      const cy = dimensions.height / 2 - (y - projData.centerProjY) * baseScale * zoom + pan.y;
      return { cx, cy };
    },
    [projData, baseScale, zoom, pan, dimensions]
  );

  // Convert bounding box corners to screen coordinates
  const boundingBoxRect = useMemo(() => {
    if (!projData) return null;
    const pMin = toScreen(projData.minX, projData.minY);
    const pMax = toScreen(projData.maxX, projData.maxY);

    const x = Math.min(pMin.cx, pMax.cx);
    const y = Math.min(pMin.cy, pMax.cy);
    const w = Math.abs(pMin.cx - pMax.cx);
    const h = Math.abs(pMin.cy - pMax.cy);

    return { x, y, w, h };
  }, [projData, toScreen]);

  // Calculate polygon centroid screen coordinates (Plate Carree centered)
  const centroidScreen = useMemo(() => {
    if (!projData || coordinates.length === 0) return null;
    let sumLat = 0,
      sumLon = 0;
    coordinates.forEach((c) => {
      sumLat += c.latitude;
      sumLon += c.longitude;
    });
    const avgLat = sumLat / coordinates.length;
    const avgLon = sumLon / coordinates.length;

    const projected = toProjected(avgLat, avgLon, projData.centerLat);
    return toScreen(projected.x, projected.y);
  }, [projData, coordinates, toScreen]);

  // Handlers for canvas panning via dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(Math.max(0.15, Math.min(20, zoom * factor)));
  };

  // SVG Polygon Points String
  const polygonPointsStr = useMemo(() => {
    if (!projData || projData.coords.length < 3) return '';
    return projData.coords
      .map((p) => {
        const screen = toScreen(p.x, p.y);
        return `${screen.cx},${screen.cy}`;
      })
      .join(' ');
  }, [projData, toScreen]);

  return (
    <div className="flex flex-col h-full bg-surface-3 border border-border rounded-xl overflow-hidden shadow-inner select-none relative">
      {/* Top Canvas Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex gap-1 bg-surface-1/90 backdrop-blur border border-border p-1 rounded-lg shadow-md">
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-3 text-text-primary text-sm font-semibold transition-colors"
        >
          ＋
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-3 text-text-primary text-sm font-semibold transition-colors"
        >
          －
        </button>
        <button
          onClick={resetView}
          title="Reset View"
          className="px-2 h-7 flex items-center justify-center rounded hover:bg-surface-3 text-text-primary text-[10px] font-semibold transition-colors uppercase tracking-wider"
        >
          Reset
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-surface-1/90 backdrop-blur border border-border p-1.5 rounded-lg shadow-md text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="rounded border-border text-accent focus:ring-0 cursor-pointer bg-surface-2"
          />
          Labels
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
          <input
            type="checkbox"
            checked={showBoundingBox}
            onChange={(e) => setShowBoundingBox(e.target.checked)}
            className="rounded border-border text-accent focus:ring-0 cursor-pointer bg-surface-2"
          />
          Bounds
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="rounded border-border text-accent focus:ring-0 cursor-pointer bg-surface-2"
          />
          Grid
        </label>
      </div>

      {/* Main SVG Canvas viewport container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 relative outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <svg
          id="map-svg-element"
          width="100%"
          height="100%"
          className="absolute inset-0 block overflow-hidden"
          style={{ pointerEvents: 'auto' }}
        >
          <defs>
            {/* Grid Pattern definition */}
            <pattern
              id="gridPattern"
              width={40 * zoom}
              height={40 * zoom}
              patternUnits="userSpaceOnUse"
              x={pan.x}
              y={pan.y}
            >
              <path
                d={`M ${40 * zoom} 0 L 0 0 0 ${40 * zoom}`}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="0.5"
                opacity="0.12"
              />
            </pattern>
          </defs>

          {/* Grid Background Layer */}
          {showGrid && (
            <rect
              width="100%"
              height="100%"
              fill="url(#gridPattern)"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Bounding Box layer */}
          {showBoundingBox && boundingBoxRect && (
            <rect
              x={boundingBoxRect.x}
              y={boundingBoxRect.y}
              width={boundingBoxRect.w}
              height={boundingBoxRect.h}
              fill="none"
              stroke="var(--color-accent)"
              strokeDasharray="4 4"
              strokeWidth="1"
              opacity="0.25"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Polygon Geometry Outline and Fill layer */}
          {geometry && polygonPointsStr && (
            <polygon
              points={polygonPointsStr}
              fill="url(#polyGrad)"
              className="fill-accent/10 stroke-accent stroke-[1.5]"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Polygon Centroid Indicator Layer */}
          {geometry && centroidScreen && (
            <g style={{ pointerEvents: 'none' }}>
              <circle
                cx={centroidScreen.cx}
                cy={centroidScreen.cy}
                r="6"
                fill="none"
                stroke="var(--color-geo-green)"
                strokeWidth="1"
                opacity="0.75"
                className="animate-pulse"
              />
              <line
                x1={centroidScreen.cx - 10}
                y1={centroidScreen.cy}
                x2={centroidScreen.cx + 10}
                y2={centroidScreen.cy}
                stroke="var(--color-geo-green)"
                strokeWidth="0.75"
                opacity="0.6"
              />
              <line
                x1={centroidScreen.cx}
                y1={centroidScreen.cy - 10}
                x2={centroidScreen.cx}
                y2={centroidScreen.cy + 10}
                stroke="var(--color-geo-green)"
                strokeWidth="0.75"
                opacity="0.6"
              />
            </g>
          )}

          {/* Vertex Nodes Layer */}
          {projData &&
            projData.coords.map((p) => {
              const screen = toScreen(p.x, p.y);
              const isHovered = hoveredVertexId === p.id;
              const isSelected = selectedVertexId === p.id;

              return (
                <g key={p.id}>
                  {/* Outer vertex hover target glow circle */}
                  <circle
                    cx={screen.cx}
                    cy={screen.cy}
                    r={isHovered || isSelected ? 10 : 7}
                    fill="var(--color-surface-1)"
                    stroke={
                      isHovered
                        ? 'var(--color-accent)'
                        : isSelected
                          ? 'var(--color-geo-green)'
                          : 'var(--color-border)'
                    }
                    strokeWidth={isHovered || isSelected ? 2 : 1}
                    className="transition-all duration-100 ease-out cursor-pointer"
                    onMouseEnter={() => setHoveredVertexId(p.id)}
                    onMouseLeave={() => setHoveredVertexId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVertexId(isSelected ? null : p.id);
                    }}
                  />
                  {/* Vertex Center dot */}
                  <circle
                    cx={screen.cx}
                    cy={screen.cy}
                    r="2.5"
                    fill={
                      isHovered || isSelected
                        ? 'var(--color-accent)'
                        : 'var(--color-text-secondary)'
                    }
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Vertex Point Order Number tag */}
                  <text
                    x={screen.cx}
                    y={screen.cy - 12}
                    textAnchor="middle"
                    fill="var(--color-text-primary)"
                    fontSize="9px"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    #{p.pointOrder}
                  </text>
                  {/* Coordinate WGS84 label text if toggled */}
                  {showLabels && (
                    <text
                      x={screen.cx + 12}
                      y={screen.cy + 3}
                      fill="var(--color-text-secondary)"
                      fontSize="8px"
                      fontFamily="monospace"
                      style={{ pointerEvents: 'none' }}
                      opacity={isHovered || isSelected ? 1 : 0.65}
                    >
                      {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
                    </text>
                  )}
                </g>
              );
            })}

          {/* North Arrow Compass Indicator Overlay */}
          {settings.northArrow && (
            <g
              transform={`translate(${dimensions.width - 50}, 50)`}
              className="pointer-events-none select-none opacity-85"
            >
              <circle
                r="20"
                fill="var(--color-surface-1)"
                stroke="var(--color-border)"
                strokeWidth="1.5"
              />
              {/* Compass ticks */}
              <line y1="-20" y2="-17" stroke="var(--color-text-muted)" strokeWidth="1" />
              <line y1="17" y2="20" stroke="var(--color-text-muted)" strokeWidth="1" />
              <line x1="-20" x2="-17" stroke="var(--color-text-muted)" strokeWidth="1" />
              <line x1="17" x2="20" stroke="var(--color-text-muted)" strokeWidth="1" />
              {/* North Arrow pointer */}
              <polygon points="0,-16 5,0 0,-3" fill="var(--color-geo-red)" />
              <polygon points="0,-3 5,0 0,16" fill="var(--color-text-muted)" />
              <polygon points="0,-16 -5,0 0,-3" fill="var(--color-geo-red)" opacity="0.8" />
              <polygon points="0,-3 -5,0 0,16" fill="var(--color-text-muted)" opacity="0.8" />
              {/* Compass label */}
              <text
                y="-22"
                textAnchor="middle"
                fill="var(--color-geo-red)"
                fontSize="9px"
                fontWeight="bold"
              >
                N
              </text>
            </g>
          )}
        </svg>

        {/* Dynamic canvas metadata/origin stats details overlay (bottom right) */}
        {projData && (
          <div className="absolute bottom-4 left-4 z-10 bg-surface-1/80 backdrop-blur border border-border px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-text-muted select-none">
            <div>
              Center Origin: {projData.centerLat.toFixed(5)}°, {projData.centerLon.toFixed(5)}°
            </div>
            <div>CRS UTM Zone: {getUtmZone(projData.centerLon)}N</div>
            <div>Aspect Ratio Corrected: Equirectangular Local Projection</div>
          </div>
        )}

        {/* Empty Canvas visual backdrop overlay */}
        {coordinates.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-3/95 z-10 p-6 text-center select-none">
            <span className="text-5xl opacity-15 mb-3">⬡</span>
            <h3 className="text-sm font-semibold text-text-primary mb-1">No polygon loaded</h3>
            <p className="text-xs text-text-muted max-w-xs mb-4 leading-relaxed">
              Create or import coordinate points to display the land boundary.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => importData('json')}
                className="px-3.5 py-1.5 rounded-lg bg-surface-2 border border-border text-text-secondary hover:bg-surface-3 transition-colors text-xs font-semibold"
              >
                Import Data
              </button>
              <button
                onClick={onAddPoint}
                className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors"
              >
                Add Coordinates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
