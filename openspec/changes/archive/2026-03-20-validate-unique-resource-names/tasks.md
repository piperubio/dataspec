# Implementation Tasks

## 1. Error Codes

- [x] 1.1 Add error code constants for `DUPLICATE_SOURCE_NAME`, `DUPLICATE_DATASET_NAME`, `DUPLICATE_CONTRACT_NAME`, `DUPLICATE_FLOW_NAME` in `packages/dataspec-cli/src/validation/error.ts` (if not already present as type)

## 2. Core Validation Logic

- [x] 2.1 Add `validateUniqueResourceNames()` private method to `Validator` class in `packages/dataspec-cli/src/validation/validator.ts`
- [x] 2.2 Implement source name uniqueness check using Map pattern to track first occurrence and report duplicates
- [x] 2.3 Implement dataset name uniqueness check using same Map pattern
- [x] 2.4 Implement contract name uniqueness check using same Map pattern
- [x] 2.5 Implement flow name uniqueness check using same Map pattern
- [x] 2.6 Add call to `validateUniqueResourceNames()` as first check in `validate()` method

## 3. Test Coverage

- [x] 3.1 Add test case for duplicate source name detection in `packages/dataspec-cli/__tests__/validator.test.ts`
- [x] 3.2 Add test case for duplicate dataset name detection
- [x] 3.3 Add test case for duplicate contract name detection
- [x] 3.4 Add test case for duplicate flow name detection
- [x] 3.5 Add test case for multiple duplicates of same name (three sources with same name)
- [x] 3.6 Add test case for multiple resource types each having duplicates
- [x] 3.7 Add test case verifying unique names pass validation without errors

## 4. Verification

- [x] 4.1 Run existing test suite to ensure no regressions (`bun test`)
- [x] 4.2 Run `bun run lint` to ensure code style compliance
- [x] 4.3 Manually test with a workspace containing duplicate names to verify error messages include file paths and line numbers
