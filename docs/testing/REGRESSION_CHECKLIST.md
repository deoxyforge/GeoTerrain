# GeoTerrain Analyzer — Regression Checklist

This checklist must be executed before compiling or releasing any future patch or major updates to the GeoTerrain Analyzer codebase.

---

## 📂 1. Database & Migrations
- [ ] Database file `storage/geoterrain.db` creates automatically on startup if missing.
- [ ] Migrations run without throwing errors, creating `projects`, `coordinates`, `results`, and `settings` tables.
- [ ] SQLite WAL checkpoint runs safely on shutdown to flush journals.

## 📍 2. Project & Coordinate Management
- [ ] Deleting a project cascades deletions to coordinates and results tables.
- [ ] Deleting a coordinate vertex triggers ordering updates to heal point index gaps.
- [ ] Swapping coordinate order (`Move Up` / `Move Down`) updates canvas boundary loops.
- [ ] Dynamic search in sidebar filters projects by name/description (case-insensitive).
- [ ] Sidebar sorting lists by **Recent** (last opened), **Date Created**, or **Alphabetical**.

## 🔍 3. Validation & Geometries
- [ ] Coordinates with lat/lon values outside WGS84 ranges are rejected.
- [ ] Self-intersecting boundaries show visual highlights and lock calculations.
- [ ] Fewer than 3 points disable polygon construction.
- [ ] Centroid coordinates update reactively when coordinates are added, edited, or reordered.

## 💾 4. Undo/Redo & Autosave
- [ ] `Ctrl + Z` undoes node edits, point additions, reorderings, and CSV imports.
- [ ] `Ctrl + Y` redoes previously undone changes.
- [ ] Changing projects clears the Undo and Redo memory stacks.
- [ ] Autosave status flashes "Saving..." and returns to "Saved" on database write.

## 🖥 5. Rendering & Settings
- [ ] SVG MapCanvas supports zoom (mouse wheel) and pan (click-drag) actions.
- [ ] Visualizer grid line overlay toggles reactively when visibility settings change.
- [ ] Light / Dark color themes respond immediately.
- [ ] Vector North Arrow overlay displays in the top-right corner.

## 🔌 6. Exchange & Reports
- [ ] Exporting to CSV, GeoJSON, and Native JSON matches active coordinates arrays.
- [ ] Importing CSV, GeoJSON, and Native JSON parses files and inserts coordinates without data loss.
- [ ] PDF report prints project metadata, stats tables, centroid coordinates, and UTM zone tags.
- [ ] Report PDF compiles successfully fully offline.
