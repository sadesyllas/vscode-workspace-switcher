'use strict';

import * as vscode from 'vscode';

export class TreeItem extends vscode.TreeItem {
  public readonly label: string;

  constructor(name: string, treeItemCollapsibleState: vscode.TreeItemCollapsibleState) {
    super(name, treeItemCollapsibleState);

    this.label = name;
  }

  get description(): string {
    return '';
  }

  get tooltip(): string {
    throw Error('Not implemented');
  }

  get command(): vscode.Command | undefined {
    return undefined;
  }

  get path(): string {
    throw Error('Not implemented');
  }
}
