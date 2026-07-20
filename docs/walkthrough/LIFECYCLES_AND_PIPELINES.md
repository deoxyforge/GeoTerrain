# Lifecycles & Pipelines Walkthrough

This document outlines the workflows, lifecycles, and backend processing pipelines of GeoTerrain Analyzer v1.0.0.

---

## 1. User Workflow

The end-to-end user workflow is structured as follows:

```mermaid
graph TD
  Start([Launch GeoTerrain]) --> Select{Has Last Project?}
  Select -->|Yes| Load[Load Last Opened Project]
  Select -->|No| Create[Create New Project]
  Load --> Editor[Add / Import Coordinates]
  Create --> Editor
  Editor --> Validate{Validation Engine check}
  Validate -->|Invalid| Alert[Show Warning & Highlight Segments]
  Alert --> Editor
  Validate -->|Valid| Draw[Renders closed Polygon on MapCanvas]
  Draw --> Calc[Compute UTM Area & Perimeter]
  Calc --> Action{User Action}
  Action -->|Export| File[Export CSV / GeoJSON / Native JSON]
  Action -->|Report| Preview[Open Print Preview Dashboard]
  Preview --> PDF[Generate Printable PDF Report]
```

---

## 2. Project Lifecycle

Projects transition through the following states:

```mermaid
stateDiagram-v2
  [*] --> Created : Create Modal Confirm
  Created --> Loaded : Select Project / Restore Startup
  Loaded --> Modified : Add / Delete Coordinates
  Modified --> Validated : Coordinates Valid
  Modified --> Invalidated : Coordinates Invalid
  Validated --> Closed : Select another Project / Exit
  Invalidated --> Closed : Select another Project / Exit
  Loaded --> Deleted : Right-Click Context Menu Delete
  Closed --> [*]
  Deleted --> [*]
```

---

## 3. Coordinate Lifecycle

Each coordinate vertex transitions through states from creation to sync:

```mermaid
stateDiagram-v2
  [*] --> Entered : User Lat/Lon Input
  Entered --> Validated : Validation Engine Checks Pass
  Validated --> Saved : SQLite Insert Succeeded
  Saved --> Reordered : Move Up / Move Down Triggered
  Reordered --> Synced : SQLite Update Reordered Index
  Saved --> Deleted : Click Delete Row
  Deleted --> Synced : SQLite Delete & Reindex Gaps
  Synced --> [*]
```

---

## 4. Measurement Pipeline

Geospatial calculations follow a rigorous UTM projection zone transformation pipeline:

```mermaid
graph TD
  C[WGS84 Coordinates]
  --> Z[Calculate UTM Zone from Centroid Lon]
  --> PJ[Proj4: Transform Lat/Lon to Local UTM Grid Meters]
  --> M[MeasurementEngine: Compute Area & Perimeter]
  --> DB[(Store Results in SQLite table)]
  --> UI[Update React UI display labels]
```

---

## 5. Rendering Pipeline

The visualizer draws vector graphics onto the screen:

```mermaid
graph TD
  Coords[Coordinates Array]
  --> Trans[Compute viewport bounds and aspect ratios]
  --> Scale[Transform UTM coordinate projection to canvas pixels x,y]
  --> Path[Draw SVG Polygon points path]
  --> Grid[Draw background coordinate grid lines]
  --> Overlay[Render Vertex index numbers and North Arrow symbol]
```

---

## 6. Import/Export Pipeline

Data exchange imports/exports follow serialization flows:

```mermaid
graph TD
  subgraph Exporter ["Export Pipeline"]
    E[Select Exporter Format] --> JS[Native Project JSON]
    E --> CSV[CSV Coordinates List]
    E --> GJS[GeoJSON Polygon]
    JS --> WR[Electron Dialog: Save to File]
    CSV --> WR
    GJS --> WR
  end

  subgraph Importer ["Import Pipeline"]
    IM[Electron Dialog: Open File] --> RD[Read Buffer]
    RD --> VAL[ValidationEngine Checks]
    VAL -->|Valid| DBW[SQLite Transaction Update]
    DBW --> LOAD[Reload Coordinates Context]
  end
```

---

## 7. Report Generation Pipeline

Generates professional, print-ready summaries completely offline:

```mermaid
sequenceDiagram
  participant UI as React UI (Workspace)
  participant Ctx as ReportContext
  participant Main as Main Process (ReportService)
  participant Eng as ReportEngine (jsPDF)
  participant FS as Local Filesystem

  UI->>Ctx: Click Generate Report
  Note over UI: Extracts SVG Map Canvas coordinates, serializes to base64 image
  Ctx->>Main: window.electronAPI.exportReportPDF(payload)
  Main->>Main: Show Native Save File Dialog
  Main->>Eng: reportEngine.compilePDF(payload)
  Eng->>Eng: Draw margins, project headers, stats tables, page footers, image snapshot
  Eng-->>Main: Return PDF Buffer
  Main->>FS: Write PDF to disk
  FS-->>Main: File Saved Succeeded
  Main-->>Ctx: Return success status
  Ctx-->>UI: Display Success Toast Alert
```
