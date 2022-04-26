import * as vscode from 'vscode';
import * as util from '../../util';
import { TreeItem } from './tree-item';
import { WorkspaceEntry } from '../../model/workspace-entry';
import { WorkspaceEntryTreeFolder } from './workspace-entry-tree-folder';

export class WorkspaceEntryTreeItem extends TreeItem {
  constructor(
    public readonly workspaceEntry: WorkspaceEntry,
    private readonly parent: vscode.TreeItem | undefined,
    context: vscode.ExtensionContext) {
    super(workspaceEntry.name, vscode.TreeItemCollapsibleState.None);

    this.id = `item|${workspaceEntry.path}`;

    if (util.matchesCurrentWorkspaceName(vscode.Uri.parse(workspaceEntry.path))) {
      const iconPaths = {
        light: context.asAbsolutePath('/assets/icons/light/selected.svg'),
        dark: context.asAbsolutePath('/assets/icons/dark/selected.svg'),
      };

      this.iconPath = iconPaths;

      let parent = <WorkspaceEntryTreeFolder>this.parent;

      while (parent) {
        if (!parent.iconPath) {
          parent.iconPath = iconPaths;
          this._parentRootToUpdate = parent;
        }

        parent = <WorkspaceEntryTreeFolder>parent.parent;
      }
    }
  }

  private _parentRootToUpdate: TreeItem | undefined = undefined;

  get parentRootToUpdate(): TreeItem | undefined {
    return this._parentRootToUpdate;
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
