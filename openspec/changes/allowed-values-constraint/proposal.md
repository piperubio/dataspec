## Why

DataSpec contracts support `unique`, `not_null`, and `ref` constraints for field validation, but lack the ability to restrict string fields to a specific set of permitted values. This is a common need for categorical data like status fields, category types, and enum-like values. Adding an `allowed_values` constraint improves data quality by preventing invalid values at the contract level.

## What Changes

- Add `allowed_values` property to `FieldConstraints` interface accepting an array of strings
- Only applicable to fields with `type: string`
- Validate that field values match one of the specified allowed values
- Follow the same constraint patterns as existing constraints (`unique`, `not_null`, `ref`)

## Capabilities

### New Capabilities

- `allowed-values-constraint`: Contract field constraint that restricts string fields to a defined set of permitted values

### Modified Capabilities

- `data-contracts`: Existing capability - adding new constraint type to the contract constraint system

## Impact

- `packages/dataspec-core/src/types/contract.ts` - `FieldConstraints` interface update
- `packages/dataspec-core/src/parsers/contract.ts` - YAML parser constraint handling
- `packages/dataspec-core/src/schemas/contract.schema.json` - JSON schema update
- `packages/dataspec-core/src/__tests__/contract.test.ts` - New test cases
- `skills/dataspec/references/contract.md` - Documentation update
