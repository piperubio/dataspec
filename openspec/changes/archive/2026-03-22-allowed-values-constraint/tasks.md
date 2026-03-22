## 1. Type Definition

- [x] 1.1 Add `allowed_values?: string[]` to `FieldConstraints` interface in `packages/dataspec-core/src/types/contract.ts`

## 2. Parser Implementation

- [x] 2.1 Add parsing logic for `allowed_values` constraint in `packages/dataspec-core/src/parsers/contract.ts`
- [x] 2.2 Add validation that `allowed_values` is only used with `type: string`

## 3. JSON Schema

- [x] 3.1 Add `allowed_values` property to `FieldConstraints` in `packages/dataspec-core/src/schemas/contract.schema.json`

## 4. Tests

- [x] 4.1 Add test for parsing valid `allowed_values` constraint
- [x] 4.2 Add test for `allowed_values` on non-string field (should error)
- [x] 4.3 Add test for empty `allowed_values` array

## 5. Documentation

- [x] 5.1 Update `skills/dataspec/references/contract.md` with `allowed_values` constraint documentation
