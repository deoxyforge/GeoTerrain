# GeoTerrain Analyzer Changelog

All notable changes to the GeoTerrain Analyzer project will be documented in this file.

## [1.0.0] - 2026-07-20

### Added
- **Core Database & Project Lifecycle**: Implemented SQLite table migrations (`projects`, `coordinates`, `results`), ProjectRepository, and ProjectService.
- **Coordinate Management**: Added Coordinate table indexes, order tracking, and CRUD endpoints (Add, Delete, Update, Reorder coordinates).
- **Validation Engine**: Built strict coordinate boundaries checks (latitude/longitude ranges, invalid format, minimum vertices count, self-intersection, and duplicate nodes).
- **Geometry Engine**: Created PolygonBuilder, bounding box calculator, and centroid coordinate extractor.
- **Measurement Engine**: Added ProjectionEngine (UTM zone calculations, Datum transformations, conversion algorithms) and MeasurementService (WGS84 ellipsoidal area and perimeter metrics).
- **Rendering Engine**: Developed MapCanvas SVG renderer featuring zoom, pan, select coordinate node, hovered state markers, and dynamic polygon bounding box.
- **Data Exchange Engine**: Implemented ImportEngine, ExportEngine, and serializing processors for GeoJSON, CSV, and Native GeoTerrain Project files.
- **Report Engine**: Added ReportService and ReportEngine exporting multi-page PDF documents (including project statistics tables, coordinate vertices list, and high-resolution base64 map canvas embeds).
- **Production Polish**: Added SettingsContext, SettingsDialog, ErrorDialog, light theme, autosave indicator state, and global Undo/Redo history tracking (`Ctrl + Z`, `Ctrl + Y`).

### Fixed
- Fixed typescript compilation warnings for unused React imports in components.
- Resolved explicit-any linter errors in settings forms by typing selections.
- Cleaned gap errors in coordinates ordering on delete vertex actions.

### Technical Specifications
- **Framework**: Electron v29.1.4 & React v18.2.0 (Vite)
- **Database**: better-sqlite3 (SQLite 3.x)
- **GIS Calculators**: Turf.js, Proj4.js
- **PDF Layouts**: jsPDF
