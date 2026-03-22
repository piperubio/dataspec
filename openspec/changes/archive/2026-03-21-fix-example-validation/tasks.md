# Tasks: fix-example-validation

## Phase 1: Foundation Review

- [x] 1.1 Verify validation schema supports `location` and `contract` fields on source entities (referenced in proposal as already supported)

## Phase 2: Core Implementation

- [x] 2.1 Update `sourceYaml` in `createExamples()`: Add `location: public.users` to the users entity
- [x] 2.2 Update `sourceYaml` in `createExamples()`: Add `contract` object with `name: user_contract` and `version: "1.0.0"`
- [x] 2.3 Update `flowYaml` in `createExamples()`: Add `transform` step after extract (engine: dbt, input: raw_users, output: transformed_users)
- [x] 2.4 Update `flowYaml` in `createExamples()`: Add `load` step targeting `users_raw` dataset

## Phase 3: Testing / Verification

- [x] 3.1 Run `bunx dataspec init --with-examples --path /tmp/test-fix-validation` to generate examples
- [x] 3.2 Run `bunx dataspec validate` in the test directory to verify all YAMLs pass validation
- [x] 3.3 Clean up test directory

## Phase 4: Cleanup

- [x] 4.1 Remove any temporary test files
