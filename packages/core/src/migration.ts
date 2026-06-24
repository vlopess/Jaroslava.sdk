import type { JaroAst } from "@jaroslava/types";

/**
 * A single migration step from one astVersion to the next (must be
 * sequential, e.g. "1.0.0" -> "1.1.0"). Migrations are kept as small,
 * composable, pure functions so they can be tested in isolation and
 * chained automatically by `migrate()`.
 */
export interface Migration {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate(ast: JaroAst): JaroAst;
}

export class MigrationRegistry {
  private migrations: Migration[] = [];

  register(migration: Migration): void {
    this.migrations.push(migration);
  }

  /** Finds the chain of migrations needed to go from `from` to `to`, or
   *  throws if no contiguous path exists. */
  private resolveChain(from: string, to: string): Migration[] {
    if (from === to) return [];
    const chain: Migration[] = [];
    let current = from;
    const visited = new Set<string>();
    while (current !== to) {
      if (visited.has(current)) {
        throw new Error(`Migration cycle detected starting at version "${current}".`);
      }
      visited.add(current);
      const next = this.migrations.find((m) => m.fromVersion === current);
      if (!next) {
        throw new Error(
          `No migration path found from "${from}" to "${to}" (stuck at "${current}").`,
        );
      }
      chain.push(next);
      current = next.toVersion;
    }
    return chain;
  }

  /** Migrates an AST to `targetVersion`, applying every intermediate step. */
  migrate(ast: JaroAst, targetVersion: string): JaroAst {
    const chain = this.resolveChain(ast.astVersion, targetVersion);
    return chain.reduce((acc, step) => step.migrate(acc), ast);
  }

  listMigrations(): Migration[] {
    return [...this.migrations];
  }
}

export function createMigrationRegistry(): MigrationRegistry {
  return new MigrationRegistry();
}
