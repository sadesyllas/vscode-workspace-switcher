# Changelog

- ## v1.15.2
    - Fix command names in README.md

- ## v1.15.1
    - Fix keywords in package.json

- ## v1.15.0
    - Implement tree view for workspace entries
    - Use VSCode's API for opening workspaces

- ## v1.14.0
    - Show the UI elements unless no workspace folders are found

- ## v1.13.1
    - Add `Close Workspace` command in README.md

- ## v1.13.0
    - Implement `Close Workspace` command

- ## v1.12.1
    - Fix directory glob support (#21)

- ## v1.12.0
    - Implement `Reload Workspaces` command

- ## v1.11.0
    - Implement `Delete Workspace` command (#16)
    - Implement Activity Bar view container
    - Implement Explorer view

- ## v1.10.5
    - Fix duplicate entries issue (#18, #20)

- ## v1.10.4
    - Fix vscodeWorkspaceSwitcher.paths recursive glob support (#18, #19)

- ## v1.10.3
    - Replace glob-fs with fast-glob (#17)

- ## v1.10.2
    - Use webpack to bundle the extension files

- ## v1.10.1
    - Include `node_modules` in extension package

- ## v1.10.0
    - Use `statSync` to support symbolic links in vscodeWorkspaceSwitcher.paths (#15)

- ## v1.9.0
    - Try to guess the path to VS Code's executable script in Windows

- ## v1.8.0
    - Suggest the first workspace folder's name when saving a workspace

- ## v1.7.0
    - Automatically create folders when saving a workspace with a `folder/name` path

- ## v1.6.0
    - Add support for wildcards in vscodeWorkspaceSwitcher.paths (#8)

- ## v1.5.1
    - Quote paths to workspaces (#7)

- ## v1.5.0
    - Handle `~` in configuration folder paths (PR#6)

- ## v1.4.0
    - Provide settings to explicitly set the path to the executable

- ## v1.3.3
    - Release: Fix a typo in key bindings (pull request #3 from joonro/patch-1)

- ## v1.3.2
    - Revert fix for button order of the `Save workspace...` command prompt

- ## v1.3.1
    - Fix button order of the `Save workspace...` command prompt

- ## v1.3.0
    - Implement saving the current workspace

- ## v1.2.0
    - Match entries in the workspaces menu by path

- ## v1.0.1
    - Refactor the code for displaying the workspaces menu

- ## v1.0.0
    - Implement vscode-workspace-switcher
