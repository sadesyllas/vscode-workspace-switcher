'use strict';

import * as vscode from 'vscode';

export class TreeItem extends vscode.TreeItem {
  public readonly label: string;

  constructor(name: string, treeItemCollapsibleState: vscode.TreeItemCollapsibleState) {
    super(name, treeItemCollapsibleState);

    this.label = name;
  }

  // @ts-ignore
  get description(): string {
    return '';
  }

  // @ts-ignore
  get tooltip(): string {
    throw Error('Not implemented');
  }

  // @ts-ignore
  get command(): vscode.Command | undefined {
    return undefined;
  }

  get path(): string {
    throw Error('Not implemented');
  }
}
