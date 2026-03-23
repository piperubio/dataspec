## Why

String fields currently lack domain-specific constraints beyond `allowed_values`. Real-world data contracts need to express length bounds (`min_length`/`max_length`), semantic formats (`format`), and pattern matching (`pattern`) — all common in data contracts, OpenAPI, and JSON Schema. Adding these four constraints enables richer validation and clearer contract intent for string fields.

## What Changes

- Add `min_length` (number) constraint — positive integer, applies only to `string` fields
- Add `max_length` (number) constraint — positive integer, applies only to `string` fields
- Add `format` (string) constraint — open-ended metadata, no value validation (e.g., `email`, `uri`, `phone`)
- Add `pattern` (string) constraint — regex string, syntactically validated at parse time via `new RegExp()`
- Cross-constraint validation: `min_length` must be ≤ `max_length` when both present
- Activate dead code in `detectTypeNarrowing`/`detectConstraintTightening` for `max_length` and `pattern`
- Remove dead code for `format` in `detectTypeNarrowing` (format is pure metadata, not narrowing)

## Capabilities

### New Capabilities

- `string-constraints`: Defines `min_length`, `max_length`, `format`, and `pattern` constraints for string fields, including type restrictions, validation rules, and cross-constraint semantics.

### Modified Capabilities

- `allowed-values-constraint`: No requirement changes — `allowed_values` behavior is unchanged. Existing spec remains valid.

## Impact

- `FieldConstraints` interface in `packages/dataspec-core/src/types/contract.ts` — add four new optional properties
- `parseContractYaml()` in `packages/dataspec-core/src/parsers/contract.ts` — add parsing/validation logic for new constraints
- JSON Schema in `packages/dataspec-core/src/validation/` — update contract schema to accept new constraints
- `detectTypeNarrowing()` and `detectConstraintTightening()` in `packages/dataspec-cli/src/validation/validator.ts` — activate/clean dead code
- Test suite — add parser and validation tests for all four constraints and cross-constraint rules
