'use strict';

import * as path from 'path';

export class WorkspaceEntry {
  get path(): string {
    return path.format(this.parsedPath);
  }

  constructor(public readonly name: string, public readonly parsedPath: path.ParsedPath) {}
}
