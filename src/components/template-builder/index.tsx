import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, Type, Image as ImageIcon, Square, MinusSquare, Grid, ChevronDown } from "lucide-react";
const toolboxItems = [
    { id: "text-template", type: "text", icon: Type, label: "Text Block" },
    { id: "image-template", type: "image", icon: ImageIcon, label: "Image" },
    { id: "button-template", type: "button", icon: Square, label: "Button" },
    { id: "divider-template", type: "divider", icon: MinusSquare, label: "Divider" },
];

const ItemContent = ({ type }) => {
    switch (type) {
        case "text":
            return <p className="p-4 bg-gray-50 rounded">Text Block</p>;
        case "button":
            return (
                <button className="px-4 py-2 bg-blue-500 text-white rounded">
                    Button
                </button>
            );
        case "image":
            return (
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                    <ImageIcon className="text-gray-400" size={32} />
                </div>
            );
        case "divider":
            return <hr className="my-4 border-gray-200" />;
        default:
            return null;
    }
};

const ToolboxItem = ({ id, type, icon: Icon, label }) => {
    return (
        <div
            className="flex items-center p-3 bg-white rounded-lg border mb-2 cursor-move
                 border-gray-200 hover:border-blue-500 hover:shadow-md"
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ id, type, isTemplate: true })
                );
            }}
        >
            <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-md">
                <Icon size={20} className="text-gray-600" />
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
        </div>
    );
};

const Container = ({ id, items, setContainers }) => {
    const [dropIndicator, setDropIndicator] = useState(null);

    const removeDropIndicator = () => {
        const existingIndicator = document.querySelector('.drop-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        setDropIndicator(null);
    };

    const createDropIndicator = (containerElement, y = null, isEmpty = false) => {
        removeDropIndicator();

        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';

        if (isEmpty) {
            // Style for empty container
            indicator.style.cssText = `
                position: absolute;
                left: 1rem;
                right: 1rem;
                top: 4rem;
                bottom: 1rem;
                border: 2px dashed #3b82f6;
                background: rgba(59, 130, 246, 0.1);
                border-radius: 0.5rem;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            `;

            const text = document.createElement('div');
            text.textContent = 'Drop here';
            text.style.cssText = `
                color: #3b82f6;
                font-size: 0.875rem;
                font-weight: 500;
            `;
            indicator.appendChild(text);
        } else if (y !== null) {
            // Style for position between items
            indicator.style.cssText = `
                position: absolute;
                left: 1rem;
                right: 1rem;
                height: 3px;
                background: #3b82f6;
                top: ${y}px;
                transform: translateY(-50%);
                border-radius: 999px;
                pointer-events: none;
                transition: all 0.15s ease;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
                z-index: 10;
            `;

            const dot = document.createElement('div');
            dot.style.cssText = `
                position: absolute;
                left: -4px;
                top: 50%;
                width: 11px;
                height: 11px;
                background: #3b82f6;
                border-radius: 50%;
                transform: translateY(-50%);
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
            `;
            indicator.appendChild(dot);
        }

        containerElement.appendChild(indicator);
        return indicator;
    };

    return (
        <div
            className="bg-gray-50 p-4 rounded-lg min-h-[400px] transition-colors duration-200 border border-gray-200 relative"
            data-container-id={id}
            onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-gray-100');

                const container = e.currentTarget;
                const containerRect = container.getBoundingClientRect();
                const draggableItems = Array.from(container.querySelectorAll('[data-draggable="true"]'));
                const mouseY = e.clientY;

                // Handle empty container
                if (draggableItems.length === 0) {
                    createDropIndicator(container, null, true);
                    return;
                }

                // Handle non-empty container
                let insertAt = null;

                // Check if mouse is before the first item
                const firstItem = draggableItems[0];
                const firstItemRect = firstItem.getBoundingClientRect();
                if (mouseY < firstItemRect.top) {
                    insertAt = firstItemRect.top - containerRect.top;
                } else {
                    // Check between items
                    for (let i = 0; i < draggableItems.length - 1; i++) {
                        const currentItem = draggableItems[i];
                        const nextItem = draggableItems[i + 1];
                        const currentRect = currentItem.getBoundingClientRect();
                        const nextRect = nextItem.getBoundingClientRect();
                        const gap = (nextRect.top + currentRect.bottom) / 2;

                        if (mouseY < gap) {
                            insertAt = nextRect.top - containerRect.top;
                            break;
                        }
                    }

                    // Check if mouse is after the last item
                    const lastItem = draggableItems[draggableItems.length - 1];
                    const lastItemRect = lastItem.getBoundingClientRect();
                    if (insertAt === null && mouseY >= lastItemRect.bottom) {
                        insertAt = lastItemRect.bottom - containerRect.top;
                    }
                }

                if (insertAt !== null) {
                    createDropIndicator(container, insertAt);
                }
            }}
            onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    e.currentTarget.classList.remove('bg-gray-100');
                    removeDropIndicator();
                }
            }}
            onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-gray-100');
                removeDropIndicator();

                try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    const container = e.currentTarget;
                    const draggableItems = Array.from(container.querySelectorAll('[data-draggable="true"]'));
                    const mouseY = e.clientY;

                    let insertIndex = draggableItems.length;
                    for (let i = 0; i < draggableItems.length; i++) {
                        const rect = draggableItems[i].getBoundingClientRect();
                        const itemMiddle = rect.top + rect.height / 2;
                        if (mouseY < itemMiddle) {
                            insertIndex = i;
                            break;
                        }
                    }

                    if (data.isTemplate) {
                        setContainers((prev) => {
                            const newItem = {
                                id: `${data.type}-${Date.now()}`,
                                type: data.type,
                            };
                            const currentItems = [...prev[id]];
                            currentItems.splice(insertIndex, 0, newItem);

                            return {
                                ...prev,
                                [id]: currentItems,
                            };
                        });
                    }
                } catch (error) {
                    console.error("Error processing drop:", error);
                }
            }}
        >
            <h2 className="text-lg font-semibold mb-4">Column {id}</h2>
            <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                {items.map((item) => (
                    <DraggableItem key={item.id} id={item.id} content={item} />
                ))}
            </SortableContext>
        </div>
    );
};

