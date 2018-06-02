'use strict';

import { existsSync, lstatSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { exec } from 'child_process';
import * as vscode from 'vscode';
import * as mkdirp from 'mkdirp';

const glob = require('glob-fs')();

export function activate(context: vscode.ExtensionContext) {
  const disposables = [];

  disposables.push(vscode.commands.registerCommand('extension.saveWorkspace', () => saveWorkspacePrompt()));
  disposables.push(vscode.commands.registerCommand('extension.switchWorkspace', () => switchWorkspacePrompt(false)));
  disposables.push(vscode.commands.registerCommand('extension.switchWorkspaceNewWindow', () => switchWorkspacePrompt(true)));

  context.subscriptions.push(...disposables);
}

export function deactivate() { }

interface WorkspaceEntry {
  name: string,
  path: string,
}

let workspaceEntries = <WorkspaceEntry[]>[];

function saveWorkspacePrompt() {
  const workspaceEntryDirectories = getWorkspaceEntryDirectories();

  if (!workspaceEntryDirectories.length) {
    vscode.window.showInformationMessage('No workspace directories have been configured');

    return;
  }

  const directoryItems = workspaceEntryDirectories.map(directory => <vscode.QuickPickItem>{
    label: basename(directory),
    description: dirname(directory),
  });

  const options = <vscode.QuickPickOptions>{
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: 'Choose a workspace directory to save the new workspace file...',
  };

  vscode.window.showQuickPick(directoryItems, options).then(
    (directoryItem: vscode.QuickPickItem) => {
      if (!directoryItem) {
        return;
      }

      vscode.window.showInputBox(<vscode.InputBoxOptions>{
        value: getFirstWorkspaceFolderName(),
        prompt: 'Enter a path for the workspace file...'
      }).then(
        (workspaceFileName: string) => {
          workspaceFileName = (workspaceFileName || '').trim();

          if (workspaceFileName === '') {
            return;
          }

          workspaceFileName = workspaceFileName.replace(/\\+/g, '/').replace(/\/\/+/g, '/').replace(/^\//, '');

          workspaceFileName = join(...workspaceFileName.split(/\//));

          const workspaceDirectoryPath = join(
            directoryItem.description, directoryItem.label, dirname(workspaceFileName));

          workspaceFileName = basename(workspaceFileName);

          try {
            mkdirp.sync(workspaceDirectoryPath);
          } catch (err) {
            return;
          }

          const workspaceFilePath = join(workspaceDirectoryPath, workspaceFileName) + '.code-workspace';

          const workspaceFolderPaths = (vscode.workspace.workspaceFolders || []).map(
            (workspaceFolder: vscode.WorkspaceFolder) => ({ path: workspaceFolder.uri.fsPath }));

          const workspaceFileContent = JSON.stringify({
            folders: workspaceFolderPaths,
            settings: {},
          });

          const workspaceFilePathSaveFunc = () => {
            try {
              writeFileSync(workspaceFilePath, workspaceFileContent, { encoding: 'utf8' });

              switchToWorkspace(<WorkspaceEntry>{
                path: workspaceFilePath,
              });
            } catch (error) {
              vscode.window.showErrorMessage(
                'Error while trying to save workspace '
                + `${workspaceFileName} to ${workspaceFilePath}: ${error.message}`);
            }
          }

          if (existsSync(workspaceFilePath)) {
            vscode.window.showInformationMessage(
              `File ${workspaceFilePath} already exists. Do you want to override it?`, 'Yes', 'No').then(
                (answer: string) => {
                  if ((answer || '').trim().toLowerCase() !== 'yes') {
                    return;
                  }

                  workspaceFilePathSaveFunc();
                },
                (reason: any) => { });
          } else {
            workspaceFilePathSaveFunc();
          }
        },
        (reason: any) => { });
    },
    (reason: any) => { });
}

function switchWorkspacePrompt(inNewWindow: boolean = false) {
  workspaceEntries = gatherWorkspaceEntries();

  if (!workspaceEntries.length) {
    vscode.window.showInformationMessage('No workspaces found');

    return;
  }

  const workspaceItems = workspaceEntries.map(entry => <vscode.QuickPickItem>{
    label: entry.name,
    description: entry.path,
  });

  const options = <vscode.QuickPickOptions>{
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: `Choose workspace to switch to${inNewWindow ? ' in a new window' : ''}...`,
  };

  vscode.window.showQuickPick(workspaceItems, options).then(
    (workspaceItem: vscode.QuickPickItem) => {
      if (!workspaceItem) {
        return;
      }

      const entry = workspaceEntries.find(entry => entry.path === workspaceItem.description);

      if (!entry) {
        return;
      }

      switchToWorkspace(entry, inNewWindow);
    },
    (reason: any) => { });
}

function switchToWorkspace(workspaceEntry: WorkspaceEntry, inNewWindow: boolean = false) {
  const app = getApp();
  const command = `${app} ${inNewWindow ? '-n' : '-r'} "${workspaceEntry.path}"`;
  exec(command, onCommandRun);
}

function getWorkspaceEntryDirectories(): string[] {
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
      p = p.replace(/\\+/g, '/').replace(/\/\/+/g, '/').replace(/\/$/, '') + '/';

      try {
        return glob.readdirSync(p, { cwd: '/' });
      } catch (err) {
        return [];
      }
    })
    .reduce((acc, val) => acc.concat(val.map(p => `/${p}`)), [])
    .concat(uniquePaths.map(p => p.replace(/\*\*\/?$/, '')))
    .filter(p => {
      try {
        return existsSync(p) && lstatSync(p).isDirectory();
      } catch (err) {
        return false;
      }
    })
    .reduce((acc: {}, path: string) => (acc[path] = true, acc), {});

  return Object.keys(pathsAfterGlobbingHash).sort();
}

function gatherWorkspaceEntries(): WorkspaceEntry[] {
  const directoryPaths = getWorkspaceEntryDirectories();

  return (<WorkspaceEntry[]>directoryPaths.reduce((acc: WorkspaceEntry[], dir: string) => {
    return readdirSync(dir)
      .filter(fileName => {
        try {
          return /.code-workspace$/.test(fileName) && lstatSync(join(dir, fileName)).isFile();
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
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getFirstWorkspaceFolderName(): string {
  return (vscode.workspace.workspaceFolders || [{ name: undefined }])[0].name;
}

function getApp() {
  const key = `${vscode.env.appName.toLowerCase().search("insiders") !== -1 ? 'codeInsiders' : 'code'}Executable`;
  const app = <string>vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get(key);

  if (app.search(/\s/) !== -1) {
    return `"${app}"`;
  }

  return app;
}

function onCommandRun(err: Error, stdout: string, stderr: string) {
  if (err || stderr) {
    vscode.window.showErrorMessage((err || { message: stderr }).message);
  }
}
