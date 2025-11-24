# Teaching Course Builder

A React-based course builder application with drag-and-drop functionality for creating interactive teaching materials.

## 📚 Documentation

**Complete documentation is available in the [`docs/`](docs/) directory:**

- **[Documentation Index](docs/README.md)** - Start here for a complete overview
- **[Application Overview](docs/guides/application-overview.md)** - Understanding the application
- **[Architecture Decisions](docs/adr/)** - ADRs documenting key decisions
- **[Implementation Guides](docs/guides/)** - Detailed technical guides

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🏗️ Project Structure

```
src/
├── components/          # Shared React components
├── pages/
│   └── TeachingCourse/ # Main course builder
│       ├── components/  # Course-specific components
│       ├── utils/       # Helper functions and utilities
│       └── variants/    # Page variants (template, edit, read)
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component

docs/
├── adr/                # Architecture Decision Records
├── guides/             # Implementation guides
└── discussions/        # Open discussions and questions
```

## 🎯 Key Features

- **Drag & Drop Interface**: Intuitive drag-and-drop for content organization
- **Hierarchical Structure**: Tile → Row → Column layout system
- **Multiple Block Types**: Text, Heading, Dropdown, Accordion, Column Layouts
- **Block Variants**: Support for variants (e.g., H1, H2, H3 headings)
- **Responsive Design**: Works across desktop and mobile devices

## 🔧 Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Drag & Drop**: @dnd-kit/core
- **Styling**: CSS Modules with SCSS
- **State Management**: React hooks

## 📖 Key Documentation

### For New Developers

1. [Application Overview](docs/guides/application-overview.md) - Start here
2. [Data Structure Architecture](docs/adr/0001-data-structure-architecture.md) - Core data model
3. [Drag & Drop Implementation](docs/guides/drag-drop-implementation.md) - How drag-and-drop works

### For Contributors

1. [Plugin Architecture](docs/adr/0002-plugin-architecture.md) - Block system architecture
2. [Block Variants](docs/adr/0003-block-variants.md) - Implementing block variations
3. [Data Structure Migration](docs/guides/data-structure-migration-status.md) - Current migration status

## 🤝 Contributing

1. Read the [Documentation](docs/README.md)
2. Review [Architecture Decision Records](docs/adr/)
3. Check [Open Discussions](docs/discussions/)
4. Follow the coding style and conventions used in the project

## 📝 License

[Add your license here]

## 📞 Contact

[Add contact information or links]

---

## Development Notes

This project uses:
- **React + TypeScript**: For type-safe component development
- **Vite**: For fast development and optimized builds
- **ESLint**: For code quality and consistency

### TypeScript Configuration

Two tsconfig files are used:
- `tsconfig.app.json` - For application code
- `tsconfig.node.json` - For Node.js tooling (Vite config, etc.)

### ESLint Configuration

The project uses TypeScript ESLint with recommended rules. See [`eslint.config.js`](eslint.config.js) for details.

For production applications, consider enabling type-aware lint rules. See [Vite + React + TypeScript docs](https://vitejs.dev/guide/) for more information.
