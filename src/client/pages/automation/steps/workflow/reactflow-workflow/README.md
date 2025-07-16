# ReactFlow Workflow Visualization

This directory contains a React-based workflow visualization system built on top of [ReactFlow](https://reactflow.dev/) for the QuillCRM automation system. It provides a visual, interactive interface for creating, editing, and managing automation workflows.

## 📋 Overview

The ReactFlow Workflow system renders automation workflows as interactive node-based diagrams where:

- **Nodes** represent workflow steps (triggers, actions, conditions, goals)
- **Edges** connect nodes and provide interactive add-step functionality
- **Visual flow** shows the execution path of automations

## 🏗️ Architecture

```
reactflow-workflow/
├── index.tsx                 # Main component entry point
├── workflow-visualization.tsx # Core ReactFlow implementation
├── style.scss               # Styling for all components
├── nodes/                   # Custom node components
│   ├── trigger-node.tsx     # Workflow trigger node
│   ├── action-node.tsx      # Action step node
│   ├── condition-node.tsx   # Conditional branching node
│   ├── goal-node.tsx        # Goal tracking node
│   ├── end-node.tsx         # Workflow termination node
│   └── add-step-node.tsx    # Interactive step addition node
└── edges/                   # Custom edge components
    └── add-step-edge.tsx    # Interactive edge for adding steps
```

## 📁 File Descriptions

### Core Components

#### `index.tsx`

- **Purpose**: Main entry point and wrapper component
- **Functionality**:
    - Provides the public API for the workflow visualization
    - Handles prop delegation to the core visualization
    - Manages the container styling
- **Props**:
    - `onStepClick`: Callback for step interactions
    - `onTriggerClick`: Callback for trigger interactions

#### `workflow-visualization.tsx` (697 lines)

- **Purpose**: Core ReactFlow implementation and workflow logic
- **Key Features**:
    - **Node Management**: Creates and positions workflow nodes based on step data
    - **Edge Management**: Connects nodes and handles relationships
    - **Position Persistence**: Saves/restores node positions via automation settings
    - **Hierarchical Processing**: Handles parent-child step relationships
    - **Real-time Updates**: Syncs with automation context state
    - **Interactive Controls**: Provides zoom, pan, minimap, and background
- **State Management**:
    - Uses ReactFlow's `useNodesState` and `useEdgesState` hooks
    - Integrates with `useAutomationContext` for data persistence
    - Debounced position saving to prevent API spam

#### `style.scss` (304 lines)

- **Purpose**: Comprehensive styling for the entire workflow system
- **Coverage**:
    - ReactFlow container and controls styling
    - Custom node appearances and states
    - Edge styling and interactions
    - Responsive design and hover effects
    - Loading states and error handling

### Node Components

All node components follow a consistent pattern with:

- ReactFlow `Handle` components for connections
- Ant Design icons and components for UI
- Edit/delete functionality where applicable
- Integration with the automation context

#### `trigger-node.tsx` (49 lines)

- **Purpose**: Represents the workflow trigger (starting point)
- **Features**:
    - Displays trigger type and label
    - Rocket icon for visual identification
    - Bottom handle for outgoing connections
    - Non-editable (triggers are managed separately)

#### `action-node.tsx` (197 lines)

- **Purpose**: Represents action steps in the workflow
- **Features**:
    - Action type display with icons
    - Edit/delete controls
    - Status indicators and tags
    - Configuration management
    - Top/bottom handles for chaining

#### `condition-node.tsx` (211 lines)

- **Purpose**: Represents conditional branching logic
- **Features**:
    - Multiple output handles (yes/no paths)
    - Condition configuration display
    - Branch management
    - Complex flow control

#### `goal-node.tsx` (192 lines)

- **Purpose**: Represents goal tracking and measurement
- **Features**:
    - Goal progress visualization
    - Metric display
    - Achievement tracking
    - Performance indicators

#### `end-node.tsx` (154 lines)

- **Purpose**: Represents workflow termination points
- **Features**:
    - End state indication
    - Final action summary
    - No outgoing connections
    - Terminal node styling

#### `add-step-node.tsx` (244 lines)

- **Purpose**: Interactive node for adding new workflow steps
- **Features**:
    - Step type selection interface
    - Dynamic insertion into workflow
    - Parent-child relationship handling
    - Position-aware creation

### Edge Components

#### `add-step-edge.tsx` (323 lines)

- **Purpose**: Interactive edges that allow step insertion between existing nodes
- **Features**:
    - **Inline Step Addition**: Click to add steps between existing nodes
    - **Step Type Selection**: Popover with action/condition/goal options
    - **Order Management**: Automatically handles step ordering and hierarchy
    - **Real-time Updates**: Immediately reflects changes in the workflow
    - **Conditional Paths**: Supports branching logic for conditions

## 🔄 Workflow Logic

### Node Creation Process

1. **Data Processing**: Steps are organized into hierarchical structure
2. **Position Calculation**: Nodes are positioned using saved coordinates or calculated defaults
3. **Connection Logic**: Edges are created based on step relationships and order
4. **Interactive Elements**: Add-step nodes and edges are inserted for user interaction

### Position Management

- **Persistence**: Node positions are saved to `automation.settings.reactflow_positions`
- **Debouncing**: Position updates are debounced to prevent API spam
- **Fallback**: Calculated positions used when saved positions unavailable
- **Responsive**: Layout adapts to different step configurations

### State Synchronization

- **Context Integration**: Uses `useAutomationContext` for data management
- **Real-time Updates**: Changes immediately reflect in the visualization
- **Optimistic Updates**: UI updates before API confirmation
- **Error Handling**: Graceful fallbacks for network issues

## 🎨 Styling System

The styling system uses SCSS with:

- **Component Scoping**: Each component has scoped styles
- **Consistent Theming**: Unified color scheme and spacing
- **Responsive Design**: Adapts to different screen sizes
- **Interactive States**: Hover, active, and disabled states
- **Accessibility**: WCAG compliant styling

### Key Style Classes

- `.qcrm-reactflow-workflow`: Main container
- `.qcrm-reactflow-node`: Base node styling
- `.qcrm-reactflow-node--{type}`: Type-specific node styles
- `.qcrm-reactflow-handle`: Connection point styling
- `.qcrm-reactflow-edge`: Edge styling

## 🔧 Usage Example

```tsx
import ReactFlowWorkflow from '@/reactflow-workflow';

const MyComponent = () => {
	const handleStepClick = (step) => {
		// Handle step editing
		console.log('Edit step:', step);
	};

	const handleTriggerClick = () => {
		// Handle trigger configuration
		console.log('Configure trigger');
	};

	return (
		<ReactFlowWorkflow
			onStepClick={handleStepClick}
			onTriggerClick={handleTriggerClick}
		/>
	);
};
```

## 🚀 Features

- **Visual Workflow Builder**: Drag-and-drop interface for workflow creation
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Persistent Layouts**: Node positions saved and restored
- **Hierarchical Steps**: Support for nested and conditional logic
- **Interactive Editing**: In-line step addition and modification
- **Responsive Design**: Works on desktop and tablet devices
- **Performance Optimized**: Efficient rendering of complex workflows

## 🔗 Dependencies

### External

- `@xyflow/react`: Core ReactFlow functionality
- `@wordpress/element`: React hooks and utilities
- `@wordpress/i18n`: Internationalization
- `@ant-design/icons`: UI icons
- `antd`: UI components
- `lodash`: Utility functions

### Internal

- `@quillcrm/client`: Type definitions
- `@quillcrm/utils`: Helper functions
- Automation context for state management

## 🎯 Integration Points

- **Automation Context**: Provides workflow data and state management
- **Step Management**: Creates, updates, and deletes workflow steps
- **Position Persistence**: Saves layout to automation settings
- **Navigation**: Integrates with parent automation editor
- **API Layer**: Syncs changes with backend via WordPress API
