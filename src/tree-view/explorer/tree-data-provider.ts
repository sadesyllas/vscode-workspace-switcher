import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from '../../util';
import { TreeItem } from './tree-item';
import { WorkspaceEntry } from '../../model/workspace-entry';

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(treeItem: TreeItem): vscode.TreeItem {
    return treeItem;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    const workspaceEntries = util.gatherWorkspaceEntries();
    const reducer = (acc: TreeItem[], workspaceEntry: WorkspaceEntry) =>
      (acc.push(new TreeItem(workspaceEntry)), acc);
    let treeItems = workspaceEntries.reduce(reducer, []);

    return Promise.resolve(treeItems);
  }
}
