## 1. Directory and Package Renames

- [ ] 1.1 Rename `packages/dpac-core/` to `packages/dataspec-core/` using `git mv`
- [ ] 1.2 Rename `packages/dpac-cli/` to `packages/dataspec-cli/` using `git mv`
- [ ] 1.3 Update `packages/dataspec-core/package.json` name: `@dataspec/dpac-core` → `@dataspec/dataspec-core`
- [ ] 1.4 Update `packages/dataspec-cli/package.json` name: `@dataspec/dpac-cli` → `@dataspec/dataspec-cli`
- [ ] 1.5 Update `packages/dataspec-cli/package.json` dependency path: `file:../dpac-core` → `file:../dataspec-core`
- [ ] 1.6 Update `packages/dataspec-cli/package.json` bin entry: `dpac` → `dataspec`
- [ ] 1.7 Rename CLI binary: `packages/dataspec-cli/bin/dpac` → `packages/dataspec-cli/bin/dataspec`

## 2. CLI Source Code Updates

- [ ] 2.1 Update `bin/dataspec` program name and description: `dpac` → `dataspec`
- [ ] 2.2 Update `packages/dataspec-cli/src/commands/init.ts` user-facing strings: "DPAC" → "dataspec"
- [ ] 2.3 Update `packages/dataspec-cli/src/commands/validate.ts` user-facing strings if any
- [ ] 2.4 Update `packages/dataspec-cli/src/commands/list.ts` user-facing strings if any
- [ ] 2.5 Update `packages/dataspec-cli/src/commands/show.ts` user-facing strings if any
- [ ] 2.6 Update `packages/dataspec-cli/src/parsing/workspace.ts` string references if any

## 3. Core Package Source Code Updates

- [ ] 3.1 Update `packages/dataspec-core/src/index.ts` JSDoc import example: `'dpac-core'` → `'dataspec-core'`
- [ ] 3.2 Update `packages/dataspec-core/src/parsers/contract.ts` JSDoc comment: "dpac-core package" → "dataspec-core package"
- [ ] 3.3 Update `packages/dataspec-core/src/types/index.ts` JSDoc comment: "dpac-core domain model"
- [ ] 3.4 Update `packages/dataspec-core/src/types/contract.ts` JSDoc comment: "dpac-core domain model"
- [ ] 3.5 Update `packages/dataspec-core/src/types/common.ts` JSDoc comment: "dpac-core domain model"

## 4. README and Documentation Updates

- [ ] 4.1 Update `packages/dataspec-core/README.md` all references: "dpac-core" → "dataspec-core", "DPAC" → "dataspec"
- [ ] 4.2 Update `packages/dataspec-cli/README.md` all references: "dpac-cli" → "dataspec-cli", "DPAC" → "dataspec", "@dataspec/dpac-cli" → "@dataspec/dataspec-cli"
- [ ] 4.3 Update `packages/dataspec-cli/CHANGELOG.md` references if any

## 5. OpenSpec Change Directory Renames

- [ ] 5.1 Rename `openspec/changes/dpac-lsp/` → `openspec/changes/dataspec-lsp/` using `git mv`
- [ ] 5.2 Rename `openspec/changes/dpac-docs/` → `openspec/changes/dataspec-docs/` using `git mv`

## 6. OpenSpec Spec File Content Updates (in-place)

- [ ] 6.1 Update `openspec/specs/cli-tooling/spec.md` Purpose line: "dpac-cli" → "dataspec-cli"
- [ ] 6.2 Update `openspec/specs/cli-tooling/spec.md` all `dpac validate`, `dpac init`, `dpac list`, `dpac show` → `dataspec` equivalents
- [ ] 6.3 Update `openspec/specs/cli-tooling/spec.md` "DPAC project" → "dataspec project"
- [ ] 6.4 Update `openspec/specs/source-management/spec.md` Purpose line: "dpac-core" → "dataspec-core"
- [ ] 6.5 Update `openspec/specs/data-contracts/spec.md` Purpose line: "dpac-cli" → "dataspec-cli"
- [ ] 6.6 Update all remaining spec files any "DPAC" or "dpac" references to "dataspec"

## 7. Verification

- [ ] 7.1 Run `grep -r "dpac" --include="*.ts" --include="*.json" --include="*.md" --include="*.sh"` to confirm no dpac references remain (excluding `openspec/changes/archive/`)
- [ ] 7.2 Verify CLI binary works: `bun run packages/dataspec-cli/bin/dataspec --help`
- [ ] 7.3 Verify core package builds: `cd packages/dataspec-core && bun run build`
- [ ] 7.4 Verify CLI package builds: `cd packages/dataspec-cli && bun run build`
- [ ] 7.5 Run tests: `bun test` at root
