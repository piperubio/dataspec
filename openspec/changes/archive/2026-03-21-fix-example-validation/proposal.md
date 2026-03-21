# Proposal: fix-example-validation

## Intent

Fix `dataspec init --with-examples` to generate validation-compliant YAML resources. Currently, example YAMLs fail validation because source entities are missing required `location` and `contract` fields, flows lack `transform`/`load` steps, and datasets are orphaned.

## Scope

### In Scope
- Add `location` field to example database entity (e.g., `public.users`)
- Add `contract` field with `name` and `version` to example entities
- Complete the example flow with `transform` and `load` steps
- Link the dataset to the flow's load target

### Out of Scope
- Schema changes to validation layer
- Additional example scenarios beyond the basic ETL pattern
- CLI behavior changes beyond `--with-examples`

## Approach

Modify `packages/dataspec-cli/src/commands/init.ts` `createExamples()` function:

1. **Source entity** — Add `location: public.users` and `contract: { name: user_contract, version: 1.0.0 }`
2. **Flow** — Add `transform` step using `dbt` engine, add `load` step targeting `users_raw`
3. **Dataset** — Keep `users_raw` as-is (already has required fields)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/dataspec-cli/src/commands/init.ts` | Modified | Update `createExamples()` to generate validation-compliant YAMLs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing `--with-examples` users | Low | Changes only add missing fields; existing valid examples unaffected |

## Rollback Plan

Revert changes to `createExamples()` in `packages/dataspec-cli/src/commands/init.ts`. No migration needed since this only affects new project initialization.

## Dependencies

- Validation schema already supports all required fields (no schema changes needed)

## Success Criteria

- [ ] `dataspec init --with-examples` generates resources that pass `dataspec validate`
- [ ] Example flow has complete ETL: extract → transform → load
- [ ] Dataset is linked as flow's load target
