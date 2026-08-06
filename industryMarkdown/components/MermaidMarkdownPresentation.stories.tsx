import { ThemeProvider, theme as defaultTheme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { MermaidMarkdownPresentation, MermaidMarkdownSlide } from './MermaidMarkdownPresentation';

const meta: Meta<typeof MermaidMarkdownPresentation> = {
  title: 'IndustryMarkdown/MermaidMarkdownPresentation',
  component: MermaidMarkdownPresentation,
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
        <div style={{ height: '100vh', width: '100%' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    theme: defaultTheme,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const slides: MermaidMarkdownSlide[] = [
  {
    title: 'Payment Gateway Architecture',
    mermaid: `graph TB
    subgraph "Client Layer"
        Web[Web App]
        Mobile[Mobile App]
    end

    subgraph "Edge Layer"
        LB[Load Balancer]
        CDN[CDN / WAF]
    end

    subgraph "Application Layer"
        API[Payments API]
        Auth[Auth Service]
        Fraud[Fraud Detection]
        Webhook[Webhook Dispatcher]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
        Queue[Kafka Queue]
    end

    subgraph "External"
        PSP[Payment Processor]
        Bank[Acquiring Bank]
    end

    Web --> CDN
    Mobile --> CDN
    CDN --> LB
    LB --> API
    API --> Auth
    API --> Fraud
    API --> DB
    API --> Cache
    API --> Queue
    Queue --> Webhook
    Webhook --> PSP
    API --> PSP
    PSP --> Bank

    style API fill:#bbf,stroke:#333,stroke-width:2px
    style Fraud fill:#fbb,stroke:#333,stroke-width:2px`,
    markdown: `# Payment Gateway Architecture

This slide shows the end-to-end request path for a card payment.

## Request Flow

1. **Clients** (web + mobile) hit the edge layer through a CDN/WAF.
2. The **load balancer** routes requests to the horizontally scaled **Payments API**.
3. The API **authenticates** the caller, runs **fraud checks**, and debits the ledger.
4. Idempotent payment events are written to **Kafka** so the **Webhook Dispatcher** can fan out results to merchants.

## Why Kafka?

> The queue decouples synchronous PSP calls from async notifications. If the processor is slow, merchants never block — they just receive a delayed webhook.

**Key requirement:** all state transitions are append-only events, replayed on crash recovery.`,
  },
  {
    title: 'Payment Retry & Reconciliation',
    mermaid: `stateDiagram-v2
    [*] --> Authorized
    Authorized --> Captured: Capture approved
    Authorized --> Expired: 7 days
    Captured --> Settled: Batch close
    Captured --> Refunded: Merchant refund
    Settled --> Reconciled: Match statement
    Reconciled --> [*]

    note right of Captured
        Retries capped at 3,
        backoff 30s / 2m / 10m
    end note`,
    markdown: `# Payment Retry & Reconciliation

Every payment is a small state machine. Two properties matter most:

## Retry policy
- Captures are retried with **exponential backoff** (30s → 2m → 10m), max 3 attempts.
- Failed attempts are recorded as events, never silently dropped.

## Reconciliation
- A nightly job pulls the **processor statement** and matches it against our \`settled\` events.
- Discrepancies open a **reconciliation ticket** with the exact diff — no manual ledger spelunking.

| State | Owner | Trigger |
|-------|-------|---------|
| \`Authorized\` | Payments API | Authorize call |
| \`Captured\` | Batch job | Capture call |
| \`Settled\` | Webhook dispatcher | Processor webhook |

> The state machine is the single source of truth — dashboards, refunds and reports all read from it.`,
  },
  {
    title: 'Checkout Sequence',
    mermaid: `sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as Payments API
    participant F as Fraud Service
    participant P as PSP
    participant K as Kafka

    U->>W: Submit order
    W->>A: POST /v1/payments {amount, token}
    A->>F: evaluate(user, amount)
    F-->>A: risk_score = 0.05
    alt score < 0.1
        A->>P: authorize(charge)
        P-->>A: authorized
        A->>K: emit payment.authorized
        A-->>W: 201 Created {id}
        W-->>U: "Payment received"
    else high risk
        A-->>W: 402 Payment Required
        W-->>U: "Card declined by risk engine"
    end`,
    markdown: `# Checkout Sequence

A happy-path checkout in five calls.

## What the API does

- **Validates** the tokenized card, amount, and currency up front.
- **Scores** the transaction with the fraud service *before* touching the processor.
- **Authorizes** only when the risk score is under threshold.
- Emits a **\`payment.authorized\`** event to Kafka — consumers (webhooks, emails, analytics) subscribe to that event instead of polling the DB.

## Failure handling

High-risk or declined cards return a **402** with a machine-readable reason, which the web app turns into user-facing copy like *"Card declined by risk engine"*.

> Every actor here is downstream of an event — no actor reads another actor's database.`,
  },
  {
    title: 'Data Model',
    mermaid: `erDiagram
    MERCHANT ||--o{ PAYMENT : "receives"
    PAYMENT ||--o{ PAYMENT_EVENT : "emits"
    PAYMENT ||--o{ REFUND : "has"
    MERCHANT {
        uuid id PK
        string name
        string api_key
        timestamptz created_at
    }
    PAYMENT {
        uuid id PK
        uuid merchant_id FK
        money amount
        string currency
        string status
        string provider_ref
        timestamptz created_at
    }
    PAYMENT_EVENT {
        uuid id PK
        uuid payment_id FK
        string type
        jsonb payload
        timestamptz occurred_at
    }
    REFUND {
        uuid id PK
        uuid payment_id FK
        money amount
        string reason
    }`,
    markdown: `# Data Model

Four tables carry the whole system.

## Design notes

- **\`payments\`** holds only the *current* state. History lives in **\`payment_events\`** — an append-only log, so the status column can be rebuilt at any time.
- **\`provider_ref\`** is the idempotency key: the same capture request can be replayed safely against the PSP.
- **\`merchants\`** are the tenancy boundary — every query is scoped by \`merchant_id\`.

## Indexing

- \`payments(merchant_id, created_at DESC)\` — merchant dashboards.
- \`payment_events(payment_id, occurred_at)\` — replay and reconciliation.

> Because events are append-only, we never \`UPDATE\` history — a strict rule enforced at the repository layer.`,
  },
];

export const Default: Story = {
  args: {
    slides,
    initialSlide: 0,
  },
};

export const TallDiagram: Story = {
  args: {
    slides: [
      {
        title: 'Vertical Pipeline',
        mermaid: `graph TD
    A[Ingest] --> B[Validate]
    B --> C[Enrich]
    C --> D[Transform]
    D --> E[Load]
    E --> F[Aggregate]
    F --> G[Publish]
    G --> H[Monitor]
    H --> I[Alert]
    I --> A`,
        markdown: `# Tall Vertical Pipeline

A diagram that is much taller than it is wide.

The **contain** fit strategy (default) scales it to fit the top panel, and you can still zoom in with the mouse wheel or the reset button when you need a closer look.

## Steps

1. Ingest raw events
2. Validate schemas
3. Enrich with metadata
4. Transform to the canonical shape
5. Load into the warehouse
6. Aggregate for reporting
7. Publish to consumers
8. Monitor and alert on failures

> Drag the separator to give the diagram more room, then zoom into any stage.`,
      },
    ],
  },
};

export const FitStrategies: Story = {
  render: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {(['contain', 'width', 'height'] as const).map(strategy => (
        <div
          key={strategy}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div
            style={{
              padding: '4px 12px',
              color: defaultTheme.colors.textSecondary,
              fontSize: defaultTheme.fontSizes[1],
              fontFamily: defaultTheme.fonts.monospace,
              borderBottom: `1px solid ${defaultTheme.colors.border}`,
            }}
          >
            fitStrategy=&quot;{strategy}&quot;
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MermaidMarkdownPresentation
              theme={defaultTheme}
              slides={[wideSlide]}
              mermaidFitStrategy={strategy}
              showNavigation={false}
            />
          </div>
        </div>
      ))}
    </div>
  ),
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
        <div style={{ height: '100vh', width: '100%', padding: 16 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

const wideSlide: MermaidMarkdownSlide = {
  title: 'Wide Process',
  mermaid: `graph LR
    A[Request] --> B[Parse]
    B --> C[Authorize]
    C --> D[Execute]
    D --> E[Persist]
    E --> F[Respond]
    F --> G[Audit]
    G --> H[Observe]

    C --> I[Throttle]
    I --> D
    D --> J[Retry]
    J --> E`,
  markdown: `# Wide Process

A diagram that is much wider than it is tall.

Compare how each **fit strategy** scales it:

- **contain** — fits entirely within the panel (both axes).
- **width** — fits the panel width, ignoring height.
- **height** — fits the panel height, ignoring width.

Each of the three blocks above is a full \`MermaidMarkdownPresentation\` with a different \`mermaidFitStrategy\`. Drag the separators in any of them to see the diagram re-fit itself.`,
};
