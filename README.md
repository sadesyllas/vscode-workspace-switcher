# vscode-workspace-switcher

Easily switch between workspaces

## How to use

1. Save a workspace file (`.code-workspace`), as you would normally, or use the `Ctrl-k Shift-w` chord to have `vscode-workspace-switcher` create it
    - When using a `folder/name` path as the workspace's file name the `folder` directory stucture is automatically created before the workspace file is saved
2. Set the extension's configuration option `vscodeWorkspaceSwitcher.paths` to an array of directory globs, representing the directories where your `.code-workspace` files are stored
3. Use the `Ctrl-k w` chord to switch to any of your saved workspaces in the current window
4. Use the `Ctrl-k Ctrl-w` chord to switch to any of your saved workspaces in a new window

## Requirements

* The editor (i.e., `code` or `code-insiders`) must be in your `$PATH`
  or the path to the appropriate executable must be set through the available settings
  (`vscodeWorkspaceSwitcher.codeExecutable` or `vscodeWorkspaceSwitcher.codeInsidersExecutable`)

## Extension Settings

This extension contributes the following settings:

* `vscodeWorkspaceSwitcher.paths`
  * Array of directory globs, representing the directories where your `.code-workspace` files are stored
  * These directory globs will also be used to select where to create a `.code-workspace` file for the current workspace
* `vscodeWorkspaceSwitcher.codeExecutable`
  * String representing the path to VS Code's executable in case it cannot be found in `$PATH`
* `vscodeWorkspaceSwitcher.codeInsidersExecutable`
  * String representing the path to VS Code Insiders's executable in case it cannot be found in `$PATH`

## Commands

This extension contributes the following commands:

* `Save workspace...`
  * Save the current workspace to a `.code-workspace` file
* `Switch workspace...`
  * Switch workspace in current window
* `Switch workspace in new window...`
  * Switch workspace in new window

## Key bindings

This extension contributes the following key bindings:

* `Ctrl-k Shift-w`
  * Save the current workspace to a `.code-workspace` file
* `Ctrl-k w`
  * Switch workspace in current window
* `Ctrl-k Ctrl-w`
  * Switch workspace in new window

## Dependencies

* `glob-fs` is used for file name globbing of the paths set through the `vscodeWorkspaceSwitcher.paths` setting
* `mkdirp` is used when saving a new workspace file and a `folder/name` path is used
