# GeoTerrain Analyzer — User Guide

Welcome to the **GeoTerrain Analyzer** User Guide. This document provides step-by-step instructions on utilizing the desktop application to manage, analyze, and document geospatial projects.

---

## 🛠 Getting Started

### 1. Launching the App
Double-click the **GeoTerrain Analyzer** icon on your Desktop or run the application from your installation folder. The app boots fully offline and establishes a secure connection to your local SQLite database workspace.

### 2. Managing Projects
*   **Create Project**: Click the `+` button in the sidebar's header. Fill out the project name and description, then click **Create**.
*   **Select Project**: Click any project card in the sidebar list to make it active.
*   **Search/Sort**: Use the search input to filter projects. Click the **Date**, **Recent**, or **A-Z** buttons to sort the list.
*   **Edit/Delete**: Right-click any project card to open the context menu. Select **Edit Project** to rename it or **Delete Project** to delete it.

---

## 🗺 Editing Coordinates & Drawing Polygons

### 1. Adding Coordinate Vertices
Select an active project, then use the **Add Coordinate** panel in the workspace header:
1. Enter the Latitude and Longitude values (e.g. `37.7749`, `-122.4194`).
2. Click **Add Coordinate** (or press Enter).
3. The coordinate is saved, and a vertex node is instantly drawn on the visualizer canvas.

### 2. Interactive Map Actions
*   **Pan**: Click and drag on the map viewport canvas.
*   **Zoom**: Use your mouse scroll wheel, or click the `+` and `-` zoom buttons in the top-right toolbar.
*   **Edit Node**: Select any vertex node on the map, adjust its latitude/longitude coordinates in the editor, and apply changes.
*   **Reorder Node**: Click the `▲` (Up) or `▼` (Down) arrows in the coordinates table to adjust the vertex boundary path ordering.
*   **Delete Node**: Click the Trash icon next to any coordinate row to delete it.

---

## ⌨ Keyboard Shortcuts & Actions History

GeoTerrain Analyzer supports keyboard shortcuts to accelerate survey editing:
*   **Undo Action**: Press `Ctrl + Z` to undo coordinate edits, point additions, deletions, reorderings, or CSV imports.
*   **Redo Action**: Press `Ctrl + Y` to redo previously undone changes.
*   **Quick Import**: Press `Ctrl + O` to prompt the coordinate file importer.
*   **Quick Export**: Press `Ctrl + E` to prompt the native project exporter, or `Ctrl + Shift + S` for CSV export.

---

## ⚙ Modifying Settings

Click the **Settings** button in the sidebar's footer:
1.  **Color Theme**: Switch between **Dark Theme** and **Light Theme**.
2.  **Visual overlays**: Check or uncheck **Show Viewport Grid**, **Show Coordinates Labels**, and **Show North Indicator Target**.
3.  **Default Units**: Choose between Square Meters, Square Kilometers, Hectares, or Acres.
4.  **Autosave**: Set database checkpoint backup intervals.
5.  **Restore project**: Toggle if the last opened project should load automatically.

---

## 📊 Generating Reports

Click the **Report** button in the main workspace toolbar:
1. The **Report Preview** dashboard opens, showing a double-sheet view.
2. Select **Export PDF** to choose a path on your computer.
3. GeoTerrain Analyzer compiles the report and writes the PDF file containing metadata, coordinate tables, and a snapshot graphic.
