# Dataspec

**Dataspec — PROPUESTA DE VALOR:** Una única fuente de verdad, declarativa y en YAML, para modelar toda tu plataforma de datos — sources, contracts, datasets y flows — independiente de herramientas, versionable en Git y validable en CI/CD, diseñada tanto para humanos como para agentes de IA.

> ⚠️ **Dataspec está en desarrollo y aún no ha sido publicado.** Puede sufrir modificaciones (incluidos cambios incompatibles) sin previo aviso.

## ¿Qué es Dataspec?

DataSpec (_Declarative Data Platform Architecture_ / _Data Platform Specs_) es un toolset para diseñar especificaciones de plataformas de datos mediante un **DSL declarativo basado en YAML**. Describe _qué es_ tu plataforma — no _cómo se ejecuta_ — separando el diseño arquitectónico de las herramientas específicas (orquestadores, motores de transformación, catálogos, etc.).

El proyecto incluye la lógica central (`@dataspec/dataspec-core`), la CLI (`@dataspec/dataspec-cli`), la integración con DataHub (`@dataspec/dataspec-datahub`) y una skill para agentes de IA. El desarrollo sigue un enfoque de **desarrollo dirigido por especificaciones** mediante el framework [OpenSpec](./openspec/).

### El problema que resuelve

Los stacks modernos de datos están fragmentados: frameworks de orquestación, herramientas de ingesta, motores de transformación y plataformas de gobernanza cada uno define su propio modelo propietario. Dataspec ofrece un lenguaje de modelado unificado a nivel de plataforma que abarca todo el ciclo de vida del datos, desde la ingesta hasta el serving.

## Capacidades, funcionalidades y procesos

### Modelo de recursos (DSL)

Dataspec modela 5 tipos de recursos dentro de una carpeta `dataspec/`:

| Recurso      | Ubicación                           | Propósito                                                                                                |
| ------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Platform** | `dataspec/platform.yaml` (uno solo) | Configuración global: storage backends, engines, defaults                                                |
| **Source**   | `dataspec/sources/*.yaml`           | Productores de datos externos (`database`, `api`, `file_system`, `streaming`, `saas`) — sin credenciales |
| **Contract** | `dataspec/contracts/*.yaml`         | Schemas versionados (semver) con 8 tipos de dato y constraints                                           |
| **Dataset**  | `dataspec/datasets/*.yaml`          | Unidades lógicas de datos con storage backend, formato y ubicación                                       |
| **Flow**     | `dataspec/flows/*.yaml`             | Pipelines ETL/ELT con steps `extract` → `transform` → `load`                                             |

Puntos clave del modelo:

- **Contract-first**: los contracts se definen primero y todo source/dataset los referencia.
- **Storage**: `s3`, `postgresql`, `clickhouse`. **Engines**: `spark`, `duckdb`, `dbt`, `python`.
- **Unicidad de nombres** obligatoria en todos los recursos.
- **Definitions-only**: sin connection strings ni credenciales reales (se manejan en deployment).

### Motor de validación

Validación en dos fases — JSON Schema (AJV) y luego validación semántica:

1. Integridad del grafo: ciclos, datasets huérfanos, pipelines incompletos.
2. Referencias cruzadas: toda referencia (source, dataset, contract, engine, flow) debe resolver.
3. Consistency de contracts: tipos, constraints y evolución semver.
4. Coherencia de steps: `extract`→source, `transform`→dataset/engine, `load`→dataset.
5. Detección de breaking changes vía grafo de dependencias (funciona en checkouts limpios de CI).
6. Reportes estructurados con severidad, file path y línea: `<file>:<line>:<severity>: <message>` — pensados para que agentes de IA corrijan errores programáticamente.

### CLI

```bash
dataspec init      # scaffolding de un workspace (con --with-examples)
dataspec validate  # validación completa (exit 0/1/2, format text|json)
dataspec list      # resumen o listado por recurso
dataspec show      # detalle de un recurso, con --deps para dependencias
dataspec datahub   # connect y sync de datasets, sources y lineage a DataHub
```

### Integración DataHub

Sincroniza el modelo dataspec hacia un catálogo DataHub: datasets, sources y lineage (edges dataset→dataset derivados de los flows), con health check, modo `--dry-run` y sync incremental.

### Procesos definidos

- **Specification-Driven Development** con OpenSpec: cada cambio pasa por proposal → specs delta → design → tasks → dependencies → distribution (ejecutable con múltiples agentes en paralelo).
- **18 capacidades especificadas** en [`openspec/specs/`](./openspec/specs/), incluyendo `validation-engine`, `data-contracts`, `source-management`, `flow-definition`, `workspace-structure` y las capacidades DataHub.
- **Skill de agente** en [`skills/dataspec/`](./skills/dataspec/) para que agentes de IA creen, editen y validen recursos dataspec.

### En desarrollo

