'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as mkdirp from 'mkdirp';
import * as util from './util';
import { WorkspaceEntry } from './model/workspace-entry';
import { WorkspaceEntryTreeFolder } from './tree-view/explorer/workspace-entry-tree-folder';
import { WorkspaceEntryTreeItem } from './tree-view/explorer/workspace-entry-tree-item';
import { TreeDataProvider } from './tree-view/explorer/tree-data-provider';

export function activate(context: vscode.ExtensionContext) {
  const disposables = [];

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.saveWorkspace',
    () => saveWorkspacePrompt()));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.openWorkspace',
    (workspaceEntry?: WorkspaceEntry) => workspaceEntry
      ? util.openWorkspace(workspaceEntry, false)
      : openWorkspacePrompt(false)));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.openWorkspaceInNewWindow',
    (workspaceEntryTreeItem?: WorkspaceEntryTreeItem) => workspaceEntryTreeItem
      ? util.openWorkspace(workspaceEntryTreeItem.workspaceEntry, true)
      : openWorkspacePrompt(true)));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.deleteWorkspace',
    (workspaceEntryTreeItem?: WorkspaceEntryTreeItem) => workspaceEntryTreeItem
      ? util.deleteWorkspace(workspaceEntryTreeItem.workspaceEntry, true)
      : deleteWorkspacePrompt()));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.openFolderWorkspaces',
    (workspaceEntryTreeFolder: WorkspaceEntryTreeFolder) => util.openFolderWorkspaces(workspaceEntryTreeFolder.path)));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.reloadWorkspaces',
    () => util.refreshTreeData()));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.closeWorkspace',
    () => util.closeWorkspace()));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.showListView',
    () => util.setVSCodeWorkspaceSwitcherViewContainerTreeViewShow(false)));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.expandTreeView',
    () => util.expandTreeView()));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.collapseTreeView',
    () => util.collapseTreeView()));

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.showTreeView',
    () => util.setVSCodeWorkspaceSwitcherViewContainerTreeViewShow(true)));

  disposables.push(util.listenForConfigurationChanges());

  const treeDataProvider = new TreeDataProvider(context);

  createTreeViews(treeDataProvider);

  disposables.push(vscode.commands.registerCommand('vscodeWorkspaceSwitcher.treeData.refresh',
    () => treeDataProvider.refresh()));

  context.subscriptions.push(...disposables);

  util.setVSCodeWorkspaceSwitcherViewContainersShow();

  util.setVSCodeWorkspaceSwitcherViewInActivityBarShow();

  util.setVSCodeWorkspaceSwitcherViewInExplorerShow();

  util.setVSCodeWorkspaceSwitcherViewContainerTreeViewShow();

  util.setVSCodeWorkspaceSwitcherViewContainerDeleteWorkspaceButtonShow();
}

export function deactivate() { }

function createTreeViews(treeDataProvider: TreeDataProvider) {
  const treeViewOptions = { treeDataProvider: treeDataProvider };
  const activityBarTreeView = vscode.window.createTreeView('vscodeWorkspaceSwitcherViewInActivityBar', treeViewOptions);
  const explorerTreeView = vscode.window.createTreeView('vscodeWorkspaceSwitcherViewInExplorer', treeViewOptions);

  activityBarTreeView.onDidExpandElement(
    <(event: vscode.TreeViewExpansionEvent<vscode.TreeItem>) => void>treeDataProvider.onFolderExpanded);

  activityBarTreeView.onDidCollapseElement(
    <(event: vscode.TreeViewExpansionEvent<vscode.TreeItem>) => void>treeDataProvider.onFolderCollapsed);

  explorerTreeView.onDidExpandElement(
    <(event: vscode.TreeViewExpansionEvent<vscode.TreeItem>) => void>treeDataProvider.onFolderExpanded);

  explorerTreeView.onDidCollapseElement(
    <(event: vscode.TreeViewExpansionEvent<vscode.TreeItem>) => void>treeDataProvider.onFolderCollapsed);
}

