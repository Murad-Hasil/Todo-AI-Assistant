# Research: Phase 5.1 — Event-Driven Infrastructure (Dapr & Kafka)

**Branch**: `008-dapr-kafka-infra` | **Date**: 2026-03-08

---

## Decision 1: Dapr PubSub Component — pubsub.kafka

**Decision**: Use `pubsub.kafka` v1 with `authType: password` and `saslMechanism: SHA-256` to connect to Redpanda Cloud.

**Rationale**: Redpanda is Kafka-API compatible. The `pubsub.kafka` component supports SASL/SCRAM-SHA-256 which is Redpanda's default cloud authentication. The `secretKeyRef` pattern in component metadata lets credentials stay in K8s Secrets — zero plaintext in committed YAMLs.

**Alternatives considered**:
- `pubsub.redpanda` — Does not exist as a separate Dapr component; Redpanda uses the standard Kafka component.
- Strimzi in-cluster Kafka — Avoided per constitution preference for managed cloud broker; adds cluster complexity.

**Exact component type/version**: `pubsub.kafka` / `v1`

**Required metadata fields**:
| Field | Value/Source |
|-------|-------------|
| `brokers` | Redpanda bootstrap server (e.g. `seed-xxx.cloud.redpanda.com:9092`) |
| `authType` | `"password"` |
| `saslUsername` | `secretKeyRef` → `dapr-secrets` key `REDPANDA_USERNAME` |
| `saslPassword` | `secretKeyRef` → `dapr-secrets` key `REDPANDA_PASSWORD` |
| `saslMechanism` | `"SHA-256"` |
| `consumerGroup` | `"todoai-consumers"` |
| `clientID` | `"todoai-dapr"` |
| `maxMessageBytes` | `"1048576"` (1 MB default) |

---

## Decision 2: Dapr State Store — state.postgresql

**Decision**: Use `state.postgresql` v1 with `connectionString` sourced from `dapr-secrets` K8s Secret.

**Rationale**: Neon PostgreSQL is already provisioned and its connection string is in the existing cluster secret. Adding the Dapr state store on the same database instance avoids provisioning a new service. The component auto-creates its `dapr_state` and `dapr_metadata` tables — no Alembic migration required.

**Alternatives considered**:
- Redis state store — Would require a new in-cluster Redis pod or managed service; adds cost and complexity.
- Separate PostgreSQL instance — Unnecessary; Neon supports multiple schemas/tables on one cluster.

**Exact component type/version**: `state.postgresql` / `v1`

**Required metadata fields**:
| Field | Value/Source |
|-------|-------------|
| `connectionString` | `secretKeyRef` → `dapr-secrets` key `DATABASE_URL` |
| `tableName` | `"dapr_state"` (auto-created) |
| `metadataTableName` | `"dapr_metadata"` (auto-created) |
| `timeout` | `"30s"` |

---

## Decision 3: Secret Store Strategy — Single `dapr-secrets` Kubernetes Secret

**Decision**: Create one Kubernetes Secret named `dapr-secrets` in the `default` namespace containing all Dapr-specific credentials. Reference it via `secretKeyRef` in component manifests.

**Rationale**: Dapr in Kubernetes mode automatically resolves `secretKeyRef` references from K8s Secrets in the same namespace — no Dapr `secretstore` component required for this. Consolidating into one Secret (`dapr-secrets`) keeps the pattern consistent and mirrors the existing `todoai-backend-secret` pattern from Phase 4.

**Keys in `dapr-secrets`**:
- `REDPANDA_BOOTSTRAP_SERVER` — bootstrap server URL
- `REDPANDA_USERNAME` — SASL username
- `REDPANDA_PASSWORD` — SASL password
- `DATABASE_URL` — Neon PostgreSQL connection string (same value as in `todoai-backend-secret`)

**Alternatives considered**:
- Using a Dapr `secretstore` component (e.g., `secretstores.kubernetes`) — Valid but adds an extra component step; K8s native `secretKeyRef` is simpler for local Minikube.
- Separate secrets per component — Creates duplication; single secret is easier to manage.

---

## Decision 4: Subscription API Version — v1alpha1

**Decision**: Use `dapr.io/v1alpha1` Subscription resources for Phase 5.1 (simpler single-route pattern).

**Rationale**: Phase 5.1 only establishes infrastructure; no consumer services exist yet. v1alpha1 Subscriptions define topic→route mappings that will be used by the Notification Service in Phase 5.2. v2alpha1 with CEL filtering is deferred until Phase 5.2 when routing rules become necessary.

**Subscription plan**:
| Topic | Subscriber app-id | Callback route |
|-------|-------------------|----------------|
| `task-events` | `todo-backend` (future: notification-service) | `/dapr/subscribe` (placeholder) |
| `reminders` | `notification-service` (Phase 5.2) | `/dapr/subscribe` |
| `task-updates` | `todo-frontend` (Phase 5.4) | `/dapr/subscribe` |

**Note**: Phase 5.1 only creates Subscriptions as manifests. Actual consumer code (callback handlers) is Phase 5.2's responsibility.

---

## Decision 5: Dapr Sidecar Annotations Location

**Decision**: Add Dapr annotations to `spec.template.metadata.annotations` in each Helm Deployment template (not `metadata.annotations` at the Deployment level).

**Rationale**: Dapr Sidecar Injector webhook watches Pod creation events, not Deployment-level metadata. Annotations must be on the Pod template to trigger injection.

**Minimum required annotations**:
```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "todo-backend"   # or "todo-frontend"
  dapr.io/app-port: "8000"         # or "3000"
  dapr.io/log-level: "info"
```

---

## Decision 6: Dapr Control Plane Installation

**Decision**: Install Dapr into the existing Minikube cluster using `dapr init --kubernetes --wait` (Dapr CLI method, not Helm).

**Rationale**: Dapr CLI installs the control plane (dapr-operator, dapr-sidecar-injector, dapr-placement, dapr-scheduler) into `dapr-system` namespace in one command. This is the recommended path for local development and avoids managing a second Helm release manually.

**Prerequisites**: Dapr CLI installed (`dapr` command). Install via:
```bash
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
```

---

## Resolved: No NEEDS CLARIFICATION Remaining

All unknowns from spec FR-001 through FR-012 are resolved above. Plan is ready to generate.
