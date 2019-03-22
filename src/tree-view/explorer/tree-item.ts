import * as vscode from 'vscode';
import { WorkspaceEntry } from '../../model/workspace-entry';

export class TreeItem extends vscode.TreeItem {
  public readonly label: string;

  constructor(public readonly workspaceEntry: WorkspaceEntry) {
    super(workspaceEntry.name, vscode.TreeItemCollapsibleState.None);

    this.label = workspaceEntry.name;
  }

  get description(): string {
    return '';
  }

  get tooltip(): string {
    return this.workspaceEntry.path;
  }

  get command(): vscode.Command {
    return {
      title: `Switch To Workspace "${this.workspaceEntry.name}"`,
      command: 'vscodeWorkspaceSwitcher.switchWorkspace',
      arguments: [this.workspaceEntry],
    };
  }
}