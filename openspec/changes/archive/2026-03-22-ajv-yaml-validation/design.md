## Context

The dataspec project has two packages: `dataspec-core` (resource-level YAML parsers) and `dataspec-cli` (workspace-level scanning and semantic validation). Currently:

- **5 JSON Schemas** (draft-07) exist in `packages/dataspec-core/src/schemas/` but are only used for IDE support
- **Core parsers** (`parseContractYaml`, `parseSourceYaml`, etc.) use ~30+ hand-written `if`/`throw` checks per parser
- **CLI workspace parser** (`parsing/workspace.ts`) bypasses core parsers entirely, using `yaml` library directly
- **No runtime schema validation** exists — AJV is not a dependency anywhere
- The largest parser (`source.ts`) is 408 lines with extensive duplicated validation logic

## Goals / Non-Goals

**Goals:**

- Add AJV as a runtime JSON Schema validator for all 5 resource types
- Validate YAML against schema before parsing to catch structural errors early
- Produce descriptive error messages with JSON paths and messages
- Reduce duplicated manual validation in core parsers
- Maintain backward compatibility (no breaking API changes)

**Non-Goals:**

- Replacing the semantic validation layer (`Validator` class in `dataspec-cli`)
- Changing the workspace-level parsing architecture
- Migrating schemas from draft-07 to a newer JSON Schema version
- Adding schema validation for non-YAML formats

## Decisions

### Decision 1: AJV over alternatives

**Choice**: AJV (^8.12.0)
**Alternatives considered**:

- `jsonschema` (Python, not applicable)
- `zod` (TypeScript-first but doesn't support JSON Schema draft-07 natively)
- Custom validator (reinventing the wheel)

**Rationale**: AJV is the de facto standard for JSON Schema validation in Node.js/Bun. It supports draft-07 (our schema version), has excellent error reporting, and is battle-tested.

### Decision 2: Add AJV to dataspec-cli, not dataspec-core

**Choice**: `packages/dataspec-cli/package.json`
**Alternatives considered**:

- Add to `dataspec-core` (where schemas live)
- Add to both packages

**Rationale**: The CLI is the entry point for validation. Adding AJV here keeps `dataspec-core` dependency-light and avoids coupling the core library to a specific validation implementation. The validation utility in the CLI can import schemas from core via the existing workspace link.

### Decision 3: Validate before parsing, not during

**Choice**: Separate validation pass before YAML→object parsing
**Alternatives considered**:

- Inline validation inside each parser
- Post-parse validation

**Rationale**: Pre-parse validation provides a single validation gate. Errors are reported before any parsing logic runs, giving users clear feedback. This also allows the validation utility to be reused by both core parsers and CLI workspace parsing.

### Decision 4: Keep AJV instance in a dedicated utility module

**Choice**: `packages/dataspec-cli/src/validation/schema-validator.ts`
**Alternatives considered**:

- Inline AJV calls in each parser
- Singleton in `dataspec-core`

**Rationale**: A dedicated module centralizes AJV configuration (allErrors: true, strict: false), compiles validators once at module load, and provides a clean `validateAgainstSchema(data, type)` API. This is the natural integration point for both parser layers.

## Risks / Trade-offs

- [AJV bundle size] → AJV is ~300KB but only loaded in CLI context, not a concern for a server-side tool
- [Schema compilation cost at startup] → Validators are compiled once at module load and cached; negligible impact
- [Error format mismatch] → AJV errors use `instancePath` and `message` fields; may need adaptation to match existing error reporting format with line numbers from the `yaml` library
- [Parser simplification scope] → Not all manual checks can be removed; some are business logic (e.g., cross-field validation) not covered by JSON Schema

## Parallelism Considerations

**Shared contract that must be defined first**: The `validateAgainstSchema(data, type)` function signature and error format in `schema-validator.ts`.

**Independent work streams after shared contract**:

1. **Stream A**: Create the validation utility (`schema-validator.ts`) + add AJV dependency
2. **Stream B**: Integrate validation into core parsers (simplify manual checks)
3. **Stream C**: Integrate validation into CLI workspace parsing flow
4. **Stream D**: Update/add tests for schema validation

**Serialization points**: Stream B and C depend on Stream A being complete (the utility must exist before integration).

## Open Questions

- Should AJV validation errors include line numbers? This requires mapping AJV's JSON paths back to YAML positions using the `yaml` library's CST — may be a follow-up enhancement.
- How much of the existing manual validation in parsers can be safely removed vs. kept as additional checks?