- **`dataspec docs generate`**: generación de documentación en Markdown + Mermaid (catálogos y diagramas de lineage).
- **`dataspec lsp`**: servidor LSP con diagnostics, hover, go-to-definition y completion.
- **`dataspec inspect`**: nueva vista de recurso con awareness de layer y lineage.

## Instalación y uso

> Dataspec aún no está publicado en ningún registro. Por ahora, construye desde el código fuente.

### Requisitos

- [Bun](https://bun.sh) (runtime principal)

### Construir desde el repo

```bash
git clone https://github.com/piperubio/dataspec.git
cd dataspec
bun install
bun run build          # compila el binario CLI en packages/dataspec-cli/bin/dataspec
```

### Uso rápido

```bash
# Crear un workspace de ejemplo
./packages/dataspec-cli/bin/dataspec init --name my-data-platform --with-examples

# Validar
./packages/dataspec-cli/bin/dataspec validate
./packages/dataspec-cli/bin/dataspec validate --format json

# Explorar recursos
./packages/dataspec-cli/bin/dataspec list
./packages/dataspec-cli/bin/dataspec list datasets
./packages/dataspec-cli/bin/dataspec show dataset users_raw --deps

# DataHub (requiere config en platform.yaml)
./packages/dataspec-cli/bin/dataspec datahub connect
./packages/dataspec-cli/bin/dataspec datahub sync datasets --incremental
```

Tras el build, puedes agregar `packages/dataspec-cli/bin` al `PATH` para usar `dataspec` directamente.

### Ejemplo completo

[`examples/ecommerce-platform`](./examples/ecommerce-platform/) contiene un workspace real con 9 sources, 64 contracts, 16 datasets y 6 flows (ETL y ELT) sobre storage S3/PostgreSQL/ClickHouse:

```bash
./packages/dataspec-cli/bin/dataspec validate --path examples/ecommerce-platform
./packages/dataspec-cli/bin/dataspec list --path examples/ecommerce-platform
```

### Como librería

```bash
bun add @dataspec/dataspec-core
```

Expone los parsers `parsePlatformYaml`, `parseSourceYaml`, `parseContractYaml`, `parseDatasetYaml` y `parseFlowYaml`. Ver [`packages/dataspec-core/README.md`](./packages/dataspec-core/README.md).

## Desarrollo

### Entorno de desarrollo

```bash
git clone https://github.com/piperubio/dataspec.git
cd dataspec
bun install
```

Monorepo con workspaces en `packages/`:

| Paquete                      | Descripción                                 |
| ---------------------------- | ------------------------------------------- |
| `@dataspec/dataspec-core`    | Parsing, types y schemas JSON del DSL       |
| `@dataspec/dataspec-cli`     | CLI, grafo, validación semántica y comandos |
| `@dataspec/dataspec-datahub` | Cliente y syncs hacia DataHub               |

Comandos principales:

```bash
bun test                 # tests (también: bun run test:core / test:cli)
bun run typecheck        # tsc --noEmit en todos los paquetes
bun run lint             # oxlint
bun run lint:fix         # oxlint --fix
bun run fmt              # oxfmt (formateo)
bun run fmt:check        # oxfmt --check
bun run build            # compila el binario CLI
```

Notas:

- Usa `oxlint --lsp` y `oxfmt --lsp` en tu editor para linting y formateo en vivo.
- Hay un pre-commit hook (Husky) que ejecuta `lint:fix` y `fmt` automáticamente.
- La CI ejecuta typecheck → lint → fmt:check → build → tests y smoke-tests del binario contra `examples/ecommerce-platform`. Mantén ese ejemplo actualizado con los últimos cambios.

### Cómo contribuir

1. **Nunca hagas push directo a `main`.** Crea siempre una branch y abre un PR:
   - Branches: `feat/description`, `fix/description`, `docs/description`, `chore/description`, `hotfix/description`, `release/description`.
2. **Commits convencionales**: `<type>[optional scope]: <description>` — `feat:`, `fix(dataspec-cli):`, `docs:`, `chore:`, `refactor:`, `test(dataspec-core):`, `ci:`, `build:`, `perf:`, `style:`.
3. Describe en el PR **qué** cambia y **por qué**.
4. Antes de abrir el PR, valida:
   ```bash
   bun run typecheck && bun run lint && bun run fmt:check && bun test
   bun run build
   ./packages/dataspec-cli/bin/dataspec validate --path examples/ecommerce-platform
   ```
5. **Convenciones de código**:
   - ESM; prefijo `node:` en builtins; named imports sobre default imports.
   - Sin barrel files: importa directamente desde los source files.
   - El proyecto es _specification-driven_: los cambios funcionales se proponen primero vía OpenSpec (ver [`AGENTS.md`](./AGENTS.md) y [`openspec/`](./openspec/)).

Más detalles en [`AGENTS.md`](./AGENTS.md).
