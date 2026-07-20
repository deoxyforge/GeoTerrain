# GeoTerrain Analyzer — Test Results

This document contains execution logs and outcomes for the GeoTerrain Analyzer v1.0.0 manual QA pass.

---

## 📊 Summary of Execution

| Test Category | Total Cases | Passed | Failed | Blocked | Success Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Management** | 4 | 4 | 0 | 0 | 100% |
| **Coordinates** | 4 | 4 | 0 | 0 | 100% |
| **Validation Engine** | 2 | 2 | 0 | 0 | 100% |
| **Measurement & Geometry** | 1 | 1 | 0 | 0 | 100% |
| **Rendering Engine** | 1 | 1 | 0 | 0 | 100% |
| **Data Exchange & PDF** | 2 | 2 | 0 | 0 | 100% |
| **TOTAL** | **14** | **14** | **0** | **0** | **100%** |

---

## 📝 Execution Details

### 1. Project Management
*   **TC-PM-01 (Create)**:
    *   *Inputs*: Name="Downtown Zone Survey", Description="Surveying urban boundary landmarks".
    *   *Result*: SQLite query succeeds. Sidebar refreshes. UI loads active workspace. **PASS**
*   **TC-PM-02 (Edit)**:
    *   *Inputs*: Changed name to "Downtown Zone Survey RevB".
    *   *Result*: UI edits reflect immediately. SQLite row updates. **PASS**
*   **TC-PM-03 (Delete)**:
    *   *Result*: Cascading constraints delete all associated coordinates. Workspace clears. **PASS**
*   **TC-PM-04 (Search/Sort)**:
    *   *Result*: Sidebar searches by strings case-insensitively. Sorts by last opened dates correctly. **PASS**

### 2. Coordinates & History
*   **TC-CO-01 (Add)**:
    *   *Inputs*: `37.7749`, `-122.4194`
    *   *Result*: Row added. Autosave indicator flashes "Saving..." -> "Saved". Node renders on canvas. **PASS**
*   **TC-CO-02 (Edit)**:
    *   *Inputs*: Changed to `37.7800`, `-122.4100`
    *   *Result*: Vertex position updates. Area calculation recalculates. **PASS**
*   **TC-CO-03 (Delete)**:
    *   *Result*: Coordinate is deleted. Remaining point indexes re-align without gaps (e.g. 1, 2, 3 instead of 1, 3). **PASS**
*   **TC-CO-04 (Reorder)**:
    *   *Result*: Up/Down movements commit to db index. Canvas updates path segments. **PASS**
*   **TC-History (Undo/Redo)**:
    *   *Result*: `Ctrl + Z` and `Ctrl + Y` restore and re-execute coordinate operations instantly. **PASS**

### 3. Validation & Geometry Engine
*   **TC-VL-01 (Vertex Threshold)**:
    *   *Result*: Alert messages prompt under 3 vertices. Geometry engine remains offline. **PASS**
*   **TC-VL-02 (Self-Intersection)**:
    *   *Result*: Formed crossover loops. Validation turns invalid, showing red segment lines. **PASS**

### 4. Measurements & Visualizer
*   **TC-MS-01 (Calculations)**:
    *   *Result*: Area transforms correctly through Proj4 UTM. Conversions match expected metrics. **PASS**
*   **TC-RN-01 (Canvas Overlays)**:
    *   *Result*: Zoom/pan parameters update. Viewport Grid, Vertex numbering, and North indicator draw correctly when enabled. **PASS**

### 5. Exchange & Reports
*   **TC-EX-01 (Import/Export)**:
    *   *Result*: GeoJSON polygon exports and imports. Vertices and coordinate grids match original coordinates exactly. **PASS**
*   **TC-RP-01 (PDF Reports)**:
    *   *Result*: Prompts save file dialog. Generates PDF with tables, centroid coordinates, and snapshot Base64. **PASS**
