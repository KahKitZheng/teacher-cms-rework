# Teaching Course Builder - Documentation

This directory contains all documentation for the Teaching Course builder application.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Documentation Structure](#documentation-structure)
- [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
- [Guides](#guides)
- [Discussions](#discussions)

---

## Quick Start

**New to the project?** Start here:

1. [Application Overview](guides/application-overview.md) - Understanding the Teaching Course builder
2. [Data Structure Proposal](guides/data-structure-proposal.md) - Core data model
3. [ADR 0001: Data Structure Architecture](adr/0001-data-structure-architecture.md) - Architectural decisions

**Want to contribute?**

1. Read the relevant [Architecture Decision Records](#architecture-decision-records-adrs)
2. Check [Implementation Guides](#guides)
3. Review [Open Discussions](#discussions)

---

## Documentation Structure

```
docs/
├── README.md                          # This file
├── adr/                               # Architecture Decision Records
│   ├── 0001-data-structure-architecture.md
│   ├── 0002-plugin-architecture.md
│   ├── 0003-block-variants.md
│   ├── 0004-drag-drop-improvements.md
│   ├── 0005-data-persistence-architecture.md
│   ├── 0006-uuid-migration.md
│   ├── 0007-validation-system.md
│   ├── 0008-separate-routes-for-course-variants.md
│   └── 0009-block-registry-factory.md
├── guides/                            # Implementation guides and references
│   ├── application-overview.md
│   ├── data-structure-proposal.md
│   ├── data-structure-migration-status.md
│   ├── drag-drop-implementation.md
│   ├── plugin-architecture-lightweight.md
│   ├── plugin-architecture-complete.md
│   └── variant-implementation-guide.md
└── discussions/                       # Open questions and discussions
    └── improvement-questions.md
```

---

## Architecture Decision Records (ADRs)

ADRs document important architectural decisions made for the project. Each ADR includes:
- **Context**: What problem are we solving?
- **Decision**: What did we decide to do?
- **Rationale**: Why did we make this decision?
- **Consequences**: What are the trade-offs?

### Current ADRs

| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](adr/0001-data-structure-architecture.md) | Data Structure Architecture | ✅ Accepted | 2025-01 |
| [0002](adr/0002-plugin-architecture.md) | Plugin Architecture for Block Registry | 📝 Proposed | 2025-01 |
| [0003](adr/0003-block-variants.md) | Block Variant System | ✅ Accepted | 2025-01 |
| [0004](adr/0004-drag-drop-improvements.md) | Drag & Drop System Improvements | 📝 Proposed | 2025-01 |
| [0005](adr/0005-data-persistence-architecture.md) | Data Persistence Architecture | 📝 Proposed | 2025-01 |
| [0006](adr/0006-uuid-migration.md) | UUID Migration Plan | 📝 Proposed | 2025-01 |
| [0007](adr/0007-validation-system.md) | Validation System Architecture | 📝 Proposed | 2025-01 |
| [0008](adr/0008-separate-routes-for-course-variants.md) | Separate Routes for Course Variants | 📝 Proposed | 2025-01 |
| [0009](adr/0009-block-registry-factory.md) | Block Registry Factory Pattern | 📝 Proposed | 2025-01 |

### Reading ADRs

- **Accepted** (✅): Implemented or in progress
- **Proposed** (📝): Under consideration
- **Deprecated** (❌): No longer recommended
- **Superseded** (↩️): Replaced by another ADR

---

## Guides

Comprehensive implementation guides and technical references.

### Core Architecture

| Guide | Description |
|-------|-------------|
| [Application Overview](guides/application-overview.md) | High-level overview of the Teaching Course builder |
| [Data Structure Proposal](guides/data-structure-proposal.md) | Detailed analysis of data structure options |
| [Data Structure Migration Status](guides/data-structure-migration-status.md) | Current migration progress and checklist |

### Feature Implementation

| Guide | Description |
|-------|-------------|
| [Drag & Drop Implementation](guides/drag-drop-implementation.md) | Drag-and-drop combinations and rules |
| [Shared Component Logic Extraction](guides/shared-component-logic-extraction.md) | Extract shared logic into custom hooks |
| [Plugin Architecture (Lightweight)](guides/plugin-architecture-lightweight.md) | Lightweight plugin system for blocks |
| [Plugin Architecture (Complete)](guides/plugin-architecture-complete.md) | Full plugin system with lazy loading |
| [Block Variants Implementation](guides/variant-implementation-guide.md) | How to add and use block variants |

---

## Discussions

Open questions, improvement proposals, and active discussions.

| Discussion | Description |
|------------|-------------|
| [Improvement Questions](discussions/improvement-questions.md) | Open questions about architecture and features |
| [Component Architecture Questions](discussions/component-architecture-questions.md) | Routing and block factory pattern analysis |

---

## Contributing to Documentation

### Adding a New ADR

1. Copy the ADR template (create one if it doesn't exist)
2. Number it sequentially (e.g., `0004-next-decision.md`)
3. Fill in all sections: Context, Decision, Rationale, Consequences
4. Set status to "Proposed"
5. Create a PR for review
6. Update status to "Accepted" when implemented

### ADR Status Workflow

```
Proposed → (Review) → Accepted → (Implementation) → Implemented
           ↓                         ↓
        Rejected                 Deprecated
```

### Adding a Guide

1. Create a new `.md` file in `docs/guides/`
2. Use descriptive, kebab-case naming (e.g., `feature-name-guide.md`)
3. Add to the appropriate table in this README
4. Link from relevant ADRs if applicable

### Starting a Discussion

1. Create a new `.md` file in `docs/discussions/`
2. Include context, questions, and proposed solutions
3. Add to the discussions table in this README
4. Convert to ADR when decision is made

---

## Documentation Style Guide

### Formatting

- Use **Markdown** for all documentation
- Use **ATX-style headers** (`#`, `##`, `###`)
- Include a **Table of Contents** for long documents
- Use **code blocks** with language specifiers (```typescript, ```bash, etc.)

### Writing Style

- **Clear and concise**: Get to the point quickly
- **Examples over theory**: Show, don't just tell
- **Consistent terminology**: Use the same terms throughout
- **Active voice**: "We chose X" not "X was chosen"

### Code Examples

```typescript
// ✅ Good: Include types, clear naming
type BlockMetadata = {
  category: 'content' | 'layout' | 'container';
  displayName: string;
};

// ❌ Bad: No types, unclear naming
const meta = {
  cat: 'content',
  name: 'Block'
};
```

---

## Document Maintenance

### When to Update

- **ADRs**: When architectural decisions change
- **Guides**: When implementation changes
- **This README**: When adding/removing documentation

### Review Schedule

- **Quarterly**: Review all ADRs for accuracy
- **Per release**: Update implementation guides
- **As needed**: Update discussions and open questions

---

## Related Resources

### External Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [DnD Kit Documentation](https://docs.dndkit.com/)

### Project Files

- [Main README](../README.md) - Project overview and setup
- [Source Code](../src/) - Implementation
- [Type Definitions](../src/types/) - TypeScript types

---

## Questions?

If you have questions about the documentation:

1. Check if there's already a discussion in [`docs/discussions/`](discussions/)
2. Look for related ADRs that might answer your question
3. Create a new discussion file if needed
4. Reach out to the development team

---

**Last Updated:** 2025-01

**Maintained By:** Development Team
