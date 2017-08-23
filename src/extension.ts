'use strict';

import {existsSync, lstatSync, readdirSync} from 'fs';
import {join} from 'path';
import {exec} from 'child_process';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposables = [];

  disposables.push(vscode.commands.registerCommand('extension.switchWorkspace', () => switchWorkspacePrompt(false)));
  disposables.push(vscode.commands.registerCommand('extension.switchWorkspaceNewWindow', () => switchWorkspacePrompt(true)));

  context.subscriptions.push(...disposables);
}

export function deactivate() {}

interface WorkspaceEntry {
  name: string,
  path: string,
}

let workspaceEntries = <WorkspaceEntry[]>[];

function switchWorkspacePrompt(inNewWindow: boolean = false) {
  workspaceEntries = gatherWorkspaceEntries();

  if (!workspaceEntries.length) {
    vscode.window.showInformationMessage('No workspaces found');

    return;
  }

  const options = <vscode.QuickPickOptions>{
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: `Choose workspace to switch to${inNewWindow ? ' in a new window' : ''}...`,
  };

  const items = workspaceEntries.map(entry => <vscode.QuickPickItem>{
    label: entry.name,
    description: entry.path,
  });

  vscode.window.showQuickPick(items, options).then(
    (item: vscode.QuickPickItem) => {
      if (!item) {
        return;
      }

      const entry = workspaceEntries.find(entry => entry.name === item.label);

      if (!entry) {
        return;
      }

      switchToWorkspace(entry, inNewWindow);
    },
    (reason: any) => {});
}

function switchToWorkspace(workspaceEntry: WorkspaceEntry, inNewWindow: boolean = false) {
  const app = getApp();
  const command = `${app} ${inNewWindow ? '-n' : '-r'} ${workspaceEntry.path}`;
  exec(command, onCommandRun);
}

function gatherWorkspaceEntries(): WorkspaceEntry[] {
  var paths = <string[]>vscode.workspace.getConfiguration('vscodeWorkspaceSwitcher').get('paths');

  if (!paths || !paths.length) {
    return [];
  }

  paths = paths.filter(p => typeof(p) === 'string');

  if (!paths.length) {
    return [];
  }

  const pathsHash = paths.reduce((prePath: string, path: string, pathIdx: number, acc: {}) => (acc[path] = true, acc), {});

  const uniquePaths = Object.keys(pathsHash);

  const existingDirectoryPaths = paths.filter(p => {
    try {
      return existsSync(p) && lstatSync(p).isDirectory();
    } catch (err) {
      return false;
    }
  });

  return (<WorkspaceEntry[]>existingDirectoryPaths.reduce((acc: WorkspaceEntry[], dir: string) => {
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

function getApp() {
  return vscode.env.appName.toLowerCase().search("insiders") != -1 ? 'code-insiders' : 'code';
}

function onCommandRun(err: Error, stdout: string, stderr: string) {
  if (err || stderr) {
    vscode.window.showErrorMessage((err || {message: stderr}).message);
  }
}
