# vscode-workspace-switcher

Easily switch between workspaces

## How to use

1. Set the extension's configuration option `vscodeWorkspaceSwitcher.paths` to an array of directory globs, representing the directories where your `.code-workspace` files are stored
2. Save a workspace file (`.code-workspace`)
    * Use the `W`-shaped icon in the Activity Bar and then click on the icon the view's title bar,
    * or, use the extension's subsection in Explorer, in the same way,
    * or, use the `Ctrl-k Shift-w` chord,
    * or, save it manually using VS Code's File menu
3. Switch to any of your saved workspaces in the current window
    * Use the `W`-shaped icon in the Activity Bar and then click on name of the workspace you want to switch to,
    * or, use the extension's subsection in Explorer, in the same way,
    * or, use the `Ctrl-k w` chord
4. Switch to any of your saved workspaces in a new window
    * Use the `W`-shaped icon in the Activity Bar and then click on the `O`-shaped icon next to the name of the workspace you want to switch to,
    * or, use the extension's subection in Explorer, in the same way,
    * or, Use the `Ctrl-k Ctrl-w` chord

When using a `folder/name` path as the workspace's file name, the `folder` directory stucture is automatically created before the workspace file is saved.

## Configuration

This extension contributes the following settings:

* `vscodeWorkspaceSwitcher.paths`
    * Array of directory globs, representing the directories where your `.code-workspace` files are stored
    * These directory globs will also be used to select where to create a `.code-workspace` file for the current workspace
* `vscodeWorkspaceSwitcher.showInActivityBar`
    * Boolean controlling whether or not the list of workspaces will be shown in a separate view in the Activity Bar
* `vscodeWorkspaceSwitcher.showInExplorer`
    * Boolean controlling whether or not the list of workspaces will be shown in a subsection in the Explorer

## Commands

This extension contributes the following commands:

* `Save Workspace`
    * Save the current workspace to a `.code-workspace` file
* `Switch Workspace`
    * Select a workspace and switch to it in the current window
* `Switch Workspace in New Window`
    * Select a workspace and switch to it in a new window
* `Delete Workspace`
    * Delete a workspace
* `Reload Workspaces`
    * Reload the list of workspaces
* `Close Workspace`
    * Close the currently open workspace

## Views

* Activity Bar
    * The `W`-shaped icon in the Activity Bar toggles the list of workspaces
    * The icon's visibility can be controlled through the `vscodeWorkspaceSwitcher.showInActivityBar` extension setting
* Explorer
    * There is a subsection in Explorer which shows the list of workspaces
    * The subsection's visibility can be controlled through the `vscodeWorkspaceSwitcher.showInExplorer` extension setting

## Key bindings

This extension contributes the following key bindings:

* `Ctrl-k Shift-w`
    * Save the current workspace to a `.code-workspace` file
* `Ctrl-k w`
    * Switch workspace in current window
* `Ctrl-k Ctrl-w`
    * Switch workspace in new window

## Dependencies

* `fast-glob` is used for file name globbing of the paths set through the `vscodeWorkspaceSwitcher.paths` setting
* `mkdirp` is used when saving a new workspace file and a `folder/name` path is used
