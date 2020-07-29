'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as util from '../../util';
import * as folderStateCache from './folder-state-cache';
import { WorkspaceEntryTreeFolder } from './workspace-entry-tree-folder';
import { WorkspaceEntryTreeItem } from './workspace-entry-tree-item';
import { TreeItem } from './tree-item';
import { WorkspaceEntry } from '../../model/workspace-entry';

interface TreeViewReducerAcc {
  folders: WorkspaceEntryTreeFolder[],
  items: WorkspaceEntryTreeItem[]
}

interface TreeViewUniqueFoldersAcc {
  [_: string]: WorkspaceEntryTreeFolder
}

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> =
    new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor() {
    folderStateCache.load();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(treeItem: TreeItem): vscode.TreeItem {
    return treeItem;
  }

  getChildren(treeItem?: TreeItem): Thenable<TreeItem[]> {
    const showTreeView = util.getVSCodeWorkspaceSwitcherViewContainerTreeViewShow();
    const treeItems = showTreeView ? this.getChildrenAsTree(treeItem!) : this.getChildrenAsList();

    return Promise.resolve(treeItems);
  }

  onFolderExpanded(event: vscode.TreeViewExpansionEvent<WorkspaceEntryTreeFolder>) {
    folderStateCache.put(event.element.path, vscode.TreeItemCollapsibleState.Expanded);
  }

  onFolderCollapsed(event: vscode.TreeViewExpansionEvent<WorkspaceEntryTreeFolder>) {
    folderStateCache.put(event.element.path, vscode.TreeItemCollapsibleState.Collapsed);
  }

  private getChildrenAsTree(treeItem: TreeItem): TreeItem[] {
    let pathGlobs = null;

    if (treeItem) {
      pathGlobs = [path.join(treeItem.path, '**')];
    }

    const workspaceEntries = util.gatherWorkspaceEntries(pathGlobs);
    const folderParsedPaths = util.getWorkspaceEntryFolders(pathGlobs);
    const folderPaths = folderParsedPaths.map(path.format);

    if (!treeItem) {
      folderStateCache.sanitize(folderPaths);
    }

    const _treeItems =
      workspaceEntries.reduce((acc: TreeViewReducerAcc, workspaceEntry: WorkspaceEntry) => {
        const folderPathPrefix = folderPaths.find(folderPath =>
          workspaceEntry.parsedPath.dir.startsWith(folderPath))!;

        const relativePath = path.relative(folderPathPrefix, workspaceEntry.path);
        const relativeParsedPath = path.parse(relativePath);

        if (relativeParsedPath.dir === '') {
          acc.items.push(new WorkspaceEntryTreeItem(workspaceEntry));
        } else {
          let relativePathParts = relativePath.split(path.sep);

          relativePathParts.pop();

          let folderName = relativePathParts.splice(0, 1)[0];
          let folderPath = path.join(folderPathPrefix, folderName);

          while (relativePathParts.length > 0 && fs.readdirSync(folderPath).length === 1) {
            folderName = path.join(folderName, relativePathParts.splice(0, 1)[0]);
            folderPath = path.join(folderPathPrefix, folderName);
          }

          const folderParsedPath = path.parse(folderPath);
          const folderCollapsibleState = folderStateCache.get(path.format(folderParsedPath));

          acc.folders.push(new WorkspaceEntryTreeFolder(folderName, folderParsedPath, folderCollapsibleState));
        }

        return acc;
      }, { folders: [], items: [] });

    const uniqueFolders: TreeViewUniqueFoldersAcc = _treeItems.folders.reduce(
      (acc: TreeViewUniqueFoldersAcc, workspaceEntryTreeFolder: WorkspaceEntryTreeFolder) => {
        acc[workspaceEntryTreeFolder.name] = workspaceEntryTreeFolder;

        return acc;
      },
      {});

    _treeItems.folders = Object.keys(uniqueFolders).reduce((acc: WorkspaceEntryTreeFolder[], name: string) => {
      acc.push(uniqueFolders[name]);

      return acc;
    }, []);

    const treeItems: TreeItem[] = [];

    _treeItems.folders.forEach(item => treeItems.push(item));

    _treeItems.items.forEach(item => treeItems.push(item));

    return treeItems;
  }

  private getChildrenAsList(): TreeItem[] {
    return util.gatherWorkspaceEntries().map(
      (workspaceEntry: WorkspaceEntry) => new WorkspaceEntryTreeItem(workspaceEntry));
  }
}
