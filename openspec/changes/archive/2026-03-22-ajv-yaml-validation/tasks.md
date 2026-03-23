## 1. Setup — Add AJV Dependency

- [ ] 1.1 Add ajv ^8.12.0 to packages/dataspec-cli/package.json dependencies
<!-- Files: packages/dataspec-cli/package.json -->
- [ ] 1.2 Run `bun install` to update lockfile
<!-- Files: bun.lock -->

## 2. Core — Create Schema Validation Utility

- [ ] 2.1 Create packages/dataspec-cli/src/validation/schema-validator.ts with AJV instance configured (allErrors: true, strict: false) and compile validators for all 5 resource types (platform, source, contract, dataset, flow)
<!-- Files: packages/dataspec-cli/src/validation/schema-validator.ts -->
- [ ] 2.2 Implement validateAgainstSchema(data, type) function returning { valid: boolean, errors: string[] } with error format "${instancePath}: ${message}"
<!-- Files: packages/dataspec-cli/src/validation/schema-validator.ts -->
- [ ] 2.3 Verify that JSON schemas from @dataspec/dataspec-core/schemas are importable and compatible with AJV draft-07 compilation
<!-- Files: packages/dataspec-core/src/schemas/index.ts -->

## 3. Integration — Wire Schema Validation into CLI Parsing

- [ ] 3.1 Import schema-validator in packages/dataspec-cli/src/parsing/workspace.ts and call validateAgainstSchema after YAML parse, before resource classification
<!-- Files: packages/dataspec-cli/src/parsing/workspace.ts -->
- [ ] 3.2 Add schema validation step to packages/dataspec-cli/src/validation/validator.ts — run schema validation before semantic validation
<!-- Files: packages/dataspec-cli/src/validation/validator.ts -->
- [ ] 3.3 Ensure schema validation errors are included in the validation report with file path and severity (error)
<!-- Files: packages/dataspec-cli/src/validation/validator.ts, packages/dataspec-cli/src/validation/error.ts -->

## 4. Integration — Wire Schema Validation into Core Parsers

- [ ] 4.1 Add schema validation call at the top of parseContractYaml in packages/dataspec-core/src/parsers/contract.ts — throw on validation failure before manual checks
<!-- Files: packages/dataspec-core/src/parsers/contract.ts -->
- [ ] 4.2 Add schema validation call at the top of parseSourceYaml in packages/dataspec-core/src/parsers/source.ts
<!-- Files: packages/dataspec-core/src/parsers/source.ts -->
- [ ] 4.3 Add schema validation call at the top of parsePlatformYaml in packages/dataspec-core/src/parsers/platform.ts
<!-- Files: packages/dataspec-core/src/parsers/platform.ts -->
- [ ] 4.4 Add schema validation call at the top of parseDatasetYaml in packages/dataspec-core/src/parsers/dataset.ts
<!-- Files: packages/dataspec-core/src/parsers/dataset.ts -->
- [ ] 4.5 Add schema validation call at the top of parseFlowYaml in packages/dataspec-core/src/parsers/flow.ts
<!-- Files: packages/dataspec-core/src/parsers/flow.ts -->
- [ ] 4.6 Remove redundant manual validation checks in parsers that are now covered by JSON Schema validation (e.g., required field presence, type checks) — keep business logic checks (cross-field, cross-reference)
<!-- Files: packages/dataspec-core/src/parsers/contract.ts, packages/dataspec-core/src/parsers/source.ts, packages/dataspec-core/src/parsers/platform.ts, packages/dataspec-core/src/parsers/dataset.ts, packages/dataspec-core/src/parsers/flow.ts -->

## 5. Tests — Schema Validation Unit Tests

- [ ] 5.1 Create packages/dataspec-cli/src/validation/**tests**/schema-validator.test.ts with tests for valid data passing validation
<!-- Files: packages/dataspec-cli/src/validation/__tests__/schema-validator.test.ts -->
- [ ] 5.2 Add tests for invalid data returning descriptive errors with JSON paths
<!-- Files: packages/dataspec-cli/src/validation/__tests__/schema-validator.test.ts -->
- [ ] 5.3 Add tests for all 5 resource types (platform, source, contract, dataset, flow)
<!-- Files: packages/dataspec-cli/src/validation/__tests__/schema-validator.test.ts -->
- [ ] 5.4 Add tests for multiple errors being collected (allErrors: true behavior)
<!-- Files: packages/dataspec-cli/src/validation/__tests__/schema-validator.test.ts -->

## 6. Tests — Integration Tests

- [ ] 6.1 Update existing parser tests in packages/dataspec-core/src/**tests**/ to verify schema validation errors are thrown for malformed YAML
<!-- Files: packages/dataspec-core/src/__tests__/contract.test.ts, packages/dataspec-core/src/__tests__/source.test.ts -->
- [ ] 6.2 Add test case for schema validation running before semantic validation in workspace processing
<!-- Files: packages/dataspec-cli/src/__tests__/ (integration test file) -->
- [ ] 6.3 Verify that schema errors include file path in validation report output
<!-- Files: packages/dataspec-cli/src/__tests__/ (integration test file) -->

## 7. Cleanup — Verify and Run CI

- [ ] 7.1 Run `bun lint` and `bun format` to ensure code style compliance
<!-- Files: (all modified files) -->
- [ ] 7.2 Run `bun test` across all packages to verify no regressions
<!-- Files: (all modified files) -->
- [ ] 7.3 Verify CI pipeline passes (lint, format, test, build)
<!-- Files: (all modified files) -->
