import React, { createContext, useContext, useState } from 'react';

interface RenderingContextValue {
  zoom: number;
  pan: { x: number; y: number };
  showLabels: boolean;
  showBoundingBox: boolean;
  showGrid: boolean;
  hoveredVertexId: string | null;
  selectedVertexId: string | null;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setShowLabels: (show: boolean) => void;
  setShowBoundingBox: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setHoveredVertexId: (id: string | null) => void;
  setSelectedVertexId: (id: string | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

const RenderingContext = createContext<RenderingContextValue | null>(null);

export function RenderingProvider({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredVertexId, setHoveredVertexId] = useState<string | null>(null);
  const [selectedVertexId, setSelectedVertexId] = useState<string | null>(null);

  const zoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 20));
  const zoomOut = () => setZoom((prev) => Math.max(prev * 0.8, 0.15));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <RenderingContext.Provider
      value={{
        zoom,
        pan,
        showLabels,
        showBoundingBox,
        showGrid,
        hoveredVertexId,
        selectedVertexId,
        setZoom,
        setPan,
        setShowLabels,
        setShowBoundingBox,
        setShowGrid,
        setHoveredVertexId,
        setSelectedVertexId,
        zoomIn,
        zoomOut,
        resetView,
      }}
    >
      {children}
    </RenderingContext.Provider>
  );
}

export function useRenderingContext() {
  const ctx = useContext(RenderingContext);
  if (!ctx) throw new Error('useRenderingContext must be used inside RenderingProvider');
  return ctx;
}
