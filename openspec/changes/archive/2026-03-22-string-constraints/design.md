## Context

The `FieldConstraints` interface currently supports constraints for numeric types (`min`, `max`, `precision`, `scale`) and general constraints (`unique`, `not_null`, `ref`, `allowed_values`). String fields lack domain-specific constraints for length, format, and pattern matching — common features in data contract specifications (OpenAPI, JSON Schema, Avro).

The codebase already has dead code in `detectTypeNarrowing()` and `detectConstraintTightening()` referencing `format`, `max_length`, and `pattern`, indicating prior intent to support these constraints.

## Goals / Non-Goals

**Goals:**

- Add `min_length`, `max_length`, `format`, and `pattern` to `FieldConstraints`
- Enforce type restrictions (string-only) at parse time
- Validate constraint values at parse time (positive integers, valid regex)
- Cross-constraint validation: `min_length <= max_length`
- Activate existing dead code for `max_length` and `pattern`

**Non-Goals:**

- Runtime value validation (e.g., checking if a string matches `pattern` or `format`)
- Predefined list of valid `format` values — it is open-ended metadata
- Breaking change detection for string constraints (defer to future work)

## Decisions

### D1: `format` is pure metadata, no validation

The `format` field stores an arbitrary string (e.g., `email`, `uri`, `phone`). No predefined enum or value validation. This mirrors OpenAPI's approach where format is a hint, not a constraint. Dead code in `detectTypeNarrowing()` that treats `format` as type-narrowing will be **removed** — format is metadata, not a narrowing constraint.

### D2: `pattern` validated syntactically at parse time

`pattern` stores a regex string. At parse time, construct `new RegExp(pattern)` to verify syntactic validity. Invalid regex throws an error. Actual value matching is NOT performed at parse time.

### D3: `min_length` / `max_length` are positive integers

Both must be positive integers (`>= 1`). When both present, `min_length <= max_length` must hold. This follows the same pattern as `min`/`max` for numeric types.

### D4: Activate dead code for `max_length` and `pattern`

`detectTypeNarrowing()` already has branches for `max_length` and `pattern` — these will be activated once the constraints exist in `FieldConstraints`. `detectConstraintTightening()` will add detection for `min_length` and `max_length` as tightening constraints.

### Alternatives Considered

- **Enum for `format`**: Rejected — too restrictive, different teams use different formats
- **Lazy regex validation**: Rejected — catching invalid patterns at parse time is more developer-friendly

## Risks / Trade-offs

- [Unvalidated `format` values] → Mitigation: Document as metadata-only; downstream tooling can enforce conventions if needed
- [Regex complexity/denial-of-service] → Mitigation: Parse-time only, no runtime matching in this change; consider ReDoS protection as future work

## Parallelism Considerations

**Shared interface**: `FieldConstraints` type change must be made first — it is the contract that all other work depends on.

**Independent after interface update:**

1. Parser logic (`contract.ts`) — add parsing and validation
2. JSON Schema update — add new constraint properties
3. Validator dead code cleanup (`validator.ts`) — activate/clean branches
4. Tests — can be written in parallel with implementation

**Serialization point**: Type definition → Parser → Tests

## Open Questions

None — all design decisions resolved in the context provided.
