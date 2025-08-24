export interface Block {
  id: string;
  type: BlockType;
  content: any;
  styles?: Record<string, any>;
}

export type BlockType = 'text' | 'image' | 'button' | 'divider';

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
  number: number[];
  value: string;
} 