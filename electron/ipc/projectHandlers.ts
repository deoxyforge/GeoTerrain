import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import type { IpcResponse } from '../../src/types/ipc';
import type { Project } from '../../src/types/project';
import type { ProjectService } from '../services/ProjectService';

export function registerProjectHandlers(projectService: ProjectService): void {
  ipcMain.handle(IPC_CHANNELS.PROJECT_CREATE, (_event, input): IpcResponse<Project> => {
    try {
      return { success: true, data: projectService.createProject(input) };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_GET_ALL, (): IpcResponse<Project[]> => {
    try {
      return { success: true, data: projectService.getAllProjects() };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_GET_BY_ID, (_event, id: string): IpcResponse<Project> => {
    try {
      const project = projectService.getProjectById(id);
      if (!project) return { success: false, error: 'Project not found' };
      return { success: true, data: project };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_OPEN, (_event, id: string): IpcResponse<Project> => {
    try {
      const project = projectService.openProject(id);
      if (!project) return { success: false, error: 'Project not found' };
      return { success: true, data: project };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_RENAME, (_event, input): IpcResponse<Project> => {
    try {
      const project = projectService.renameProject(input);
      if (!project) return { success: false, error: 'Project not found' };
      return { success: true, data: project };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_UPDATE, (_event, input): IpcResponse<Project> => {
    try {
      const project = projectService.updateProject(input);
      if (!project) return { success: false, error: 'Project not found' };
      return { success: true, data: project };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_DELETE, (_event, id: string): IpcResponse<void> => {
    try {
      projectService.deleteProject(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
