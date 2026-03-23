## 1. Type Definition

- [x] 1.1 Add `min_length`, `max_length`, `format`, and `pattern` optional properties to `FieldConstraints` interface
<!-- Files: packages/dataspec-core/src/types/contract.ts -->

## 2. Parser Implementation

- [x] 2.1 Add `min_length` parsing with type and value validation in `parseContractYaml`
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->

- [x] 2.2 Add `max_length` parsing with type and value validation in `parseContractYaml`
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->

- [x] 2.3 Add cross-constraint validation for `min_length <= max_length` when both present
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->

- [x] 2.4 Add `format` parsing with string-type restriction in `parseContractYaml`
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->

- [x] 2.5 Add `pattern` parsing with string-type restriction and regex syntax validation via `new RegExp()` in `parseContractYaml`
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->

## 3. JSON Schema Update

- [x] 3.1 Add `min_length` property (positive integer) to contract field constraints schema
<!-- Files: packages/dataspec-core/src/validation/contract-schema.ts -->

- [x] 3.2 Add `max_length` property (positive integer) to contract field constraints schema
<!-- Files: packages/dataspec-core/src/validation/contract-schema.ts -->

- [x] 3.3 Add `format` property (string) to contract field constraints schema
<!-- Files: packages/dataspec-core/src/validation/contract-schema.ts -->

- [x] 3.4 Add `pattern` property (string) to contract field constraints schema
<!-- Files: packages/dataspec-core/src/validation/contract-schema.ts -->

## 4. Validator Dead Code Cleanup

- [x] 4.1 Remove dead code for `format` in `detectTypeNarrowing` — format is metadata, not narrowing
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->

- [x] 4.2 Activate `max_length` detection in `detectTypeNarrowing`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->

- [x] 4.3 Activate `pattern` detection in `detectTypeNarrowing`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->

- [x] 4.4 Add `min_length` tightening detection in `detectConstraintTightening`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->

- [x] 4.5 Add `max_length` tightening detection in `detectConstraintTightening`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->

## 5. Parser Tests

- [x] 5.1 Add tests for valid `min_length` on string field
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.2 Add tests for `min_length` rejection on non-string fields
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.3 Add tests for `min_length` rejection with zero/negative/non-integer values
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.4 Add tests for valid `max_length` on string field
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.5 Add tests for `max_length` rejection on non-string fields and invalid values
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.6 Add tests for `min_length > max_length` cross-constraint rejection
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.7 Add tests for valid `format` on string field with arbitrary values
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.8 Add tests for `format` rejection on non-string fields
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.9 Add tests for valid `pattern` on string field
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.10 Add tests for `pattern` rejection on non-string fields
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.11 Add tests for `pattern` rejection with invalid regex syntax
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

- [x] 5.12 Add test for all string constraints combined on one field
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

## 6. Validation

- [x] 6.1 Run `bun lint` and `bun format` to ensure code quality
<!-- Files: packages/dataspec-core/src/types/contract.ts, packages/dataspec-core/src/parsers/contract.ts -->

- [x] 6.2 Run `bun run build` in `packages/dataspec-cli` to verify compilation
<!-- Files: packages/dataspec-cli/package.json -->

- [x] 6.3 Update ecommerce example with a string constraint to validate end-to-end
<!-- Files: examples/ecommerce-platform/ -->