const DraggableItem = ({ id, content }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-4 mb-2 rounded-lg shadow border border-gray-200 cursor-move hover:shadow-md transition-shadow"
            data-draggable="true"
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ id, type: content.type })
                );
            }}
        >
            <ItemContent type={content.type} />
        </div>
    );
};


const AddSectionButton = ({ onAdd }) => {
    return (
        <button
            onClick={onAdd}
            className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg 
                      flex items-center justify-center gap-2 text-gray-600 hover:border-blue-500 
                      hover:text-blue-500 transition-colors group"
        >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Add New Section</span>
        </button>
    );
};

const SectionConfigModal = ({ isOpen, onClose, onConfirm }) => {
    const [columns, setColumns] = useState([]);

    const presets = [
        { id: '1', layout: [1], icon: '│' },
        { id: '2', layout: [1 / 2, 1 / 2], icon: '║' },
        { id: '3', layout: [1 / 3, 1 / 3, 1 / 3], icon: '│││' },
        { id: '4', layout: [2 / 3, 1 / 3], icon: '║│' },
        { id: '5', layout: [1 / 3, 2 / 3], icon: '│║' },
        { id: '6', layout: [1 / 4, 1 / 4, 1 / 4, 1 / 4], icon: '||||' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Select Column Layout</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    {presets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => {
                                onConfirm(preset.layout);
                                onClose();
                            }}
                            className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50
                                     flex flex-col items-center gap-2 transition-colors"
                        >
                            <span className="text-2xl font-mono">{preset.icon}</span>
                            <span className="text-sm text-gray-600">
                                {preset.layout.length} Columns
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Section = ({ id, columns, items, setContainers, onDeleteSection }) => {
    return (
        <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onDeleteSection(id)}
                    className="p-1 text-gray-500 hover:text-red-500"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div
                className="grid gap-4"
                style={{
                    gridTemplateColumns: columns.map(width => `${width * 100}%`).join(' ')
                }}
            >
                {columns.map((_, index) => (
                    <Container
                        key={`${id}-${index}`}
                        id={`${id}-${index}`}
                        items={items[`${id}-${index}`] || []}
                        setContainers={setContainers}
                    />
                ))}
            </div>
        </div>
    );
};

const Builder = () => {
    const [sections, setSections] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [containers, setContainers] = useState({});
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        })
    );

    const handleAddSection = (columnLayout) => {
        const sectionId = `section-${Date.now()}`;
        setSections(prev => [...prev, {
            id: sectionId,
            columns: columnLayout
        }]);

        // Initialize containers for the new section
        setContainers(prev => {
            const newContainers = { ...prev };
            columnLayout.forEach((_, index) => {
                newContainers[`${sectionId}-${index}`] = [];
            });
            return newContainers;
        });
    };

    const handleDeleteSection = (sectionId) => {
        setSections(prev => prev.filter(section => section.id !== sectionId));
        setContainers(prev => {
            const newContainers = { ...prev };
            // Remove containers associated with this section
            Object.keys(newContainers).forEach(key => {
                if (key.startsWith(`${sectionId}-`)) {
                    delete newContainers[key];
                }
            });
            return newContainers;
        });
    };

    const findContainer = (itemId) => {
        if (!itemId) return null;
        return Object.keys(containers).find((key) =>
            containers[key].some((item) => item.id === itemId)
        );
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;

        if (!over || !active) return;

        const activeId = active.id;
        const overId = over.id;

        const activeContainer = findContainer(activeId);
        const overContainer = String(overId);

        if (!activeContainer || !containers[overContainer]) return;
        if (activeContainer === overContainer) return;

        setContainers((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];

            const activeIndex = activeItems.findIndex(item => item.id === activeId);
            const activeItem = activeItems[activeIndex];

            if (!activeItem) return prev;

            return {
                ...prev,
                [activeContainer]: activeItems.filter(item => item.id !== activeId),
                [overContainer]: [...overItems, activeItem]
            };
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        const activeContainer = findContainer(activeId);
        const overContainer = Object.keys(containers).includes(String(overId))
            ? String(overId)
            : findContainer(overId);

        if (!activeContainer || !overContainer || !containers[overContainer]) {
            setActiveId(null);
            return;
        }

        if (activeContainer === overContainer) {
            // Sorting within the same container
            const activeIndex = containers[activeContainer].findIndex(
                item => item.id === activeId
            );
            const overIndex = containers[activeContainer].findIndex(
                item => item.id === overId
            );

            if (activeIndex !== overIndex) {
                setContainers((prev) => ({
                    ...prev,
                    [activeContainer]: arrayMove(
                        prev[activeContainer],
                        activeIndex,
                        overIndex
                    ),
                }));
            }
        } else {
            // Moving between different containers
            setContainers((prev) => {
                const activeItems = prev[activeContainer];
                const overItems = prev[overContainer];

                const activeIndex = activeItems.findIndex(item => item.id === activeId);
                const activeItem = activeItems[activeIndex];

                // If dropping onto a container directly
                if (overId === overContainer) {
                    return {
                        ...prev,
                        [activeContainer]: activeItems.filter(item => item.id !== activeId),
                        [overContainer]: [...overItems, activeItem]
                    };
                }

                // If dropping onto an item
                const overIndex = overItems.findIndex(item => item.id === overId);
                const insertIndex = overIndex >= 0 ? overIndex : overItems.length;

                return {
                    ...prev,
                    [activeContainer]: activeItems.filter(item => item.id !== activeId),
                    [overContainer]: [
                        ...overItems.slice(0, insertIndex),
                        activeItem,
                        ...overItems.slice(insertIndex)
                    ]
                };
            });
        }

        setActiveId(null);
    };

    const getActiveItem = () => {
        const containerId = findContainer(activeId);
        if (!containerId || !containers[containerId]) return null;
        return containers[containerId].find((item) => item.id === activeId);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-64 bg-white border-r border-gray-200 p-4">
                <h2 className="text-lg font-medium mb-4">Elements</h2>
                {toolboxItems.map((item) => (
                    <ToolboxItem key={item.id} {...item} />
                ))}
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    {sections.map(section => (
                        <Section
                            key={section.id}
                            id={section.id}
                            columns={section.columns}
                            items={containers}
                            setContainers={setContainers}
                            onDeleteSection={handleDeleteSection}
                        />
                    ))}

                    <AddSectionButton onAdd={() => setIsModalOpen(true)} />

                    <DragOverlay>
                        {activeId && getActiveItem() ? (
                            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
                                <ItemContent type={getActiveItem().type} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                <SectionConfigModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleAddSection}
                />
            </div>
        </div>
    );
};

export default Builder;