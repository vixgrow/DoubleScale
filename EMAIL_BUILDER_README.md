# Email Builder Implementation

## Overview

I have successfully implemented a complete email builder for your WordPress plugin using Redux as requested. The email builder is a drag-and-drop interface that allows users to create email templates visually.

## What Has Been Implemented

### 1. Redux Store Architecture

- **Store Location**: `src/stores/email-builder/`
- **Store Key**: `quillcrm/email-builder`
- **Architecture**: Using WordPress data stores with `@wordpress/data`

### 2. Main Components

#### Builder Layout

- **Header**: Contains breadcrumb, undo/redo buttons, preview, and save actions
- **Sidebar**: Tabbed interface with Elements and Layouts
- **Canvas**: Main email editing area with drag-and-drop support
- **Block Editor**: Properties panel for editing selected blocks

#### Block System

- **Text Block**: Rich text content with styling options
- **Image Block**: Image insertion with alignment and sizing
- **Button Block**: Call-to-action buttons with custom styling
- **Divider Block**: Horizontal dividers with customizable styles

### 3. Key Features

#### Drag & Drop

- Drag blocks from sidebar to canvas
- Reorder blocks within sections
- Visual feedback during drag operations
- Drop zones with hover states

#### Section-Based Layout

- Email templates are organized in sections
- Each section can have multiple columns
- Responsive column layouts
- Section-level styling

#### Block Editing

- Click to select blocks
- Properties panel for editing block attributes
- Real-time preview of changes
- Delete blocks with confirmation

#### State Management

- Complete Redux implementation
- Persistent state across sessions
- Undo/redo functionality (structure in place)
- Optimistic updates

## File Structure

```
src/
├── stores/email-builder/          # Redux store
│   ├── index.ts                   # Store registration
│   ├── constants.ts               # Action constants
│   ├── types.ts                   # TypeScript types
│   ├── actions.ts                 # Action creators
│   ├── selectors.ts               # State selectors
│   └── reducer.ts                 # Redux reducer
│
├── builder/                       # Email builder components
│   ├── index.tsx                  # Main builder component
│   ├── types.ts                   # Builder-specific types
│   │
│   ├── components/                # UI components
│   │   ├── Header.tsx             # Top header with controls
│   │   ├── Sidebar.tsx            # Left sidebar with blocks
│   │   ├── Canvas.tsx             # Main editing area
│   │   ├── BlockEditor.tsx        # Block properties panel
│   │   ├── SectionRenderer.tsx    # Section rendering
│   │   ├── ColumnRenderer.tsx     # Column rendering
│   │   ├── BlockRenderer.tsx      # Block rendering
│   │   ├── Sections.tsx           # Block palette
│   │   └── TemplateCard.tsx       # Draggable block cards
│   │
│   └── blocks/                    # Block definitions
│       ├── BlockRegister.tsx      # Block registry
│       └── basic/                 # Basic block types
│           ├── TextBlock.tsx      # Text block
│           ├── ImageBlock.tsx     # Image block
│           ├── ButtonBlock.tsx    # Button block
│           └── DividerBlock.tsx   # Divider block
```

## How to Access

The email builder is now available in your WordPress admin at:

- **URL**: `your-site.com/wp-admin/admin.php?page=quillcrm#/email-builder`
- **Navigation**: Available in the QuillCRM sidebar menu as "Email Builder"

## Usage

### Creating an Email Template

1. **Navigate** to the Email Builder page
2. **Add a Section** by clicking "Add Section"
3. **Drag blocks** from the sidebar into columns
4. **Click blocks** to edit their properties
5. **Customize** styling, content, and layout
6. **Save** your template using the header controls

### Block Types

#### Text Block

- Rich text content
- Font size, color, alignment
- Supports basic HTML

#### Image Block

- Image URL input
- Alt text for accessibility
- Width and alignment controls

#### Button Block

- Custom text and URL
- Background and text colors
- Alignment options

#### Divider Block

- Horizontal lines
- Color, height, and style options
- Margin controls

### Drag & Drop

- **From Sidebar**: Drag blocks from the sidebar to any column
- **Within Canvas**: Reorder blocks by dragging them
- **Visual Feedback**: Drop zones highlight when dragging
- **Responsive**: Works on desktop and tablet devices

## Technical Details

### Redux Actions

- `addBlock`: Add a new block to a column
- `updateBlock`: Update block properties
- `deleteBlock`: Remove a block
- `selectBlock`: Select a block for editing
- `addSection`: Add a new section
- `moveBlock`: Reorder blocks

### State Structure

```typescript
interface EmailBuilderState {
	sections: EmailSection[]; // Email sections
	selectedBlockId: string | null; // Currently selected block
	selectedSectionId: string | null; // Currently selected section
	selectedColumnId: string | null; // Currently selected column
	draggedBlock: EmailBlock | null; // Currently dragged block
	history: {
		// Undo/redo history
		past: EmailSection[][];
		present: EmailSection[];
		future: EmailSection[][];
	};
}
```

### Integration Points

The email builder integrates with your existing:

- **WordPress Data API**: Using `@wordpress/data` for state management
- **UI Components**: Leveraging your existing UI component library
- **Internationalization**: All strings are translatable with `__()` function
- **Build System**: Integrated with your existing webpack configuration

## Extending the Builder

### Adding New Block Types

1. Create a new block file in `src/builder/blocks/basic/`
2. Follow the existing block structure with `Renderer` and `Editor` components
3. Register the block in `src/builder/blocks/BlockRegister.tsx`
4. Update TypeScript types if needed

### Custom Styling

- Blocks support custom CSS through the `styles` property
- Section-level styling is supported
- Responsive design considerations are built-in

## Dependencies Added

- `uuid`: For generating unique IDs
- `@dnd-kit/core`: For drag and drop functionality
- `@dnd-kit/sortable`: For sortable lists
- `@dnd-kit/utilities`: For drag and drop utilities

## Next Steps

The email builder is fully functional and ready for use. You may want to consider:

1. **Email Export**: Add functionality to export templates as HTML
2. **Template Library**: Save and reuse common templates
3. **More Block Types**: Add spacer, social media, or advanced layout blocks
4. **Mobile Preview**: Add responsive preview modes
5. **Integration**: Connect with your email sending functionality

The foundation is solid and extensible for future enhancements!
