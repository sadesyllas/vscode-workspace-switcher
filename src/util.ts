import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import * as vscode from 'vscode';
import * as process from 'process';
import * as glob from 'fast-glob';
import { WorkspaceEntry } from './model/workspace-entry';

export function getWorkspaceEntryDirectories(): string[] {
  var paths = <string[]>vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get('paths');

  if (!paths || !paths.length) {
    return [];
  }

  const userHome = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"] || "~";

  paths = paths.filter(p => typeof (p) === 'string').map(p => p.replace('~', userHome));

  if (!paths.length) {
    return [];
  }

  const pathsHash = paths.reduce((acc, path) => (acc[path] = true, acc), {});

  const uniquePaths = Object.keys(pathsHash);

  const pathsAfterGlobbingHash = uniquePaths
    .map(p => {
      try {
        return glob.sync<string>([p], { cwd: '/', onlyDirectories: true, absolute: true });
      } catch (err) {
        return [];
      }
    })
    .reduce((acc, val) => acc.concat(val), [])
    .concat(uniquePaths.map(p => p.replace(/(:?\*\*?\/?)+$/, '')))
    .filter(p => {
      try {
        return existsSync(p) && statSync(p).isDirectory();
      } catch (err) {
        return false;
      }
    })
    .reduce((acc: {}, path: string) => (acc[path] = true, acc), {});

  return Object.keys(pathsAfterGlobbingHash).sort();
}

export function gatherWorkspaceEntries(): WorkspaceEntry[] {
  const directoryPaths = getWorkspaceEntryDirectories();
  const uniqueWorkspaceEntries = {};

  return (<WorkspaceEntry[]>directoryPaths.reduce((acc: WorkspaceEntry[], dir: string) => {
    return readdirSync(dir)
      .filter(fileName => {
        try {
          return /.code-workspace$/.test(fileName) && statSync(join(dir, fileName)).isFile();
        } catch (err) {
          return false;
        }
      })
      .reduce((accProxy: WorkspaceEntry[], fileName: string) => {
        accProxy.push({
          name: fileName.replace(/.code-workspace$/, ''),
          path: join(dir, fileName),
        });

        return accProxy;
      }, acc);
  }, <WorkspaceEntry[]>[]))
    .filter(workspaceEntry => {
      if (uniqueWorkspaceEntries[workspaceEntry.path]) {
        return false;
      }

      uniqueWorkspaceEntries[workspaceEntry.path] = true;

      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getFirstWorkspaceFolderName(): string {
  return (vscode.workspace.workspaceFolders || [{ name: undefined }])[0].name;
}

export function switchToWorkspace(workspaceEntry: WorkspaceEntry, inNewWindow: boolean = false) {
  const app = getApp();
  const command = `${app} ${inNewWindow ? '-n' : '-r'} "${workspaceEntry.path}"`;
  exec(command, onCommandRun);
}

export function deleteWorkspace(workspaceEntry: WorkspaceEntry, prompt: boolean) {
  if (prompt) {
    vscode.window.showInformationMessage(
      `Are you sure you want to delete file ${workspaceEntry.path}?`, 'Yes', 'No').then(
        (answer: string) => {
          if ((answer || '').trim().toLowerCase() !== 'yes') {
            return;
          }

          unlinkSync(workspaceEntry.path);

          refreshTreeData();
        },
        (reason: any) => { });
  } else {
    unlinkSync(workspaceEntry.path);
  }
}

export function getApp() {
  const key = `${vscode.env.appName.toLowerCase().search("insiders") !== -1 ? 'codeInsiders' : 'code'}Executable`;
  const app = <string>vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get(key);

  if (app.search(/\s/) !== -1) {
    return `"${app}"`;
  }

  if (app === 'code' && process.platform.toLocaleLowerCase().startsWith("win")) {
    const codeWindowsScriptPath = join(dirname(process.execPath), 'bin', 'code.cmd');

    if (existsSync(codeWindowsScriptPath) && statSync(codeWindowsScriptPath).isFile()) {
      return `"${codeWindowsScriptPath}"`;
    }
  }

  return app;
}

export function onCommandRun(err: Error, stdout: string, stderr: string) {
  if (err || stderr) {
    vscode.window.showErrorMessage((err || { message: stderr }).message);
  }
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
    }
  });
}

export function setVSCodeWorkspaceSwitcherViewContainersShow() {
  const vscodeWorkspaceSwitcherViewContainersShow = !!getWorkspaceEntryDirectories().length;

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

export function refreshTreeData() {
  vscode.commands.executeCommand('vscodeWorkspaceSwitcher.treeData.refresh');
}

export function closeWorkspace() {
  vscode.commands.executeCommand('workbench.action.closeFolder');
}