import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { SkillMarkdown } from './SkillMarkdown';
import { ThemeProvider, theme as defaultTheme } from '@principal-ade/industry-theme';

/**
 * SkillMarkdown component for rendering Agent Skills with frontmatter
 */
const meta = {
  title: 'Components/SkillMarkdown',
  component: SkillMarkdown,
  decorators: [
    (Story) => (
      <ThemeProvider theme={defaultTheme}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders Agent Skills markdown following the agentskills.io specification. Parses YAML frontmatter and displays skill metadata with markdown body.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SkillMarkdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const basicSkillContent = `---
name: Legal Review
description: Review contracts and legal documents for potential issues and compliance
license: MIT
compatibility: ">=1.0.0"
allowed-tools:
  - document-reader
  - legal-db-search
  - compliance-checker
metadata:
  author: AI Team
  version: "1.0.0"
  category: Legal
---

# Legal Review Skill

This skill enables AI agents to review legal documents for compliance and potential issues.

## Capabilities

- **Contract Analysis**: Identify contractual obligations and liabilities
- **Regulatory Compliance**: Check documents against relevant regulations
- **Risk Assessment**: Flag ambiguous or problematic clauses
- **Language Review**: Suggest improvements to legal language
- **Template Comparison**: Compare against standard contract templates

## Usage

\`\`\`typescript
const result = await agent.useSkill('legal-review', {
  document: contractText,
  jurisdiction: 'US',
  checkCompliance: true,
});
\`\`\`

## Best Practices

1. Always specify the jurisdiction for accurate compliance checking
2. Provide context about the transaction type
3. Review flagged items with human legal counsel
4. Keep the legal database up to date

## Limitations

- Not a replacement for professional legal advice
- May not catch all edge cases
- Jurisdiction-specific rules require up-to-date data
`;

const minimalSkillContent = `---
name: Email Drafter
description: Draft professional emails based on context and intent
---

# Email Drafter

Simple skill for drafting emails.

## Features

- Professional tone
- Context-aware
- Multiple templates
`;

const fullFeaturedSkillContent = `---
name: SQL Query Generator
description: Generate optimized SQL queries from natural language descriptions
license: Apache-2.0
compatibility: ">=2.0.0"
allowed-tools:
  - database-schema-analyzer
  - query-optimizer
  - security-validator
  - performance-profiler
metadata:
  author: Database Team
  version: "2.1.0"
  category: Database
  difficulty: Advanced
  last-updated: "2024-01-06"
---

# SQL Query Generator

Advanced skill for converting natural language into optimized, secure SQL queries.

## Overview

This skill leverages natural language processing and database schema understanding to generate production-ready SQL queries. It supports multiple database dialects and includes built-in security validation.

## Capabilities

### Query Generation
- Parse natural language query descriptions
- Generate syntactically correct SQL
- Support for complex joins and subqueries
- Aggregate functions and window functions

### Multi-Dialect Support
- PostgreSQL
- MySQL
- SQL Server
- Oracle
- SQLite

### Security & Optimization
- SQL injection prevention
- Query optimization suggestions
- Index usage analysis
- Permission validation

## Usage Examples

### Basic Query
\`\`\`typescript
const query = await agent.useSkill('sql-generator', {
  prompt: 'Find all users who registered in the last 30 days',
  dialect: 'postgresql',
});
// Output: SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '30 days';
\`\`\`

### Complex Join
\`\`\`typescript
const query = await agent.useSkill('sql-generator', {
  prompt: 'Show total orders per customer with their contact info',
  dialect: 'mysql',
  optimize: true,
});
\`\`\`

## Configuration

\`\`\`yaml
sql-generator:
  default-dialect: postgresql
  max-query-complexity: 10
  require-explain-plan: true
  security-level: strict
\`\`\`

## Best Practices

1. **Always validate schemas**: Ensure the skill has access to current schema information
2. **Review generated queries**: Don't blindly execute without review
3. **Use EXPLAIN**: Check query plans for performance
4. **Limit permissions**: Grant minimal required database permissions

## Performance Considerations

- Large result sets may require pagination
- Complex queries might need manual optimization
- Consider using materialized views for frequent queries

## Security

This skill includes multiple layers of security validation:

- ✅ SQL injection prevention
- ✅ Permission boundary checking
- ✅ Query complexity limits
- ✅ Sensitive data access controls

## Troubleshooting

### Query Returns No Results
- Check schema names and table names
- Verify column names match schema
- Review WHERE clause conditions

### Performance Issues
- Add appropriate indexes
- Consider query rewriting
- Check for N+1 problems

## Version History

- **2.1.0**: Added Oracle support, improved optimization
- **2.0.0**: Multi-dialect support, security hardening
- **1.5.0**: Performance profiling integration
- **1.0.0**: Initial release
`;

const invalidSkillContent = `---
name: Invalid Skill
# Missing required description field!
license: MIT
---

# This will fail validation

Because description is missing.
`;

const malformedYamlContent = `---
name: Broken Skill
description: This has malformed YAML
  bad indentation
  - and list issues
---

# Broken YAML

This won't parse correctly.
`;

/**
 * Basic skill with all standard fields
 */
export const Basic: Story = {
  args: {
    content: basicSkillContent,
    theme: defaultTheme,
    onParsed: fn(),
    onError: fn(),
  },
};

/**
 * Minimal skill with only required fields
 */
export const Minimal: Story = {
  args: {
    content: minimalSkillContent,
    theme: defaultTheme,
    onParsed: fn(),
    onError: fn(),
  },
};

/**
 * Full-featured skill with extensive documentation
 */
export const FullFeatured: Story = {
  args: {
    content: fullFeaturedSkillContent,
    theme: defaultTheme,
    onParsed: fn(),
    onError: fn(),
  },
};

/**
 * Invalid skill missing required field
 */
export const InvalidSkill: Story = {
  args: {
    content: invalidSkillContent,
    theme: defaultTheme,
    onError: fn(),
  },
};

/**
 * Invalid skill with malformed YAML
 */
export const MalformedYAML: Story = {
  args: {
    content: malformedYamlContent,
    theme: defaultTheme,
    onError: fn(),
  },
};

/**
 * Invalid skill with fallback to raw markdown
 */
export const InvalidWithFallback: Story = {
  args: {
    content: invalidSkillContent,
    theme: defaultTheme,
    showRawOnError: true,
    onParsed: fn(),
    onError: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When showRawOnError is true, the component falls back to rendering raw markdown instead of showing an error message.',
      },
    },
  },
};

/**
 * Skill with code examples and syntax highlighting
 */
export const WithCodeExamples: Story = {
  args: {
    content: `---
name: API Client Generator
description: Generate type-safe API clients from OpenAPI specifications
license: MIT
allowed-tools:
  - openapi-parser
  - typescript-generator
---

# API Client Generator

Generate fully type-safe API clients.

## TypeScript Example

\`\`\`typescript
import { generateClient } from './api-generator';

const client = await generateClient({
  spec: './openapi.yaml',
  output: './src/api',
  features: {
    validation: true,
    retry: true,
    auth: 'bearer',
  },
});
\`\`\`

## Python Example

\`\`\`python
from api_generator import generate_client

client = generate_client(
    spec="./openapi.yaml",
    output="./api",
    async_mode=True
)
\`\`\`

## Supported Languages

- TypeScript
- Python
- Go
- Rust
`,
    theme: defaultTheme,
    onParsed: fn(),
    onError: fn(),
  },
};

/**
 * Skill with tables and advanced markdown
 */
export const WithTables: Story = {
  args: {
    content: `---
name: Data Transformer
description: Transform data between different formats and schemas
allowed-tools:
  - json-schema-validator
  - csv-parser
  - xml-parser
---

# Data Transformer

Transform data between formats.

## Supported Formats

| Input Format | Output Format | Validation | Schema Support |
|--------------|---------------|------------|----------------|
| JSON         | CSV          | ✅         | ✅             |
| CSV          | JSON         | ✅         | ✅             |
| XML          | JSON         | ✅         | ⚠️             |
| YAML         | JSON         | ✅         | ✅             |

## Performance Metrics

| File Size | Processing Time | Memory Usage |
|-----------|----------------|--------------|
| < 1 MB    | < 100ms        | < 10 MB      |
| 1-10 MB   | < 1s           | < 50 MB      |
| 10-100 MB | < 10s          | < 200 MB     |

## Feature Checklist

- [x] JSON to CSV
- [x] CSV to JSON
- [x] XML to JSON
- [ ] Protobuf support
- [ ] Avro support
`,
    theme: defaultTheme,
    onParsed: fn(),
    onError: fn(),
  },
};
