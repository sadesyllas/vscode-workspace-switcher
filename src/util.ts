'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as process from 'process';
import * as glob from 'fast-glob';
import * as folderStateCache from './tree-view/explorer/folder-state-cache';
import { WorkspaceEntry } from './model/workspace-entry';

export function getWorkspaceEntryFolders(paths: string[] | null = null): path.ParsedPath[] {
  paths = paths || <string[]>vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get('paths');

  if (!paths || !paths.length) {
    return [];
  }

  const userHome = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] || '~';
  paths = paths.filter(p => typeof (p) === 'string').map(p => p.replace('~', userHome));

  if (!paths.length) {
    return [];
  }

  const pathsHash = paths.reduce((acc: { [_: string]: boolean }, path: string) => (acc[path] = true, acc), {});
  const uniquePaths = Object.keys(pathsHash);

  const pathsAfterGlobbingHash = uniquePaths
    .map(p => {
      try {
        return glob.sync<string>([p.replace(/\\+/g, '/')], { cwd: '/', onlyDirectories: true, absolute: true });
      } catch (err) {
        return [];
      }
    })
    .reduce((acc, val) => acc.concat(val), [])
    .concat(uniquePaths.map(p => p.replace(/(:?\*\*?\/?)+$/, '')))
    .filter(p => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isDirectory();
      } catch (err) {
        return false;
      }
    })
    .map(p => p.replace(/\/+/g, path.sep))
    .reduce((acc: { [_: string]: boolean }, path: string) => (acc[path] = true, acc), {});

  return Object.keys(pathsAfterGlobbingHash)
    .map(path.parse)
    .sort((a: path.ParsedPath, b: path.ParsedPath) => {
      const aParsed = path.format(a);
      const bParsed = path.format(b);

      return aParsed.localeCompare(bParsed);
    });
}

export function gatherWorkspaceEntries(paths: string[] | null = null): WorkspaceEntry[] {
  const folderParsedPaths = getWorkspaceEntryFolders(paths);
  const uniqueWorkspaceEntries: { [_: string]: boolean } = {};

  return (folderParsedPaths.reduce((acc: WorkspaceEntry[], dir: path.ParsedPath) => {
    const dirFormatted = path.format(dir);

    return fs.readdirSync(dirFormatted)
      .filter(fileName => {
        try {
          return /.code-workspace$/.test(fileName) && fs.statSync(path.join(dirFormatted, fileName)).isFile();
        } catch (err) {
          return false;
        }
      })
      .reduce((accProxy: WorkspaceEntry[], fileName: string) => {
        const name = fileName.replace(/.code-workspace$/, '');
        const parsedPath = path.parse(path.join(dirFormatted, fileName))

        accProxy.push(new WorkspaceEntry(name, parsedPath));

        return accProxy;
      }, acc);
  }, []))
    .filter(workspaceEntry => {
      if (uniqueWorkspaceEntries[workspaceEntry.path]) {
        return false;
      }

      uniqueWorkspaceEntries[workspaceEntry.path] = true;

      return true;
    })
    .sort((a: WorkspaceEntry, b: WorkspaceEntry) => a.name.localeCompare(b.name));
}

export function getFirstWorkspaceFolderName(): string | undefined {
  return (vscode.workspace.workspaceFolders || [{ name: undefined }])[0].name;
}

export function matchesCurrentWorkspaceName(uri: vscode.Uri): boolean {
  const workspaceNameQuery = path.parse(uri.fsPath).name.toLowerCase();
  const currentWorkspaceName = (vscode.workspace.name || '').replace(/\s+\([^)]+\)$/, '').toLowerCase();

  return workspaceNameQuery === currentWorkspaceName;
}

export function openWorkspace(workspaceEntry: WorkspaceEntry, inNewWindow: boolean = false) {
  const workspaceUri = vscode.Uri.file(workspaceEntry.path);

  // VSCode handles errors with a popup.
  vscode.commands.executeCommand('vscode.openFolder', workspaceUri, inNewWindow);
}

