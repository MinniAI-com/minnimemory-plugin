# Ledger API

Ledger is a small double-entry bookkeeping service: a Fastify HTTP API over Postgres, with a
nightly reconciliation worker. Single package, TypeScript throughout.

## Conventions

- All money is stored as integer cents. Never use floats for currency anywhere.
- Every write goes through a repository function. Route handlers never touch the database.
- Errors thrown across a service boundary are typed. No bare `throw new Error`.
- Prefer small pull requests. One behaviour change per PR.
- Never log a token, even truncated.

## Architecture

Requests enter through `src/http/`, which validates and hands off to `src/services/`. Services
compose repository calls from `src/repo/` inside a single transaction per request. The
reconciliation worker in `src/worker/` reuses the same services and runs on a cron schedule.
There is no message queue.

## Commands

- `npm test` runs the unit tests. Integration tests need a database: `npm run db:up`, then
  `npm run test:integration`. Run them before any pull request that touches `src/repo/`.
- `npm run test:reconcile` is the slow reconciliation suite.
- `npm run migrate:new <name>` adds a migration; edit the generated file.

## Current status

As of 2026-08-30 the billing rewrite is in progress and blocked on review of the new posting
rules. The flaky reconciliation test is still skipped. Next steps: land the posting rules, then
unskip the test, then cut 1.4.0.

## Authentication

Bearer tokens are verified against the auth service on every request, cached for sixty seconds
by token hash. Service-to-service calls use a signed header, not a bearer token. The cache is
keyed by token hash, so a revoked token can stay valid for up to a minute.

## Error handling

Every service throws one of the typed errors in `src/errors.ts`. The HTTP layer maps them to
status codes in exactly one place, `src/http/errorMap.ts`. Unknown errors become a 500 with a
correlation id and are never surfaced to the client with their message.

## Deployment

Pushing to main builds a container and deploys to staging automatically. Production is a
manual promotion from the staging build. Migrations run before the new version starts; a
migration that cannot roll back must be split into two deploys. Rollback is a promotion of the
previous staging build; the database is not rolled back, which is why migrations are additive.

## Common tasks

- Add an endpoint: schema in `src/http/schemas/`, handler in `src/http/routes/`, service call.
- Rotate the signing key: update the secret, deploy, then revoke the old key after one hour.
- Replay a day of postings: `npm run replay -- --date YYYY-MM-DD`, on staging first.

## Incident notes

- 2026-08-26 the reconciliation worker double-posted a batch after a retry; fixed by the
  idempotency key on `postBatch`. Watch for `duplicate posting` in the worker log.
- 2026-08-12 staging ran out of connections under the load test; the pool went from 10 to 25.
- 2026-07-30 a migration locked `postings` for four minutes; migrations now run `CONCURRENTLY`.
- 2026-07-16 the auth cache served a revoked token for a minute; accepted, documented above.

## Changelog

- 2026-08-28 posting rules draft merged behind a flag
- 2026-08-21 reconciliation worker moved to the shared services layer
- 2026-08-14 typed errors introduced, error map centralised
- 2026-08-07 v1.3.0 released
- 2026-07-24 signed service-to-service header replaced the shared secret
- 2026-07-10 v1.2.0 released, with the nightly reconciliation worker
- 2026-06-26 repository layer introduced; route handlers no longer touch the database
- 2026-06-12 v1.1.0 released
