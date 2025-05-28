/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

export type MindMapComplexity = 'auto' | 'simple' | 'detailed' | 'extended';
export type MindMapType = 'auto' | 'tutorial' | 'concept_deep_dive' | 'pros_and_cons' | 'comparison' | 'historical';

export type SpecificExplanationType = 'what' | 'who' | 'when' | 'why' | 'how';

export interface MindMapNode {
  id: string;
  label: string;
  title?: string;
  group?: string | 'center' | 'main' | 'detail' | 'research' | 'elaboration' | 'obsidian_default' |
          `explanation_${SpecificExplanationType | 'default'}` |
          'example_node' | 'pros_node' | 'cons_node' | // New groups for elaborate dropdown
          'historical_event' | 'historical_era' | 'chat_added' |
          'group_merged_default' | 'group_merged_alternate' | // Added for merge content
          'connector_node'; // Added for Make Connection feature
  shape?: 'ellipse' | 'box' | 'circle' | 'database' | 'text' | 'diamond' | 'dot' | 'star' | 'triangle' | 'triangleDown' | 'hexagon' | 'square';
  x?: number;
  y?: number;
  level?: number;
  hidden?: boolean;
  physics?: boolean;
  fixed?: { x: boolean, y: boolean };
  value?: number;
  date?: string; 
  era?: string;  
  parsedDate?: Date;
  // Internal properties for dynamic styling, not part of core data model for AI
  originalBorderColor?: string;
  originalBorderWidth?: number; 
}

export type VisSmoothType = | 'dynamic' | 'continuous' | 'discrete' | 'diagonalCross' | 'straightCross' | 'horizontal' | 'vertical' | 'curvedCW' | 'curvedCCW' | 'cubicBezier';
export interface VisEdgeSmoothOptions { enabled: boolean; type: VisSmoothType; forceDirection?: 'horizontal' | 'vertical' | 'none' | boolean; roundness: number; }

export interface MindMapEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  arrows?: string | { to?: { enabled?: boolean, scaleFactor?: number, type?: string } };
  dashes?: boolean | number[];
  smooth?: boolean | VisEdgeSmoothOptions;
  hidden?: boolean;
  physics?: boolean;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface ElaborationDetail { // Reused for examples, pros, cons
  label: string;
  title?: string;
  relationshipLabel?: string;
}

export interface ExplanationDetail {
  label: string;
  title?: string;
  relationshipLabel: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: number;
  groundingSources?: { uri: string; title: string; }[];
}

export interface AddNodeFromChatResult {
  mainNodeAdded: boolean;
  newNodeId?: string;
  newNodeLabel?: string;
  parentNodeId?: string | null;
  parentNodeLabel?: string | null;
}

// LoadingType used in App.tsx and ContentContainer.tsx
export type ContentLoadingType =
  'generation' |
  'elaboration' |
  `explanation_${SpecificExplanationType | 'default'}` |
  'expansion' |
  'chat_add_node' |
  'give_examples' |
  'elaborate_pros' |
  'elaborate_cons' |
  'add_descriptions' |
  'enhancing_description' |
  'merging_content' |
  'making_connection'; // Added for Make Connection feature

// QuizQuestion interface removed
// export interface QuizQuestion {
//   id: string;
//   questionText: string;
//   options: string[];
//   correctAnswer: string;
// }
