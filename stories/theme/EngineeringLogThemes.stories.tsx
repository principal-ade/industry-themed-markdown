import type { Theme } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { DocumentView } from '../../industryMarkdown/components/DocumentView';
import {
  engineeringLogTheme,
  engineeringPaperTheme,
} from '../../industryMarkdown/themes/engineeringLogThemes';

// Sample engineering-log style markdown so both themes can be judged against
// the same content: logbook header, dated entries, a test matrix, code,
// mermaid diagrams, a sign-off list, and a redline blockquote.
const logMarkdown = `
# ENGINEERING LOG — BRIDGE / 0.7.2

Field entry: 2026-08-09 · Author: j.reed · System: signal-relay

## Daily summary

The relay handoff test passed at 14:32 UTC. Latency within spec (p95 38 ms,
budget 50 ms). Deferred the compaction work to next sprint; tracked in
\`backlog/tasks/12-compaction.md\`.

## Observations

- \`POST /relay/resend\` now idempotent — verified with a replay of the 08:00 batch.
- Graceful drain of the subscriber pool still drops frames under memory pressure.
- The mermaid sequence diagram renders correctly in both color modes.

## Relay handoff flow

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant R as Relay
    participant Q as Queue
    participant S as Subscribers
    C->>R: POST /relay/resend (batch 08:00)
    R->>R: dedupe by message id
    R->>Q: enqueue 1.2k messages
    Q->>S: fan-out (p95 38 ms)
    S-->>R: ack batch
    R-->>C: 202 Accepted
\`\`\`

## Test matrix

| Check | Result | Severity |
|-------|--------|----------|
| Idempotent replay | PASS | n/a |
| Drain under 2× load | FAIL | high |
| Auth token rotation | PASS | n/a |
| Cold-start recovery | WARN | low |

## Drain triage

\`\`\`mermaid
flowchart TD
    A[SIGTERM received] --> B{Subscriber pool\ndraining?}
    B -- yes --> C[close subscription]
    C --> D{Outbox empty?}
    D -- no --> E[DROP frame <-- bug]
    D -- yes --> F[flush + exit 0]
    B -- no --> F
\`\`\`

## Repro steps for the drain issue

\`\`\`bash
docker compose up -d relay
# push 20k messages, then kill -SIGTERM the relay pod
kubectl -n relay logs relay-0 --tail=200 | grep -i drain
\`\`\`

## Sign-off

- [x] Relay handoff verified
- [ ] Drain fix scoped (owner: m.okafor)
- [ ] Compaction ticket filed

> Redline: the drain drop appears in the subscriber teardown path, not the
> queue. Re-check \`subscription.close()\` ordering before blaming the buffer.
`;

const LogPreview = ({ theme }: { theme: Theme }) => (
  <div
    style={{
      width: '100%',
      height: '100vh',
      backgroundColor: theme.colors.backgroundDark,
      padding: '16px',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ height: '100%', borderRadius: 0, overflow: 'hidden' }}>
      <DocumentView
        content={logMarkdown}
        slideIdPrefix="englog"
        theme={theme}
        enableHtmlPopout={false}
      />
    </div>
  </div>
);

// Side-by-side comparison story
export const EngineeringLogComparison = () => (
  <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <LogPreview theme={engineeringLogTheme} />
    </div>
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderLeft: '1px solid #000',
      }}
    >
      <LogPreview theme={engineeringPaperTheme} />
    </div>
  </div>
);

const meta: Meta = {
  title: 'IndustryTheme/Engineering Log Themes',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TechServiceManual: Story = {
  render: () => <LogPreview theme={engineeringLogTheme} />,
};

export const EngineeringPaper: Story = {
  render: () => <LogPreview theme={engineeringPaperTheme} />,
};
