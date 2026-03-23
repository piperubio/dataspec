## Why

The current YAML parsers in `dataspec-core` perform manual, hand-written validation with ~30+ imperative checks per parser (e.g., `if (!parsed.name || typeof parsed.name !== 'string') throw new Error(...)`). JSON Schemas already exist in `packages/dataspec-core/src/schemas/` (draft-07) but are only used for IDE support — not at runtime. This results in duplicated validation logic, inconsistent error messages, and a maintenance burden when schemas change. Adding AJV runtime validation eliminates this duplication and provides standardized, descriptive errors.

## What Changes

- Add `ajv` (^8.12.0) as a dependency to `packages/dataspec-cli/package.json`
- Create a schema validation utility (`packages/dataspec-cli/src/validation/schema-validator.ts`) that compiles and exposes AJV validators for all 5 resource types (platform, source, contract, dataset, flow)
- Integrate schema validation into the YAML loading pipeline — validate against JSON Schema **before** parsing
- Simplify core parsers by removing redundant manual validation checks that AJV now covers
- Update tests to verify schema validation errors are descriptive (include JSON path and message)

## Capabilities

### New Capabilities

- `schema-validation`: AJV-powered runtime JSON Schema validation for YAML resource files. Covers validation utility creation, integration into the parse pipeline, and error formatting with JSON paths.

### Modified Capabilities

- `validation-engine`: Existing semantic validation layer in `dataspec-cli`. The new schema validation runs before semantic validation, catching structural errors earlier in the pipeline.

## Impact

- **Packages affected**: `packages/dataspec-core` (parsers simplified), `packages/dataspec-cli` (new dependency + validation utility)
- **Dependencies**: New `ajv` ^8.12.0 in `dataspec-cli`
- **Breaking changes**: None — validation errors become more descriptive but the API surface stays the same
- **Tests**: Existing parser tests may need updates if error messages change format
