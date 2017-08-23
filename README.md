# vscode-workspace-switcher

Easily switch between workspaces

## How to use

1. Save a workspace file (`.code-workspace`) as you would normally
2. Set the extension's configuration option `vscodeWorkspaceSwitcher.paths` to an array of strings, each representing a directory where your `.code-workspace` files are stored
3. Use the `Ctrl-k w` chord to switch to any of your saved workspaces in the current window
4. Use the `Ctrl-k Ctrl-w` chord to switch to any of your saved workspaces in a new window

## Requirements

* The editor (i.e., `code` or `code-insiders`) must be in your `$PATH`

## Extension Settings

This extension contributes the following settings:

* `vscodeWorkspaceSwitcher.paths`

  * Array of strings, each representing directory where your `.code-workspace` files are stored

## Key bindings

This extension contributes the following key bindings:

* `Ctrl-k w`
  * Switch workspace in current window
* `Ctrl-k Ctrl-w`
  * Switch workspace in new window

## Release Notes

### 1.0.0

Initial release of `vscode-workspace-switcher`
