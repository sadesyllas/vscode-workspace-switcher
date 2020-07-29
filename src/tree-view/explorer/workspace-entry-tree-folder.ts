import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItem } from './tree-item';

export class WorkspaceEntryTreeFolder extends TreeItem {
  constructor(
      public readonly name: string,
      public readonly parsedPath: path.ParsedPath,
      collapsibleState: vscode.TreeItemCollapsibleState) {
    super(name, collapsibleState);

    this.id = `folder|${this.path}|${collapsibleState}`;
    this.contextValue = 'folder';
  }

  get tooltip(): string {
    return this.path;
  }

  get path(): string {
    return path.format(this.parsedPath);
  }
}
