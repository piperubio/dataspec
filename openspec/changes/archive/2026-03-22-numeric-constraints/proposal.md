## Why

Data contracts currently lack constraints for numeric fields, making it impossible to enforce precision, scale, or value ranges at the specification level. This gap leads to inconsistent numeric data quality across pipelines and forces validation to happen downstream where fixes are more costly. Issue #14 specifically requests precision and scale constraints for numeric types to ensure data contracts can properly define and enforce numeric field requirements.

Without these constraints, teams cannot:

- Enforce decimal precision (total digits) and scale (decimal places)
- Define valid value ranges with inclusive minimum/maximum bounds
- Catch numeric data quality issues at contract validation time

## What Changes

Add numeric constraints to `FieldConstraints`:

- `precision?: number` — total number of digits (decimal type only, positive integer)
- `scale?: number` — number of decimal places (decimal type only, positive integer, must be ≤ precision)
- `min?: number` — inclusive minimum value (integer and decimal types)
- `max?: number` — inclusive maximum value (integer and decimal types)

These constraints extend the existing constraint system without breaking changes. All new fields are optional, so existing contracts remain valid.

## Capabilities

### Modified Capabilities

- `data-contracts`: FieldConstraints definition expands to include numeric constraints (`precision`, `scale`, `min`, `max`) with type-specific applicability rules and validation requirements

## Impact

### Code Changes

- `packages/dataspec-core/src/types/contract.ts` — add fields to FieldConstraints interface
- `packages/dataspec-core/src/schemas/contract.schema.json` — add properties to FieldConstraints definition
- `packages/dataspec-core/src/parsers/contract.ts` — add parsing and validation logic
- `packages/dataspec-core/src/__tests__/contract.test.ts` — add test coverage
- `packages/dataspec-cli/src/validation/validator.ts` — enable type narrowing validation, add consistency checks

### Documentation

- `skills/dataspec/references/contract.md` — document new constraints
- `openspec/specs/data-contracts/spec.md` — add requirements for numeric constraints
