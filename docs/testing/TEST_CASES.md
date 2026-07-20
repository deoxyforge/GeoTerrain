# GeoTerrain Analyzer — Test Cases

This document details the complete suite of manual end-to-end QA test cases designed to verify GeoTerrain Analyzer v1.0.0.

---

## 📂 1. Project Management

### TC-PM-01: Create Project
*   **Description**: Verify that a user can successfully create a new project.
*   **Input**: Name: `Survey Alpha`, Description: `WGS84 GPS Survey`.
*   **Steps**:
    1. Click `+` button in Sidebar.
    2. Enter Name and Description.
    3. Click **Confirm**.
*   **Expected Result**: Project card appears in sidebar, auto-selected, and "Survey Alpha" is set as active in Header and Status Bar.
*   **Status**: Pass

### TC-PM-02: Edit Project
*   **Description**: Verify that a project's name and description can be updated.
*   **Input**: Name: `Survey Alpha Edited`, Description: `Updated GPS Survey`.
*   **Steps**:
    1. Right-click project card in Sidebar to trigger context menu.
    2. Click **Edit Project**.
    3. Modify fields and click **Confirm**.
*   **Expected Result**: Project metadata updates instantly in Sidebar, Header, and Status Bar.
*   **Status**: Pass

### TC-PM-03: Delete Project
*   **Description**: Verify that deleting a project cascades correctly.
*   **Steps**:
    1. Right-click project card.
    2. Click **Delete Project**.
    3. Click **Confirm** in the confirmation dialog.
*   **Expected Result**: Project is removed from Sidebar. Active project is cleared. All associated coordinates and results are deleted from SQLite.
*   **Status**: Pass

### TC-PM-04: Search and Sort
*   **Description**: Verify searching and sorting filters in the sidebar.
*   **Steps**:
    1. Create multiple projects.
    2. Type query in search field.
    3. Click sort options: **Recent**, **Date**, **A-Z**.
*   **Expected Result**: Search filters list dynamically. Sort order changes correctly (Recent sorts by `last_opened` timestamp).
*   **Status**: Pass

---

## 📍 2. Coordinates Management

### TC-CO-01: Add Coordinate
*   **Description**: Add a valid coordinate node.
*   **Input**: Lat: `37.7749`, Lon: `-122.4194`
*   **Steps**:
    1. Select active project.
    2. Enter latitude and longitude in toolbar forms.
    3. Click **Add Coordinate**.
*   **Expected Result**: Node is inserted in database, appears in coordinates table list, and displays on SVG MapCanvas.
*   **Status**: Pass

### TC-CO-02: Edit Coordinate
*   **Description**: Edit coordinates values.
*   **Input**: Change point from `37.7749` to `37.7800`
*   **Steps**:
    1. Select coordinate row.
    2. Edit input fields.
    3. Save change.
*   **Expected Result**: Coordinate updates, map node moves, calculations update.
*   **Status**: Pass

### TC-CO-03: Delete Coordinate
*   **Description**: Delete a coordinate vertex and check ordering healing.
*   **Steps**:
    1. Click Delete button next to a coordinate row.
*   **Expected Result**: Point is deleted. Remaining points are re-indexed to prevent gaps in `point_order`.
*   **Status**: Pass

### TC-CO-04: Reorder Coordinates (Move Up/Down)
*   **Description**: Verify moving coordinates re-indexes correctly.
*   **Steps**:
    1. Click `▲` or `▼` button on a row.
*   **Expected Result**: Point moves up/down in array, database order commits, visualizer redraws path.
*   **Status**: Pass

---

## 🔍 3. Validation Engine

### TC-VL-01: Polygon Closure & Vertices Count
*   **Description**: Verify validation warning under 3 points.
*   **Steps**: Add 2 coordinates.
*   **Expected Result**: Validation alert shows: `Need at least 3 vertices to construct a valid polygon boundary`. Area calculations are disabled.
*   **Status**: Pass

### TC-VL-02: Self-Intersection Check
*   **Description**: Check validation alert for intersecting boundaries.
*   **Steps**: Add 4 points forming a figure-8 self-intersecting loop.
*   **Expected Result**: Validation warns of self-intersection. Map highlights invalid segments in red.
*   **Status**: Pass

---

## 📊 4. Measurement & Geometry Engine

### TC-MS-01: Measurements Calculation & Unit Conversions
*   **Description**: Verify area/perimeter calculation accuracy and unit conversions.
*   **Steps**:
    1. Create a closed polygon with 4 points.
    2. Toggle settings units: `m²`, `km²`, `Hectares`, `Acres`.
*   **Expected Result**: Area and perimeter match UTM Projected grid coordinates. Setting changes update units labels immediately.
*   **Status**: Pass

---

## 🖥 5. Rendering Engine

### TC-RN-01: Viewport Controls
*   **Description**: Zoom, Pan, Fit Bounds, Grid toggles.
*   **Steps**:
    1. Scroll zoom.
    2. Click-drag pan.
    3. Toggle Grid Visibility, Vertex Labels, and North Arrow in settings.
*   **Expected Result**: Canvas viewport responds smoothly. Grid, labels, and vector North Indicator toggle reactively.
*   **Status**: Pass

---

## 🔌 6. Data Exchange & PDF Reports

### TC-EX-01: Import/Export Integrity
*   **Description**: Verify round-trip integrity of exported formats.
*   **Steps**:
    1. Export project as GeoJSON, CSV, and Native JSON.
    2. Re-import files into a new project workspace.
*   **Expected Result**: Geometries match original coordinate arrays perfectly.
*   **Status**: Pass

### TC-RP-01: Generate PDF Report
*   **Description**: Verify printable PDF layouts compile fully offline.
*   **Steps**:
    1. Open Report Preview.
    2. Click **Export PDF**.
*   **Expected Result**: Native save dialog opens. Writes file containing tables, calculations, and screenshot image correctly.
*   **Status**: Pass
