## 1. Type Definition & Schema (Serialization Point)

- [x] 1.1 Add `precision`, `scale`, `min`, `max` to `FieldConstraints` interface
<!-- Files: packages/dataspec-core/src/types/contract.ts -->
- [x] 1.2 Update JSON schema to allow new constraint properties on `FieldConstraints`
<!-- Files: packages/dataspec-core/src/schemas/contract.schema.json -->

## 2. Parser — Precision/Scale Validation

- [x] 2.1 Parse `precision` and `scale` from YAML, coerce to numbers
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [x] 2.2 Validate precision/scale only allowed on `decimal` type
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [x] 2.3 Validate precision and scale must both be present (or neither)
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [x] 2.4 Validate precision and scale are positive integers
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [x] 2.5 Validate scale ≤ precision
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->

## 3. Parser — Min/Max Validation

- [x] 3.1 Parse `min` and `max` from YAML, coerce to numbers
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [x] 3.2 Validate min/max only allowed on `integer` or `decimal` type
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [x] 3.3 Validate min and max are finite numbers
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [x] 3.4 Validate min ≤ max when both present
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->

## 4. Validator — Type Narrowing & Constraint Tightening

- [ ] 4.1 Verify `detectTypeNarrowing()` activates for precision/scale changes
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->
- [ ] 4.2 Add min/max constraint tightening detection in `detectConstraintTightening()`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->
- [ ] 4.3 Add precision/scale tightening detection in `detectConstraintTightening()`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->
- [ ] 4.4 Add consistency check: precision/scale only on decimal in `validateContractConsistency()`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->
- [ ] 4.5 Add consistency check: min/max only on numeric types in `validateContractConsistency()`
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->

## 5. Tests — Parser

- [x] 5.1 Test valid precision/scale on decimal field
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [ ] 5.2 Test precision/scale rejected on integer/string/other types
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [x] 5.3 Test scale > precision rejected
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [x] 5.4 Test precision without scale (and vice versa) rejected
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [ ] 5.5 Test non-positive precision/scale rejected
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [ ] 5.6 Test valid min/max on integer and decimal fields
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [ ] 5.7 Test min/max rejected on string/boolean/other types
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [ ] 5.8 Test min > max rejected
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->
- [ ] 5.9 Test non-finite min/max rejected
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts -->

## 6. Tests — Validator Integration

- [ ] 6.1 Test breaking change detection for tightened precision/scale
<!-- Files: packages/dataspec-cli/__tests__/validator.test.ts -->
- [ ] 6.2 Test breaking change detection for tightened min/max
<!-- Files: packages/dataspec-cli/__tests__/validator.test.ts -->
- [ ] 6.3 Test consistency validation rejects precision/scale on non-decimal
<!-- Files: packages/dataspec-cli/__tests__/validator.test.ts -->

## 7. Documentation

- [x] 7.1 Update contract reference docs with numeric constraints
<!-- Files: skills/dataspec/references/contract.md -->
- [x] 7.2 Update `data-contracts` spec in main specs (sync delta)
<!-- Files: openspec/specs/data-contracts/spec.md -->
