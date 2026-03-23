## Context

DataSpec currently supports `unique`, `not_null`, `ref`, and `allowed_values` constraints via the `FieldConstraints` interface. Numeric fields (integer, decimal) have no type-specific constraints, limiting expressiveness for schemas that need to enforce value ranges or decimal precision.

The JSON schema for contracts uses `additionalProperties: false` on `FieldConstraints`, which means any new constraint fields are currently rejected at parse time. The validator already contains dead code checking for `precision` and `scale` in `detectTypeNarrowing()` — evidence this was anticipated but never completed.

## Goals / Non-Goals

**Goals:**

- Add `precision` and `scale` constraints for `decimal` type fields, following SQL decimal semantics
- Add `min` and `max` constraints for `integer` and `decimal` type fields
- Enforce type-specific validation rules (e.g., `precision` only allowed on `decimal`)
- Maintain backward compatibility — all new constraints are optional
- Activate existing dead code in the validator

**Non-Goals:**

- Exclusive bounds (`min_exclusive`, `max_exclusive`) — deferred for simplicity
- Numeric constraints on `string` or other non-numeric types
- Arbitrary precision arithmetic or runtime value checking
- Migration tooling for existing contracts

## Decisions

### Precision/scale restricted to decimal (not integer)

Integers have fixed precision (32/64-bit) and scale of 0 by definition. Precision/scale are meaningful for decimal types where variable precision is a user concern (e.g., `decimal(10,2)` for currency). Adding these to integer would be semantically confusing and unused in practice.

### Inclusive-only bounds

`min` and `max` use inclusive comparison (`<=`, `>=`) exclusively. Exclusive variants (`min_exclusive`, `max_exclusive`) add API surface without clear benefit for a spec validation tool. Users needing exclusive bounds can adjust their values by one unit. This mirrors JSON Schema's approach.

### Precision and scale must appear together

A `precision` without `scale` (or vice versa) is ambiguous — SQL also requires both. The parser will reject a field that specifies only one. Scale must be ≤ precision (you can't have more decimal places than total digits).

### Validation order in parser

The parser validates constraints in this order:

1. Type check — constraint is allowed for this field type
2. Value type check — constraint value has correct shape (number, array, etc.)
3. Semantic checks — scale ≤ precision, min ≤ max, positive integers for precision/scale

This order produces clear, incremental error messages.

### Activating dead code in validator

`detectTypeNarrowing()` at `packages/dataspec-cli/src/validation/validator.ts:1005-1042` already contains:

```typescript
field.constraints?.precision !== undefined && field.constraints?.scale !== undefined;
```

This guard will become functional once the type definition includes these fields. No structural change to the detection logic is needed — only the type and schema must be updated first.

## Risks / Trade-offs

**Risk: Breaking contracts with `additionalProperties: false`**
The JSON schema currently rejects unknown fields. Adding new fields requires updating both the schema and the parser atomically. If schema is updated before parser, fields will pass JSON validation but fail parse validation (or silently ignored). Mitigation: update schema and parser in the same change.

**Risk: Dead code activation ordering**
The validator dead code references `precision`/`scale` but the TypeScript types don't define them yet. Once types are updated, this code compiles. However, the parser must also populate these fields for the validator to ever see them. If the chain is incomplete, the dead code stays dead. Mitigation: integration tests that exercise the full pipeline.

**Trade-off: No exclusive bounds**
Some use cases (e.g., "strictly positive") require `> 0` not `>= 0`. Users must use `min: 1` for integers or `min: 0.01` for decimals. Acceptable trade-off for reduced complexity. Can be added later without breaking changes.

## Parallelism Considerations

The work splits into a dependency graph with one serialization point:

**Must be sequential (shared contract):**

1. `packages/dataspec-core/src/types/contract.ts` — update `FieldConstraints` interface
2. `packages/dataspec-core/src/schemas/contract.schema.json` — update JSON schema

These define the contract that all other components depend on. Must be done first and committed together.

**Can be parallelized (after contract is defined):**

- `packages/dataspec-core/src/parsers/contract.ts` — add type/semantic validation for new constraints
- `packages/dataspec-cli/src/validation/validator.ts` — activate dead code, add min/max tightening detection to `detectConstraintTightening()`
- `packages/dataspec-core/src/tests/` — parser validation tests
- `packages/dataspec-cli/src/tests/` — validator integration tests
- Documentation updates

**Shared interfaces:**

- `FieldConstraints` is the single shared contract — all components reference this type
- Error message format (reuse existing pattern from `allowed_values` validation)
- Validation error codes (if a code system exists)

**Tests span all layers:**
Unit tests for parser logic can be written alongside parser changes. Integration tests that exercise JSON schema → parser → validator require all pieces to be complete and should be written last or by a coordinating agent.
