import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { ProjectProvider } from './context/ProjectContext';
import { CoordinateProvider } from './context/CoordinateContext';
import { GeometryProvider } from './context/GeometryContext';
import { MeasurementProvider } from './context/MeasurementContext';
import { RenderingProvider } from './context/RenderingContext';
import { ImportExportProvider } from './context/ImportExportContext';
import { ReportProvider } from './context/ReportContext';
import AppLayout from './layouts/AppLayout';
import WorkspacePage from './pages/WorkspacePage';
import SettingsDialog from './components/layout/SettingsDialog';
import ErrorDialog from './components/common/ErrorDialog';

export default function App() {
  return (
    <HashRouter>
      <SettingsProvider>
        <ProjectProvider>
          <CoordinateProvider>
            <GeometryProvider>
              <MeasurementProvider>
                <RenderingProvider>
                  <ImportExportProvider>
                    <ReportProvider>
                      <Routes>
                        <Route path="/" element={<AppLayout />}>
                          <Route index element={<WorkspacePage />} />
                        </Route>
                      </Routes>
                      <SettingsDialog />
                      <ErrorDialog />
                    </ReportProvider>
                  </ImportExportProvider>
                </RenderingProvider>
              </MeasurementProvider>
            </GeometryProvider>
          </CoordinateProvider>
        </ProjectProvider>
      </SettingsProvider>
    </HashRouter>
  );
}
