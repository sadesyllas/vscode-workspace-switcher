import * as vscode from 'vscode';
import { TreeItem } from './tree-item';
import { WorkspaceEntry } from '../../model/workspace-entry';

export class WorkspaceEntryTreeItem extends TreeItem {
  constructor(public readonly workspaceEntry: WorkspaceEntry) {
    super(workspaceEntry.name, vscode.TreeItemCollapsibleState.None);

    this.id = `item|${workspaceEntry.path}`;
  }

  get tooltip(): string {
    return this.workspaceEntry.path;
  }

  get command(): vscode.Command {
    return {
      title: `Switch To Workspace "${this.workspaceEntry.name}"`,
      command: 'vscodeWorkspaceSwitcher.openWorkspace',
      arguments: [this.workspaceEntry],
    };
  }

  get path(): string {
    return this.workspaceEntry.path;
  }
}
