# Architecture & Process Walkthrough

This document outlines the process architecture, initialization flow, context hierarchy, and folder structure of GeoTerrain Analyzer v1.0.0.

---

## 1. Electron Process Architecture

The application is built on top of Electron's multi-process architecture to enforce sandboxing and security.

```mermaid
graph TD
  subgraph Main Process ["Main Process (Node.js Environment)"]
    M[main.ts] --> DB[(SQLite Database)]
    M --> SR[SettingService]
    M --> PS[ProjectService]
    M --> CS[CoordinateService]
    M --> MS[MeasurementService]
    M --> GS[GeometryService]
    M --> IS[ImportService]
    M --> ES[ExportService]
    M --> RS[ReportService]
  end

  subgraph Preload Bridge ["Preload Bridge (Context Isolation)"]
    PL[preload.ts]
  end

  subgraph Renderer Process ["Renderer Process (React Environment)"]
    APP[App.tsx] --> WS[WorkspacePage]
    WS --> MC[MapCanvas SVG]
    WS --> SD[SettingsDialog]
  end

  M <-->|IPC Channels| PL
  PL <-->|window.electronAPI| APP
```

---

## 2. Application Startup Sequence

When the user launches the application, the startup sequence executes as follows:

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Main as Electron Main Process
  participant Mig as Database Migrations
  participant DB as SQLite DB
  participant Pre as Preload Bridge
  participant React as React App

  User->>Main: Launch Executable
  Main->>Main: Initialize BrowserWindow
  Main->>Mig: Run migrations.ts
  Mig->>DB: CREATE TABLE IF NOT EXISTS (projects, coordinates, results, settings)
  DB-->>Mig: Migration Succeeded
  Main->>Main: Initialize IPC channels
  Main->>Main: Load index.html
  Main->>Pre: Expose electronAPI Context Bridge
  Pre->>React: Mount App.tsx
  React->>Main: IPC: GET_ALL_SETTINGS
  Main-->>React: Return User Preferences
  React->>Main: IPC: GET_ALL_PROJECTS
  Main-->>React: Return Projects List
  Note over React: If restoreLastProject is active, restore last active workspace
```

---

## 3. React Context Hierarchy

State is managed globally in the renderer process using the React Context API. The provider tree is structured as follows:

```mermaid
graph TD
  Router[HashRouter]
  --> Settings[SettingsProvider]
  --> Project[ProjectProvider]
  --> Coordinate[CoordinateProvider]
  --> Geometry[GeometryProvider]
  --> Measurement[MeasurementProvider]
  --> Rendering[RenderingProvider]
  --> ImportExport[ImportExportProvider]
  --> Report[ReportProvider]
  --> Routes[Routes / Pages / Layouts]
```

---

## 4. Folder Structure Tree

```
GeoTerrain/
├── assets/                  # App icon and build resources
├── docs/                    # Architectural and testing documentation
│   ├── testing/             # QA logs and test cases
│   └── walkthrough/         # System diagrams and flowcharts
├── electron/                # Main process codebase
│   ├── database/            # SQLite connection and migration queries
│   ├── ipc/                 # IPC communication handlers
│   ├── repositories/        # Database tables mapper classes
│   ├── services/            # Business logic wrappers
│   ├── utils/               # PDF rendering and file importers
│   ├── main.ts              # Electron entry script
│   └── preload.ts           # IPC bridge script
├── src/                     # React renderer process codebase
│   ├── components/          # Reusable UI components
│   ├── context/             # React providers
│   ├── hooks/               # Custom hooks
│   ├── layouts/             # Page structural layouts
│   ├── pages/               # Workspace pages
│   ├── styles/              # Global Tailwind style rules
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Conversions and validation utils
├── package.json             # Build script targets and dependencies
├── vite.config.ts           # Bundler settings
└── tsconfig.json            # TypeScript compile configurations
```

---

## 5. IPC Communication Flow

IPC handlers act as communication channels between the UI and database.

```mermaid
sequenceDiagram
  participant Renderer as React UI (Renderer)
  participant Preload as Preload Context Bridge
  participant Main as IPC Main Router
  participant Service as Business Service (Node.js)
  participant Repo as SQLite Repository
  participant DB as SQLite Database File

  Renderer->>Preload: window.electronAPI.addCoordinate(payload)
  Preload->>Main: ipcRenderer.invoke('coordinate:add', payload)
  Main->>Service: coordinateService.addPoint(input)
  Service->>Repo: coordinateRepo.insert(coordinate)
  Repo->>DB: INSERT INTO coordinates (...)
  DB-->>Repo: Insert Succeeded
  Repo-->>Service: Return coordinate
  Service-->>Main: Return coordinate
  Main-->>Preload: Return IpcResponse (Success)
  Preload-->>Renderer: Return Promise Resolve
```
