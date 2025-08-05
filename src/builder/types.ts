export interface Block {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider';
  content: any;
  styles?: Record<string, any>;
}

export interface Section {
  id: string;
  columns: Column[];
}

export interface Column {
  id: string;
  width: number; // Percentage or fraction
  blocks: Block[];
}

export interface BuilderState {
  sections: Section[];
  selectedBlock: string | null;
  draggedBlock: Block | null;
}

export interface LayoutTemplate {
  name: string;
  columns: number[];
  value: string;
} 