function saveWorkspacePrompt() {
  const workspaceEntryFolders = util.getWorkspaceEntryFolders();

  if (!workspaceEntryFolders.length) {
    vscode.window.showInformationMessage('No workspace folders have been configured');

    return;
  }

  const folderItems = workspaceEntryFolders.map(folder => <vscode.QuickPickItem>{
    label: folder.base,
    description: folder.dir,
  });

  const options = <vscode.QuickPickOptions>{
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: 'Choose a workspace folder to save the new workspace file...',
  };

  vscode.window.showQuickPick(folderItems, options).then(
    (folderItem: vscode.QuickPickItem | undefined) => {
      if (!folderItem) {
        return;
      }

      vscode.window.showInputBox(<vscode.InputBoxOptions>{
        value: util.getFirstWorkspaceFolderName(),
        prompt: 'Enter a path for the workspace file...'
      }).then(
        (workspaceFileName: string | undefined) => {
          workspaceFileName = (workspaceFileName || '').trim();

          if (workspaceFileName === '') {
            return;
          }

          workspaceFileName = workspaceFileName.replace(/\\+/g, '/').replace(/\/\/+/g, '/').replace(/^\//, '');
          workspaceFileName = path.join(...workspaceFileName.split(/\//));

          const workspacefolderPath = path.join(
            folderItem.description!, folderItem.label, path.dirname(workspaceFileName));

          workspaceFileName = path.basename(workspaceFileName);

          try {
            mkdirp.sync(workspacefolderPath);
          } catch (err) {
            return;
          }

          const workspaceFilePath = path.join(workspacefolderPath, workspaceFileName) + '.code-workspace';

          const workspaceFolderPaths = (vscode.workspace.workspaceFolders || []).map(
            (workspaceFolder: vscode.WorkspaceFolder) => ({ path: workspaceFolder.uri.fsPath }));

          const workspaceFileContent = JSON.stringify({
            folders: workspaceFolderPaths,
            settings: {},
          });

          const workspaceFilePathSaveFunc = () => {
            try {
              fs.writeFileSync(workspaceFilePath, workspaceFileContent, { encoding: 'utf8' });

              util.refreshTreeData();

              util.openWorkspace(new WorkspaceEntry('', path.parse(workspaceFilePath)));
            } catch (error) {
              vscode.window.showErrorMessage(
                'Error while trying to save workspace '
                + `${workspaceFileName} to ${workspaceFilePath}: ${error.message}`);
            }
          }

          if (fs.existsSync(workspaceFilePath)) {
            vscode.window.showInformationMessage(
              `File ${workspaceFilePath} already exists. Do you want to override it?`, 'Yes', 'No').then(
                (answer: string | undefined) => {
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

function openWorkspacePrompt(inNewWindow: boolean = false) {
  const workspaceEntries = util.gatherWorkspaceEntries();

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
    placeHolder: `Choose a workspace to switch to${inNewWindow ? ' in a new window' : ''}...`,
  };

  vscode.window.showQuickPick(workspaceItems, options).then(
    (workspaceItem: vscode.QuickPickItem | undefined) => {
      if (!workspaceItem) {
        return;
      }

      const entry = workspaceEntries.find(entry => entry.path === workspaceItem.description);

      if (!entry) {
        return;
      }

      util.openWorkspace(entry, inNewWindow);
    },
    (reason: any) => { });
}


function deleteWorkspacePrompt() {
  let workspaceEntries = util.gatherWorkspaceEntries();

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
    placeHolder: `Choose a workspace to delete...`,
  };

  vscode.window.showQuickPick(workspaceItems, options).then(
    (workspaceItem: vscode.QuickPickItem | undefined) => {
      if (!workspaceItem) {
        return;
      }

      const entry = workspaceEntries.find(entry => entry.path === workspaceItem.description);

      if (!entry) {
        return;
      }

      util.deleteWorkspace(entry, true);
    },
    (reason: any) => { });
}
