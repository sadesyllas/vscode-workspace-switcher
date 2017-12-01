# vscode-workspace-switcher

Easily switch between workspaces

## How to use

1. Save a workspace file (`.code-workspace`) as you would normally or use the `Ctrl-k Shift-w` chord to have `vscode-workspace-switcher` create it
2. Set the extension's configuration option `vscodeWorkspaceSwitcher.paths` to an array of strings, each representing a directory where your `.code-workspace` files are stored
3. Use the `Ctrl-k w` chord to switch to any of your saved workspaces in the current window
4. Use the `Ctrl-k Ctrl-w` chord to switch to any of your saved workspaces in a new window

## Requirements

* The editor (i.e., `code` or `code-insiders`) must be in your `$PATH`

## Extension Settings

This extension contributes the following settings:

* `vscodeWorkspaceSwitcher.paths`

  * Array of strings, each representing directory where your `.code-workspace` files are stored
  * These directory paths will also be used to select where to create a `.code-workspace` file for the current workspace

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