export function deleteWorkspace(workspaceEntry: WorkspaceEntry, prompt: boolean) {
  if (prompt) {
    vscode.window.showInformationMessage(
      `Are you sure you want to delete file ${workspaceEntry.path}?`, 'Yes', 'No').then(
        (answer: string | undefined) => {
          if ((answer || '').trim().toLowerCase() !== 'yes') {
            return;
          }

          fs.unlinkSync(workspaceEntry.path);

          refreshTreeData();
        },
        (reason: any) => { });
  } else {
    fs.unlinkSync(workspaceEntry.path);
  }
}

export function openFolderWorkspaces(folderPath: string) {
  const folderPathGlob = path.join(folderPath, '**');

  gatherWorkspaceEntries([folderPathGlob]).forEach(
    (workspaceEntry: WorkspaceEntry) => openWorkspace(workspaceEntry, true));
}

export function listenForConfigurationChanges(): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
    if (event.affectsConfiguration('vscodeWorkspaceSwitcher.paths')) {
      setVSCodeWorkspaceSwitcherViewContainersShow();

      refreshTreeData();
    } else if (event.affectsConfiguration('vscodeWorkspaceSwitcher.showInActivityBar')) {
      setVSCodeWorkspaceSwitcherViewInActivityBarShow();
    } else if (event.affectsConfiguration('vscodeWorkspaceSwitcher.showInExplorer')) {
      setVSCodeWorkspaceSwitcherViewInExplorerShow();
    } else if (event.affectsConfiguration('vscodeWorkspaceSwitcher.showDeleteWorkspaceButton')) {
      setVSCodeWorkspaceSwitcherViewContainerDeleteWorkspaceButtonShow();

      refreshTreeData();
    } else if (event.affectsConfiguration('vscodeWorkspaceSwitcher.showTreeView')) {
      setVSCodeWorkspaceSwitcherViewContainerTreeViewShow();

      refreshTreeData();
    }
  });
}

export function setVSCodeWorkspaceSwitcherViewContainersShow() {
  const vscodeWorkspaceSwitcherViewContainersShow = !!getWorkspaceEntryFolders().length;

  vscode.commands.executeCommand('setContext', 'vscodeWorkspaceSwitcherViewContainersShow',
    vscodeWorkspaceSwitcherViewContainersShow);
}

export function setVSCodeWorkspaceSwitcherViewInActivityBarShow() {
  const vscodeWorkspaceSwitcherViewInActivityBarShow =
    !!vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get('showInActivityBar');

  vscode.commands.executeCommand('setContext', 'vscodeWorkspaceSwitcherViewInActivityBarShow',
    vscodeWorkspaceSwitcherViewInActivityBarShow);
}

export function setVSCodeWorkspaceSwitcherViewInExplorerShow() {
  const vscodeWorkspaceSwitcherViewInExplorerShow =
    !!vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get('showInExplorer');

  vscode.commands.executeCommand('setContext', 'vscodeWorkspaceSwitcherViewInExplorerShow',
    vscodeWorkspaceSwitcherViewInExplorerShow);
}

export function setVSCodeWorkspaceSwitcherViewContainerTreeViewShow(value?: boolean) {
  if (value === undefined || value === null) {
    value = getVSCodeWorkspaceSwitcherViewContainerTreeViewShow();
  } else {
    vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').update('showTreeView', value, true);
  }

  vscode.commands.executeCommand('setContext', 'vscodeWorkspaceSwitcherViewContainerTreeViewShow', value);
}

export function getVSCodeWorkspaceSwitcherViewContainerTreeViewShow(): boolean {
  return !!vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get('showTreeView');
}

export function expandTreeView() {
  folderStateCache.expandAll();

  refreshTreeData();
}

export function collapseTreeView() {
  folderStateCache.collapseAll();

  refreshTreeData();
}

export function setVSCodeWorkspaceSwitcherViewContainerDeleteWorkspaceButtonShow() {
  const vscodeWorkspaceSwitcherViewContainerDeleteWorkspaceButtonShow =
    !!vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get('showDeleteWorkspaceButton');

  vscode.commands.executeCommand('setContext', 'vscodeWorkspaceSwitcherViewContainerDeleteWorkspaceButtonShow',
    vscodeWorkspaceSwitcherViewContainerDeleteWorkspaceButtonShow);
}

export function refreshTreeData() {
  vscode.commands.executeCommand('vscodeWorkspaceSwitcher.treeData.refresh');
}

export function closeWorkspace() {
  vscode.commands.executeCommand('workbench.action.closeFolder');
}
