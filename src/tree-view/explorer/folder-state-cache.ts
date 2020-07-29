import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as mkdirp from 'mkdirp';

let cache: { [folderPath: string]: vscode.TreeItemCollapsibleState } = {};

export function load() {
  const cachePath = getCachePath();

  try {
    if (fs.statSync(cachePath).isFile()) {
      const cacheContent = fs.readFileSync(cachePath, { encoding: 'utf8' });

      cache = JSON.parse(cacheContent);
    }
  } catch { }
}

export function sanitize(validFolderPaths: string[]) {
  const uniqueValidFolderPaths: { [key: string]: null } = validFolderPaths.reduce(
    (acc: { [key: string]: null }, folderPath: string) => (acc[folderPath] = null, acc), {});

  Object.keys(cache).forEach((folderPath: string) => {
    if (uniqueValidFolderPaths[folderPath] === undefined) {
      delete cache[folderPath];
    }
  });

  Object.keys(uniqueValidFolderPaths).forEach((folderPath: string) => {
    if (cache[folderPath] === undefined) {
      cache[folderPath] = vscode.TreeItemCollapsibleState.Collapsed;
    }
  });

  save();
}

export function get(folderPath: string): vscode.TreeItemCollapsibleState {
  return cache[folderPath] || vscode.TreeItemCollapsibleState.Collapsed;
}

export function put(folderPath: string, collapsibleState: vscode.TreeItemCollapsibleState) {
  cache[folderPath] = collapsibleState;

  setTimeout(save, 50);
}

export function save() {
  try {
    mkdirp.sync(path.dirname(getCachePath()));

    fs.writeFileSync(getCachePath(), JSON.stringify(cache), { encoding: 'utf8' });
  } catch (error) {
    vscode.window.showErrorMessage(`Could not store folder state cache: ${error}`);
  }
}

export function expandAll() {
  Object.keys(cache).forEach((folderPath: string) => {
    cache[folderPath] = vscode.TreeItemCollapsibleState.Expanded;
  });

  save();
}

export function collapseAll() {
  Object.keys(cache).forEach((folderPath: string) => {
    cache[folderPath] = vscode.TreeItemCollapsibleState.Collapsed;
  });

  save();
}

function getCachePath(): string {
  return path.join(os.homedir(), '.vscode-workspace-switcher', 'folder-state-cache.json');
}