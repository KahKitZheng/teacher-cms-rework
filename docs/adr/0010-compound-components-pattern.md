# ADR 0010: Compound Components Pattern for Tile Templates

**Status:** Proposed 📋

**Date:** 2025-01-24

**Deciders:** Development Team

**Related:**
- [ADR 0009: Block Registry Factory](0009-block-registry-factory.md) - Works alongside compound components
- [Improvement Questions Q10](../discussions/improvement-questions.md#q10-component-architecture) - Original discussion
- [ADR 0002: Plugin Architecture](0002-plugin-architecture.md) - Plugin integration

---

## Context

### Current State

Users build courses by:
1. Adding blocks one by one via ElementPickerModal
2. Manually arranging structure (accordions, columns, blocks)
3. Configuring each block individually

**This is flexible but time-consuming for common patterns.**

### User Feedback

Teachers expressed desire for:
- **Starter templates** - Pre-configured tile structures for common use cases
- **Quick scaffolding** - Rapidly create standard lesson structures
- **Best practices** - Built-in pedagogical patterns

Example use cases:
- "Introduction Tile" - Welcome message + learning objectives + video
- "Assessment Tile" - Instructions + questions + rubric
- "Reading Tile" - Text content + comprehension questions
- "Lab Tile" - Instructions + materials list + submission area

### The Problem

**Without templates:**
```typescript
// User manually adds 15+ blocks for a standard assessment tile
// - Add accordion for "Instructions"
// - Add text block
// - Add accordion for "Questions"
// - Add text block for question 1
// - Add dropdown for answer 1
// ... repeat 10 times
```

**This is tedious and error-prone.**

---

## Decision

Implement the **Compound Components Pattern** to create reusable tile templates.

### What is Compound Components?

A React pattern where components work together to provide a cohesive API:

```tsx
// Parent provides context and shared state
<CourseBuilder>
  {/* Children access context implicitly */}
  <CourseBuilder.Tile />
  <CourseBuilder.Accordion />
  <CourseBuilder.Block type="text" />
</CourseBuilder>
```

**Benefits:**
- Declarative structure definition
- Shared context without prop drilling
- Flexible composition
- Clear parent-child relationships

### Proposed API

#### 1. Basic Tile Template

```tsx
import { TileTemplate } from '@/components/TileTemplate';

// Define a reusable tile structure
function IntroductionTile() {
  return (
    <TileTemplate name="Introduction">
      <TileTemplate.Block
        type="heading"
        name="Welcome"
        variant="h1"
      />

      <TileTemplate.Block
        type="text"
        name="Course Overview"
        placeholder="Describe what students will learn..."
      />

      <TileTemplate.Accordion name="Learning Objectives">
        <TileTemplate.Block
          type="text"
          name="Objective 1"
          placeholder="By the end of this lesson, students will..."
        />
        <TileTemplate.Block
          type="text"
          name="Objective 2"
        />
      </TileTemplate.Accordion>
    </TileTemplate>
  );
}
```

#### 2. Advanced Template with Columns

```tsx
function AssessmentTile() {
  return (
    <TileTemplate name="Assessment">
      <TileTemplate.Accordion name="Instructions">
        <TileTemplate.Block
          type="text"
          name="Instructions"
          data="Complete all questions below..."
        />
      </TileTemplate.Accordion>

      <TileTemplate.Accordion name="Questions">
        {/* Column layout for question + answer */}
        <TileTemplate.ColumnLayout columns={2}>
          <TileTemplate.Column>
            <TileTemplate.Block
              type="text"
              name="Question 1"
              placeholder="Enter your question..."
            />
          </TileTemplate.Column>

          <TileTemplate.Column>
            <TileTemplate.Block
              type="dropdown"
              name="Answer 1"
              options={[
                { label: 'True', value: 'true' },
                { label: 'False', value: 'false' }
              ]}
            />
          </TileTemplate.Column>
        </TileTemplate.ColumnLayout>
      </TileTemplate.Accordion>

      <TileTemplate.Accordion name="Rubric">
        <TileTemplate.Block type="text" name="Grading Criteria" />
      </TileTemplate.Accordion>
    </TileTemplate>
  );
}
```

#### 3. Template Gallery

```tsx
// Template picker modal
<TemplateGallery onSelect={handleSelectTemplate}>
  <TemplateGallery.Template
    id="introduction"
    name="Introduction Tile"
    description="Welcome message with learning objectives"
    icon="book-open"
    template={<IntroductionTile />}
  />

  <TemplateGallery.Template
    id="assessment"
    name="Assessment Tile"
    description="Questions and rubric for grading"
    icon="clipboard-check"
    template={<AssessmentTile />}
  />

  <TemplateGallery.Template
    id="reading"
    name="Reading Tile"
    description="Text content with comprehension questions"
    icon="book"
    template={<ReadingTile />}
  />

  <TemplateGallery.Template
    id="blank"
    name="Blank Tile"
    description="Start from scratch"
    icon="file-plus"
  />
</TemplateGallery>
```

#### 4. Using Templates in Application

```tsx
// In TeachingCourseTemplate.tsx

const [showTemplateGallery, setShowTemplateGallery] = useState(false);

function handleSelectTemplate(template: TileTemplate) {
  // Convert template to data structure
  const tileData = template.toData();

  // Add to course
  setTileInfo(prev => [...prev, tileData]);

  setShowTemplateGallery(false);
}

// UI
<Button onClick={() => setShowTemplateGallery(true)}>
  <Plus /> New Tile from Template
</Button>

<TemplateGallery
  isOpen={showTemplateGallery}
  onClose={() => setShowTemplateGallery(false)}
  onSelect={handleSelectTemplate}
/>
```

---

## Implementation

### Phase 1: Core TileTemplate Component

```typescript
// src/components/TileTemplate/TileTemplate.tsx

import { createContext, useContext, useState } from 'react';
import { randomId } from '@/utils/randomId';

type TileTemplateContext = {
  level: number;
  parentId?: number;
  registerBlock: (block: TileInfoBlock) => void;
};

const TileTemplateContext = createContext<TileTemplateContext | null>(null);

type TileTemplateProps = {
  name: string;
  children: React.ReactNode;
};

export function TileTemplate({ name, children }: TileTemplateProps) {
  const [blocks, setBlocks] = useState<TileInfoBlock[]>([]);

  const registerBlock = (block: TileInfoBlock) => {
    setBlocks(prev => [...prev, block]);
  };

  const context = {
    level: 0,
    registerBlock,
  };

  return (
    <TileTemplateContext.Provider value={context}>
      <div className="tile-template-preview">
        <h3>{name}</h3>
        {children}
      </div>
    </TileTemplateContext.Provider>
  );
}

// Helper to convert template to data
TileTemplate.toData = function(name: string, blocks: TileInfoBlock[]): Tile {
  return {
    id: randomId(),
    name,
    chapterId: 0, // Set by parent
    order: 0,     // Set by parent
    coverImage: '',
    state: 'open',
    type: 'regular',
    children: blocks.map((block, idx) => ({
      ...block,
      order: idx,
    })),
  };
};
```

### Phase 2: Block Component

```typescript
// TileTemplate.Block.tsx

type BlockProps = {
  type: BlockType;
  name: string;
  data?: any;
  placeholder?: string;
  options?: TileInfoSelectOption[];
  variant?: string;
};

TileTemplate.Block = function Block(props: BlockProps) {
  const context = useContext(TileTemplateContext);

  useEffect(() => {
    if (!context) return;

    const block: TileInfoBlock = {
      type: props.type,
      id: randomId(),
      name: props.name,
      level: context.level,
      order: 0, // Will be set when converting to data
      parentId: context.parentId,
      data: props.data ?? '',
      placeholder: props.placeholder,
      options: props.options,
      // ... other fields based on type
    };

    context.registerBlock(block);
  }, []);

  // Render preview
  return (
    <div className="template-block-preview">
      <span className="block-icon">{getBlockIcon(props.type)}</span>
      <span className="block-name">{props.name}</span>
    </div>
  );
};
```

### Phase 3: Accordion Component

```typescript
// TileTemplate.Accordion.tsx

type AccordionProps = {
  name: string;
  children: React.ReactNode;
};

TileTemplate.Accordion = function Accordion({ name, children }: AccordionProps) {
  const parentContext = useContext(TileTemplateContext);
  const accordionId = randomId();
  const [childBlocks, setChildBlocks] = useState<TileInfoBlock[]>([]);

  const registerChildBlock = (block: TileInfoBlock) => {
    setChildBlocks(prev => [...prev, block]);
  };

  useEffect(() => {
    if (!parentContext) return;

    const accordion: TileInfoBlockAccordion = {
      type: 'accordion',
      id: accordionId,
      name,
      level: parentContext.level,
      order: 0,
      parentId: parentContext.parentId,
      children: childBlocks,
    };

    parentContext.registerBlock(accordion);
  }, [childBlocks]);

  const childContext = {
    level: parentContext.level + 1,
    parentId: accordionId,
    registerBlock: registerChildBlock,
  };

  return (
    <TileTemplateContext.Provider value={childContext}>
      <div className="template-accordion-preview">
        <div className="accordion-header">{name}</div>
        <div className="accordion-children">{children}</div>
      </div>
    </TileTemplateContext.Provider>
  );
};
```

### Phase 4: ColumnLayout Component

```typescript
// TileTemplate.ColumnLayout.tsx

type ColumnLayoutProps = {
  columns: number;
  children: React.ReactNode;
};

TileTemplate.ColumnLayout = function ColumnLayout({ columns, children }: ColumnLayoutProps) {
  const context = useContext(TileTemplateContext);
  const layoutId = randomId();
  const [columnChildren, setColumnChildren] = useState<TileInfoBlockColumn[]>([]);

  useEffect(() => {
    if (!context) return;

    const layout: TileInfoColumnLayout = {
      type: 'columnLayout',
      id: layoutId,
      level: context.level,
      order: 0,
      parentId: context.parentId!,
      children: columnChildren,
    };

    context.registerBlock(layout);
  }, [columnChildren]);

  return (
    <TileTemplateContext.Provider value={{ ...context, parentId: layoutId }}>
      <div className="template-column-layout-preview" style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {children}
      </div>
    </TileTemplateContext.Provider>
  );
};
```

### Phase 5: Template Gallery Component

```typescript
// src/components/TemplateGallery/TemplateGallery.tsx

import { TILE_TEMPLATES } from './templates';

type TemplateGalleryProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Tile) => void;
};

export default function TemplateGallery({ isOpen, onClose, onSelect }: TemplateGalleryProps) {
  const handleSelectTemplate = (templateId: string) => {
    const template = TILE_TEMPLATES[templateId];
    const tileData = template.toData();
    onSelect(tileData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="template-gallery">
        <h2>Choose a Tile Template</h2>

        <div className="template-grid">
          {Object.entries(TILE_TEMPLATES).map(([id, template]) => (
            <button
              key={id}
              className="template-card"
              onClick={() => handleSelectTemplate(id)}
            >
              <div className="template-icon">{template.icon}</div>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <div className="template-preview">
                {template.preview}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
```

---

## Built-in Templates

### Template Registry

```typescript
// src/components/TemplateGallery/templates/index.ts

import IntroductionTile from './IntroductionTile';
import AssessmentTile from './AssessmentTile';
import ReadingTile from './ReadingTile';
import LabTile from './LabTile';
import DiscussionTile from './DiscussionTile';

export const TILE_TEMPLATES = {
  introduction: {
    name: 'Introduction',
    description: 'Welcome message with learning objectives',
    icon: '📚',
    component: IntroductionTile,
    preview: <IntroductionTilePreview />,
    toData: () => {
      // Convert template to data structure
    }
  },

  assessment: {
    name: 'Assessment',
    description: 'Questions and grading rubric',
    icon: '✅',
    component: AssessmentTile,
    preview: <AssessmentTilePreview />,
    toData: () => {
      // Convert template to data structure
    }
  },

  reading: {
    name: 'Reading',
    description: 'Text content with comprehension questions',
    icon: '📖',
    component: ReadingTile,
    preview: <ReadingTilePreview />,
    toData: () => {
      // Convert template to data structure
    }
  },

  lab: {
    name: 'Lab Exercise',
    description: 'Instructions, materials, and submission',
    icon: '🔬',
    component: LabTile,
    preview: <LabTilePreview />,
    toData: () => {
      // Convert template to data structure
    }
  },

  discussion: {
    name: 'Discussion',
    description: 'Prompt with discussion guidelines',
    icon: '💬',
    component: DiscussionTile,
    preview: <DiscussionTilePreview />,
    toData: () => {
      // Convert template to data structure
    }
  },

  blank: {
    name: 'Blank Tile',
    description: 'Start from scratch',
    icon: '📄',
    component: null,
    preview: null,
    toData: () => ({
      id: randomId(),
      name: 'New Tile',
      children: [],
      // ... other fields
    })
  },
};
```

### Example Templates

#### Introduction Tile

```typescript
// src/components/TemplateGallery/templates/IntroductionTile.tsx

export default function IntroductionTile() {
  return (
    <TileTemplate name="Introduction">
      <TileTemplate.Block
        type="heading"
        name="Welcome"
        variant="h1"
        data="Welcome to the Course"
      />

      <TileTemplate.Block
        type="text"
        name="Course Overview"
        placeholder="Provide an overview of what students will learn in this course..."
      />

      <TileTemplate.Accordion name="Learning Objectives">
        <TileTemplate.Block
          type="heading"
          name="Objectives Header"
          variant="h3"
          data="By the end of this lesson, you will be able to:"
        />
        <TileTemplate.Block
          type="text"
          name="Objective 1"
          placeholder="Describe the first learning objective..."
        />
        <TileTemplate.Block
          type="text"
          name="Objective 2"
          placeholder="Describe the second learning objective..."
        />
        <TileTemplate.Block
          type="text"
          name="Objective 3"
          placeholder="Describe the third learning objective..."
        />
      </TileTemplate.Accordion>

      <TileTemplate.Accordion name="Materials Needed">
        <TileTemplate.Block
          type="text"
          name="Materials List"
          placeholder="List any materials or prerequisites students need..."
        />
      </TileTemplate.Accordion>
    </TileTemplate>
  );
}
```

#### Assessment Tile

```typescript
// src/components/TemplateGallery/templates/AssessmentTile.tsx

export default function AssessmentTile() {
  return (
    <TileTemplate name="Assessment">
      <TileTemplate.Block
        type="heading"
        name="Assessment Title"
        variant="h2"
        placeholder="Enter assessment name..."
      />

      <TileTemplate.Accordion name="Instructions">
        <TileTemplate.Block
          type="text"
          name="Instructions"
          data="Complete all questions below. You have 60 minutes to finish this assessment."
        />
      </TileTemplate.Accordion>

      <TileTemplate.Accordion name="Questions">
        {/* Question 1 */}
        <TileTemplate.Accordion name="Question 1">
          <TileTemplate.ColumnLayout columns={2}>
            <TileTemplate.Column>
              <TileTemplate.Block
                type="text"
                name="Question Text"
                placeholder="Enter your question here..."
              />
            </TileTemplate.Column>
            <TileTemplate.Column>
              <TileTemplate.Block
                type="dropdown"
                name="Answer"
                options={[
                  { label: 'Option A', value: 'a' },
                  { label: 'Option B', value: 'b' },
                  { label: 'Option C', value: 'c' },
                  { label: 'Option D', value: 'd' },
                ]}
              />
            </TileTemplate.Column>
          </TileTemplate.ColumnLayout>
        </TileTemplate.Accordion>

        {/* Question 2 */}
        <TileTemplate.Accordion name="Question 2">
          <TileTemplate.ColumnLayout columns={2}>
            <TileTemplate.Column>
              <TileTemplate.Block
                type="text"
                name="Question Text"
                placeholder="Enter your question here..."
              />
            </TileTemplate.Column>
            <TileTemplate.Column>
              <TileTemplate.Block
                type="dropdown"
                name="Answer"
                options={[
                  { label: 'True', value: 'true' },
                  { label: 'False', value: 'false' },
                ]}
              />
            </TileTemplate.Column>
          </TileTemplate.ColumnLayout>
        </TileTemplate.Accordion>
      </TileTemplate.Accordion>

      <TileTemplate.Accordion name="Grading Rubric">
        <TileTemplate.Block
          type="text"
          name="Rubric"
          placeholder="Describe how this assessment will be graded..."
        />
      </TileTemplate.Accordion>
    </TileTemplate>
  );
}
```

---

## Rationale

### 1. Faster Course Creation

**Before (manual):**
- Open ElementPickerModal
- Select "Accordion"
- Name it "Instructions"
- Add "Text" block inside
- Name it "Instructions Text"
- Repeat 15+ times for a full assessment
- **Time: ~10 minutes per tile**

**After (template):**
- Click "New Tile from Template"
- Select "Assessment Tile"
- Edit placeholder content
- **Time: ~2 minutes per tile**

**80% time savings for common patterns!**

### 2. Consistency Across Courses

Templates enforce best practices:
- Standard structure for assessments
- Consistent naming conventions
- Pedagogical patterns built-in

### 3. Lower Barrier to Entry

New teachers can:
- Start with proven structures
- Learn by example
- Customize gradually

### 4. Works with Block Registry

Compound components **complement** the block registry (ADR 0009):
- Registry: Dynamic block rendering at runtime
- Templates: Declarative structure definition at design time

```typescript
// Block registry handles "what" blocks do
const Component = getBlockComponent(block.type);

// Templates define "how" blocks are arranged
<TileTemplate>
  <TileTemplate.Block type="text" />  // Uses registry under the hood
</TileTemplate>
```

### 5. Plugin-Friendly

External plugins can register custom templates:

```typescript
// my-course-template-plugin

import { registerTemplate } from '@teaching-course-builder/sdk';

export function initMyTemplates() {
  registerTemplate('lab-report', {
    name: 'Lab Report',
    description: 'Structured template for lab reports',
    icon: '🔬',
    component: LabReportTemplate,
  });
}
```

---

## Alternatives Considered

### Alternative 1: JSON Templates

```json
{
  "name": "Introduction",
  "children": [
    { "type": "heading", "name": "Welcome", "variant": "h1" },
    { "type": "text", "name": "Overview" }
  ]
}
```

**Rejected:**
- ❌ Less type-safe
- ❌ No JSX syntax highlighting
- ❌ Harder to compose dynamically
- ❌ Can't use React components for previews

### Alternative 2: Builder Functions

```typescript
const template = createTemplate()
  .addHeading('Welcome', 'h1')
  .addText('Overview')
  .addAccordion('Objectives', (accordion) => {
    accordion.addText('Objective 1');
    accordion.addText('Objective 2');
  })
  .build();
```

**Rejected:**
- ❌ Less intuitive than JSX
- ❌ Harder to visualize structure
- ❌ Verbose API
- ✅ Better for programmatic generation (consider for future)

### Alternative 3: String Templates

```tsx
const template = `
  <Tile>
    <Heading>Welcome</Heading>
    <Text>Overview</Text>
  </Tile>
`;
```

**Rejected:**
- ❌ No type safety
- ❌ Can't use TypeScript
- ❌ Parsing complexity
- ❌ No component composition

---

## Consequences

### Positive

- ✅ **Faster tile creation** - 80% time savings for common patterns
- ✅ **Consistency** - Standardized structures across courses
- ✅ **Lower learning curve** - Teachers start with working examples
- ✅ **Declarative API** - Clear, readable structure definition
- ✅ **Composable** - Mix and match template components
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Plugin-friendly** - External templates can be registered
- ✅ **Preview support** - Show template before applying

### Negative

- ⚠️ **More components** - TileTemplate, Block, Accordion, ColumnLayout, Column
- ⚠️ **Context complexity** - Nested contexts for level tracking
- ⚠️ **Conversion logic** - Template → data structure mapping
- ⚠️ **Maintenance** - Templates need updates when data structure changes
- ⚠️ **Discovery** - Users need to know templates exist

### Mitigation

**For context complexity:**
- Use TypeScript to catch context errors
- Document context usage patterns
- Provide helper utilities

**For conversion logic:**
- Centralize in `toData()` methods
- Add comprehensive tests
- Version template format

**For maintenance:**
- Keep templates in sync with data structure via automated tests
- Use schema validation
- Provide migration tools

**For discovery:**
- Prominent "Templates" button in UI
- Onboarding flow showing templates
- Tutorial videos

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Implement `TileTemplate` context provider
- [ ] Build `TileTemplate.Block` component
- [ ] Build `TileTemplate.Accordion` component
- [ ] Build `TileTemplate.ColumnLayout` and `Column` components
- [ ] Create `toData()` conversion logic
- [ ] Add unit tests

### Phase 2: Template Gallery (Week 2-3)
- [ ] Create `TemplateGallery` component
- [ ] Build template card UI
- [ ] Add template preview rendering
- [ ] Integrate with main application

### Phase 3: Built-in Templates (Week 3-4)
- [ ] Design 5 core templates (Introduction, Assessment, Reading, Lab, Discussion)
- [ ] Implement each template
- [ ] Create preview components
- [ ] Test with real course content

### Phase 4: Polish & Documentation (Week 4)
- [ ] Add animations/transitions
- [ ] Write user documentation
- [ ] Create video tutorial
- [ ] Gather teacher feedback

**Total Duration:** ~1 month

---

## Success Metrics

### Quantitative
- **Template usage rate**: >50% of new tiles use templates
- **Time savings**: 5-10 minute reduction in tile creation time
- **Template satisfaction**: >4/5 stars in user surveys

### Qualitative
- Teachers report easier course creation
- Consistent structure across courses improves student experience
- New teachers onboard faster

---

## Open Questions

1. **Should templates be editable after applying?**
   - Option A: Apply and lock structure (user can only edit content)
   - Option B: Apply as normal blocks (user can modify everything)
   - **Recommendation**: Option B for flexibility

2. **How to handle template versioning?**
   - Templates may change over time
   - Need migration strategy for courses using old templates
   - **Recommendation**: Version templates, provide migration tools

3. **Should users be able to create custom templates?**
   - Could allow teachers to save their own structures as templates
   - Requires UI for template creation
   - **Recommendation**: Phase 2 feature

4. **How to handle template localization?**
   - Template content may need translation
   - **Recommendation**: Use i18n keys in template definitions

---

## References

- [React Compound Components Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Improvement Questions](../discussions/improvement-questions.md#q10-component-architecture)
- [ADR 0009: Block Registry Factory](0009-block-registry-factory.md)
- [ADR 0002: Plugin Architecture](0002-plugin-architecture.md)

---

## Example: Full User Flow

```tsx
// 1. Teacher clicks "New Tile"
<Button onClick={() => setShowTemplateGallery(true)}>
  <Plus /> New Tile
</Button>

// 2. Template gallery opens
<TemplateGallery
  isOpen={showTemplateGallery}
  onSelect={(template) => {
    // 3. Convert template to data
    const tileData = template;

    // 4. Add to course
    setTileInfo(prev => [...prev, tileData]);

    // 5. Close gallery
    setShowTemplateGallery(false);
  }}
/>

// 6. Tile appears in course with pre-filled structure
// 7. Teacher edits content via existing edit mode
```

**Result**: Teacher goes from 0 to structured tile in ~30 seconds!
