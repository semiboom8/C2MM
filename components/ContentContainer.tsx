/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import { parseJSON } from '@/lib/parse';
import { getMindMapFromContentPrompt, getElaborateNodePrompt, getExplainNodePrompt, getExpandMapNodePrompt, getHistoricalMapPrompt, getFindParentAndDefineEntityPrompt, getExplainNodePromptSpecific, getGiveExamplesPrompt, getElaborateProsPrompt, getElaborateConsPrompt, getAddNodeDescriptionPrompt, getEnhanceNodeDescriptionPrompt, getParseContentForMergePrompt, getMergeConnectionsPrompt } from '@/lib/prompts'; 
import { generateText } from '@/lib/textGeneration';
import { MindMapData, MindMapNode, MindMapEdge, MindMapComplexity, MindMapType, ElaborationDetail, ExplanationDetail, AddNodeFromChatResult, SpecificExplanationType, ContentLoadingType } from '@/lib/types';
import { ObsidianNodeData } from '@/lib/obsidianExport';
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Network, Options, DataSet, Data, Node, Edge } from 'vis-network/standalone/umd/vis-network.min.js';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1';


interface ContentContainerProps {
  sourceIdentifier: string; 
  sourceType: 'url' | 'transcript' | null;
  sourceTextContent: string | null; 
  mindMapComplexity: MindMapComplexity;
  mindMapType: MindMapType;
  isObsidianStyle: boolean;
  onLoadingStateChange?: (isLoading: boolean, type: ContentLoadingType) => void;
  onNodeSelected?: (nodeId: string | null) => void;
  initialPhysicsFrozen?: boolean;
  textFadeThreshold: number;
  nodeSizeMultiplier: number;
  linkThicknessMultiplier: number;
  preloadedMapData?: MindMapData | null;
  arrowsEnabled: boolean;
  centerForce: number;
  repelForce: number; 
  linkForce: number;
  linkDistance: number;
  // For "Make a Connection" feature
  isConnectionModeActive: boolean;
  selectedNodesForConnection: string[];
  onToggleNodeForConnection: (nodeId: string) => void;
}

type NetworkLoadingState = 'idle' | 'loading' | 'ready' | 'error';

interface ExposedFunctions {
  captureAndDownloadImage: () => Promise<void>;
  elaborateOnSelectedNode: () => Promise<void>;
  explainSelectedNode: (explanationType: SpecificExplanationType | 'default') => Promise<void>;
  togglePhysics: (freeze: boolean) => void;
  centerNetworkView: () => void;
  getMapDataForObsidianExport: () => ObsidianNodeData[] | null;
  getMapContextForChat: () => string;
  getSelectedNodeDetails: () => { id: string; label: string; description?: string; } | null;
  addNodeFromChat: (entityText: string, chatMessageContext: string) => Promise<AddNodeFromChatResult>;
  getAllNodeLabels: () => string[];
  expandMap: (numSubNodes: number, allowInternet: boolean) => Promise<{ totalNodesAdded: number }>;
  freezeSelectedNode: () => Promise<void>;
  isNodeFrozen: (nodeId: string) => boolean;
  giveExamplesForSelectedNode: () => Promise<void>;
  elaborateProsForSelectedNode: () => Promise<void>;
  elaborateConsForSelectedNode: () => Promise<void>;
  getImportantNodesForFlashcards: () => Array<{ label: string; title?: string; }> | null;
  addMissingDescriptions: () => Promise<{ nodesUpdated: number }>;
  enhanceSelectedNodeDescription: () => Promise<{ success: boolean; newDescription?: string }>;
  mergeNewContent: (newContentSource: string, newContentType: 'url' | 'text', useAlternateColor: boolean, attemptMerge: boolean, makeNewTopNodesMain: boolean) => Promise<void>;
  getDetailsForNodeIds: (nodeIds: string[]) => Promise<Array<{id: string, label: string, title?:string, x?: number, y?: number}>>;
  addConnectionNodeAndEdges: (details: { connectorNodeLabel: string; connectorNodeTitle?: string; selectedNodeIds: string[]; position?: { x: number; y: number }; isObsidianStyle: boolean; arrowsEnabled: boolean; }) => Promise<{newNodeId: string} | null>;
}

type NetworkInstance = Network & {
  canvas?: {
    frame?: HTMLCanvasElement;
    background?: HTMLCanvasElement;
  };
  options: Options;
};

const BASE_OBSIDIAN_NODE_SCALING_MIN = 10;
const BASE_OBSIDIAN_NODE_SCALING_MAX = 30;
const BASE_OBSIDIAN_NODE_SIZE = 15;
const BASE_NON_OBSIDIAN_NODE_SIZE = 20;
const MAX_NON_OBSIDIAN_NODE_SIZE = 50;
const BASE_EDGE_WIDTH = 1;
const CONNECTION_NODE_HIGHLIGHT_COLOR = 'var(--color-connection-node-highlight, #FFD700)';


const ContentContainer = forwardRef<ExposedFunctions, ContentContainerProps>(({
  sourceIdentifier,
  sourceType,
  sourceTextContent,
  mindMapComplexity,
  mindMapType,
  isObsidianStyle,
  onLoadingStateChange,
  onNodeSelected,
  initialPhysicsFrozen = false,
  textFadeThreshold,
  nodeSizeMultiplier,
  linkThicknessMultiplier,
  preloadedMapData,
  arrowsEnabled,
  centerForce,
  repelForce,
  linkForce,
  linkDistance,
  isConnectionModeActive,
  selectedNodesForConnection,
  onToggleNodeForConnection,
}, ref) => {
  const [nodesDataSet, setNodesDataSet] = useState<DataSet<MindMapNode> | null>(null);
  const [edgesDataSet, setEdgesDataSet] = useState<DataSet<MindMapEdge> | null>(null);
  const [networkLoadingState, setNetworkLoadingState] = useState<NetworkLoadingState>('idle');
  const [currentLoadingType, setCurrentLoadingType] = useState<ContentLoadingType>('generation');
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPhysicsCurrentlyFrozen, setIsPhysicsCurrentlyFrozen] = useState(!!initialPhysicsFrozen);

  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<NetworkInstance | null>(null);
  const lastAssignedNodeId = useRef<number>(0);

  useEffect(() => {
    setIsPhysicsCurrentlyFrozen(!!initialPhysicsFrozen);
  }, [initialPhysicsFrozen]);

  const generateNewNodeId = useCallback((prefix = 'node_') => {
    lastAssignedNodeId.current += 1;
    return `${prefix}${lastAssignedNodeId.current}_${uuidv4().slice(0,4)}`;
  }, []);

  const setPhysicsEnabled = useCallback((enabled: boolean) => {
    if (networkInstanceRef.current && mindMapType !== 'historical') {
      networkInstanceRef.current.setOptions({ physics: { enabled } });
      setIsPhysicsCurrentlyFrozen(!enabled);
    } else if (mindMapType === 'historical') {
      setIsPhysicsCurrentlyFrozen(true); 
    }
  }, [setIsPhysicsCurrentlyFrozen, mindMapType]);

  const getPhysicsState = useCallback(() => {
    return { isFrozen: mindMapType === 'historical' || isPhysicsCurrentlyFrozen };
  }, [isPhysicsCurrentlyFrozen, mindMapType]);

  const handleGenericElaborationAction = async (
    actionType: 'give_examples' | 'elaborate_pros' | 'elaborate_cons',
    promptFunction: (selectedNodeLabel: string, currentMapThemes: string) => string,
    nodeGroup: MindMapNode['group']
  ) => {
    const currentSelectedNodeId = selectedNodeId;
    if (!currentSelectedNodeId || !nodesDataSet || !edgesDataSet) { setError(`No node selected for ${actionType}.`); return; }
    const selectedNode = nodesDataSet.get(currentSelectedNodeId);
    if (!selectedNode) { setError("Selected node data not found."); return; }

    setCurrentLoadingType(actionType as ContentLoadingType); 
    setNetworkLoadingState('loading');
    setError(null);

    const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
    if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);

    try {
      const allLabels = nodesDataSet.get({ fields: ['label'] }).map(n => n.label).filter(Boolean);
      const currentMapThemes = [...new Set(allLabels)].slice(0, 10).join(', ');
      const prompt = promptFunction(selectedNode.label, currentMapThemes);
      const result = await generateText({ prompt, responseMimeType: "application/json" });
      const newDetails: ElaborationDetail[] = parseJSON(result.text);

      if (!Array.isArray(newDetails)) throw new Error(`Invalid ${actionType} data from API.`);
      
      const newNodes: MindMapNode[] = []; const newEdges: MindMapEdge[] = [];
      newDetails.forEach((detail, i) => {
        const newNodeId = generateNewNodeId(`${nodeGroup}_${i}_`);
        newNodes.push({ id: newNodeId, label: detail.label, title: detail.title || detail.label, group: nodeGroup, value: isObsidianStyle ? 2 : undefined });
        newEdges.push({ 
            from: currentSelectedNodeId, 
            to: newNodeId, 
            label: detail.relationshipLabel || '', 
            arrows: arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }} : '', 
            id: `edge_${nodeGroup}_${currentSelectedNodeId}_to_${newNodeId}_${uuidv4().slice(0,4)}`
        });
      });
      nodesDataSet.add(newNodes); edgesDataSet.add(newEdges);
      setNetworkLoadingState('ready');
      if (networkInstanceRef.current) {
        networkInstanceRef.current.focus(currentSelectedNodeId, { animation: true });
        if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 700);
      }
    } catch (err) {
      console.error(`Error during ${actionType}:`, err);
      setError(err instanceof Error ? err.message : `Unknown error during ${actionType}.`);
      setNetworkLoadingState('error');
      if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
    }
  };


  useImperativeHandle(ref, () => {
    const getMapContextForChat = (): string => {
      if (!nodesDataSet || !edgesDataSet) return "No mind map data loaded.";
      let context = "Mind Map Content:\nNodes:\n";
      (nodesDataSet.get() as MindMapNode[]).forEach(n => { context += `- "${n.label}"${n.title && n.title !== n.label ? `: ${n.title}` : ''}${n.date ? ` (Date: ${n.date})` : ''}${n.era ? ` (Era: ${n.era})` : ''}\n`; });
      context += "\nEdges (Relationships):\n";
      (edgesDataSet.get() as MindMapEdge[]).forEach(e => {
        const fromN = nodesDataSet.get(e.from); const toN = nodesDataSet.get(e.to);
        if (fromN && toN) context += `- "${fromN.label}" ${e.label ? `(${e.label})` : '->'} "${toN.label}"\n`;
      });
      return context;
    };

    const mergeNewContent = async (
        newContentSource: string,
        newContentType: 'url' | 'text',
        useAlternateColor: boolean,
        attemptMerge: boolean,
        makeNewTopNodesMain: boolean 
      ): Promise<void> => {
        if (!nodesDataSet || !edgesDataSet) {
          throw new Error("Existing mind map data not available for merging.");
        }
    
        setCurrentLoadingType('merging_content');
        setNetworkLoadingState('loading');
        setError(null);
    
        const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
        if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);
    
        try {
          const parsePrompt = getParseContentForMergePrompt(isObsidianStyle);
          let parsedNewContentResult;
          if (newContentType === 'url') {
            parsedNewContentResult = await generateText({ prompt: parsePrompt, videoUrl: newContentSource, responseMimeType: "application/json" });
          } else {
            const combinedPrompt = `${parsePrompt}\n\nAnalyze the following text content for merging:\n---\n${newContentSource}\n---`;
            parsedNewContentResult = await generateText({ prompt: combinedPrompt, responseMimeType: "application/json" });
          }
          
          const newMapData: MindMapData = parseJSON(parsedNewContentResult.text);
          if (!newMapData || !Array.isArray(newMapData.nodes) || !Array.isArray(newMapData.edges)) {
            throw new Error("Invalid data structure received for new content to merge.");
          }
    
          const newNodesToAdd: MindMapNode[] = [];
          const newEdgesToAdd: MindMapEdge[] = [];
          const newIdMap = new Map<string, string>(); 
    
          newMapData.nodes.forEach(node => {
            const globallyUniqueNodeId = generateNewNodeId(`merge_${node.id}_`);
            newIdMap.set(node.id, globallyUniqueNodeId);

            let isNewTopLevelNode = true;
            for (const edge of newMapData.edges) {
                if (edge.to === node.id) { 
                    isNewTopLevelNode = false;
                    break;
                }
            }
            
            let finalGroup: MindMapNode['group'];
            let finalValue: number | undefined = (isObsidianStyle && typeof node.value === 'number') ? node.value : (isObsidianStyle ? 2 : undefined);

            if (isNewTopLevelNode && makeNewTopNodesMain) {
                finalGroup = 'main';
                if (isObsidianStyle) {
                    finalValue = Math.max(finalValue || 0, 5); 
                }
            } else {
                finalGroup = useAlternateColor ? 'group_merged_alternate' : 'group_merged_default';
            }

            newNodesToAdd.push({
              ...node,
              id: globallyUniqueNodeId,
              group: finalGroup,
              value: finalValue,
              shape: node.shape || (isObsidianStyle ? 'dot' : 'box'),
            });
          });
    
          newMapData.edges.forEach(edge => {
            const fromId = newIdMap.get(edge.from);
            const toId = newIdMap.get(edge.to);
            if (fromId && toId) {
              newEdgesToAdd.push({
                ...edge,
                id: generateNewNodeId(`medge_${edge.id || uuidv4().slice(0,4)}_`),
                from: fromId,
                to: toId,
                arrows: edge.arrows || (arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }} : ''),
              });
            }
          });
    
          nodesDataSet.add(newNodesToAdd);
          edgesDataSet.add(newEdgesToAdd);
    
          if (attemptMerge && newNodesToAdd.length > 0) {
            const existingMapContext = getMapContextForChat();
            const existingNodesArray = nodesDataSet.get({ returnType: 'Array' }) as MindMapNode[];
            const rootNode = existingNodesArray.find(n => n.group === 'center') || (isObsidianStyle && existingNodesArray.length > 0 ? existingNodesArray.reduce((prev, curr) => (prev.value || 0) > (curr.value || 0) ? prev : curr) : existingNodesArray[0]);
            const existingRootNodeLabel = rootNode ? rootNode.label : null;
    
            const nodesWithIncomingNewEdges = new Set(newEdgesToAdd.map(e => e.to));
            const newTopLevelNodesForAIConnection = newNodesToAdd.filter(n => !nodesWithIncomingNewEdges.has(n.id));
    
            for (const newTopNode of newTopLevelNodesForAIConnection) {
              try {
                const connectPrompt = getMergeConnectionsPrompt(
                  existingMapContext,
                  newNodesToAdd.map(n => ({ id: n.id, label: n.label, title: n.title })),
                  { id: newTopNode.id, label: newTopNode.label, title: newTopNode.title },
                  existingRootNodeLabel
                );
                const connectionResult = await generateText({ prompt: connectPrompt, responseMimeType: "application/json" });
                const connectionSuggestion = parseJSON(connectionResult.text) as { connectToExistingNodeLabel: string | "ROOT_NODE" | null; relationshipLabel: string };
    
                let targetNodeId: string | null = null;
                if (connectionSuggestion.connectToExistingNodeLabel === "ROOT_NODE" && rootNode) {
                  targetNodeId = rootNode.id;
                } else if (connectionSuggestion.connectToExistingNodeLabel) {
                  const target = existingNodesArray.find(n => n.label.toLowerCase() === String(connectionSuggestion.connectToExistingNodeLabel).toLowerCase());
                  if (target) targetNodeId = target.id;
                }
    
                if (targetNodeId) {
                  edgesDataSet.add({
                    id: generateNewNodeId(`aiconnect_${newTopNode.id}_`),
                    from: targetNodeId, 
                    to: newTopNode.id,
                    label: connectionSuggestion.relationshipLabel || "related",
                    arrows: arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }} : '',
                  });
                }
              } catch (connectionError) {
                console.warn(`AI connection failed for new node "${newTopNode.label}":`, connectionError);
              }
            }
          }
    
          setNetworkLoadingState('ready');
          if (networkInstanceRef.current) {
            networkInstanceRef.current.fit({ animation: true });
            if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 700);
          }
    
        } catch (err) {
          console.error('Error merging new content:', err);
          setError(err instanceof Error ? err.message : 'Unknown error during content merge.');
          setNetworkLoadingState('error');
          if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
          throw err; 
        }
      };
      
      const addConnectionNodeAndEdges = async (
        details: {
          connectorNodeLabel: string;
          connectorNodeTitle?: string;
          selectedNodeIds: string[];
          position?: { x: number; y: number };
          isObsidianStyle: boolean;
          arrowsEnabled: boolean;
        }
      ): Promise<{newNodeId: string} | null> => {
        if (!nodesDataSet || !edgesDataSet) {
          setError("Datasets not available for adding connection node.");
          return null;
        }
    
        setCurrentLoadingType('making_connection');
        setNetworkLoadingState('loading');
        setError(null);
    
        const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
        if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);
    
        try {
          const newNodeId = generateNewNodeId('connector_');
          const newNode: MindMapNode = {
            id: newNodeId,
            label: details.connectorNodeLabel,
            title: details.connectorNodeTitle || details.connectorNodeLabel,
            group: 'connector_node',
            value: details.isObsidianStyle ? 6 : undefined,
            shape: details.isObsidianStyle ? 'diamond' : 'ellipse', // Or other distinct shape
            x: details.position?.x,
            y: details.position?.y,
            fixed: details.position ? { x: false, y: false } : undefined, // Allow physics to adjust initially
          };
          nodesDataSet.add(newNode);
    
          const newEdges: MindMapEdge[] = details.selectedNodeIds.map(selectedId => ({
            id: generateNewNodeId(`conn_edge_${newNodeId}_${selectedId}_`),
            from: newNodeId,
            to: selectedId,
            label: "connects",
            arrows: details.arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' } } : '',
            dashes: [2, 2] // Dashed line for connection edges
          }));
          edgesDataSet.add(newEdges);
    
          setNetworkLoadingState('ready');
          if (networkInstanceRef.current) {
            networkInstanceRef.current.focus(newNodeId, { animation: true, scale: networkInstanceRef.current.getScale() * 1.1 });
            if (wasPhysicsFrozen && mindMapType !== 'historical') {
                setTimeout(() => {
                    setPhysicsEnabled(false);
                    // Optionally fix the new node after initial physics run
                    // const finalPos = networkInstanceRef.current?.getPositions([newNodeId])[newNodeId];
                    // if (finalPos) nodesDataSet.update({id: newNodeId, x: finalPos.x, y: finalPos.y, fixed: {x: true, y: true}});
                }, 1500);
            } else if (!wasPhysicsFrozen && mindMapType !== 'historical') {
                 setTimeout(() => { // Small delay to let physics run a bit for non-frozen maps
                    // Optionally fix the new node after initial physics run
                    // const finalPos = networkInstanceRef.current?.getPositions([newNodeId])[newNodeId];
                    // if (finalPos) nodesDataSet.update({id: newNodeId, x: finalPos.x, y: finalPos.y, fixed: {x: true, y: true}});
                 }, 1500);
            }
          }
          return { newNodeId };
        } catch (err) {
          console.error('Error adding connection node and edges:', err);
          setError(err instanceof Error ? err.message : 'Unknown error during connection node addition.');
          setNetworkLoadingState('error');
          if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
          return null;
        }
      };
    
      const getDetailsForNodeIds = async (nodeIds: string[]): Promise<Array<{id: string, label: string, title?:string, x?: number, y?: number}>> => {
        if (!nodesDataSet) return [];
        const nodes = nodesDataSet.get(nodeIds, { returnType: 'Array' }) as MindMapNode[];
        const positions = networkInstanceRef.current?.getPositions(nodeIds);
      
        return nodes.map(node => ({
            id: node.id,
            label: node.label,
            title: node.title,
            x: positions?.[node.id]?.x,
            y: positions?.[node.id]?.y,
        }));
      };

    return {
      getAllNodeLabels: (): string[] => {
          if (nodesDataSet) {
              return nodesDataSet.get({ fields: ['label'], returnType: 'Array' })
                                 .map((node: any) => String(node.label || '').trim());
          }
          return [];
      },
      captureAndDownloadImage: async () => {
        if (networkInstanceRef.current && networkRef.current) {
          const { isFrozen: wasPhysicsFrozen } = getPhysicsState(); if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);
          networkInstanceRef.current.fit({ animation: false });
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          let canvasToUse: HTMLCanvasElement | null = null;
          const apiCanvas = networkInstanceRef.current?.canvas?.frame;
          if (apiCanvas instanceof HTMLCanvasElement) canvasToUse = apiCanvas;
          else {
            if (networkRef.current) {
              const childCanvases = networkRef.current.getElementsByTagName('canvas');
              if (childCanvases.length > 0) canvasToUse = childCanvases[0];
            }
          }
          if (canvasToUse) {
            try {
              const dataURL = canvasToUse.toDataURL('image/png');
              let filename = 'mindmap';
              if (sourceIdentifier) {
                  if (sourceType === 'url') {
                      try {
                          const urlObj = new URL(sourceIdentifier);
                          const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
                          if (videoId) filename = `mindmap-${videoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
                      } catch (e) { /* ignore if not a valid URL */ }
                  } else if (sourceType === 'transcript') {
                      filename = `mindmap-${sourceIdentifier.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, '')}`;
                  }
              }
              filename += `-${new Date().toISOString().slice(0,10)}.png`;
              const a = document.createElement('a');
              a.href = dataURL; a.download = filename;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
            } catch (e) {
              console.error("Error generating or downloading image:", e);
              alert("Error: Could not save mind map image.");
            }
          } else alert("Error: Could not get mind map canvas to save image.");
          if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 50);
        } else alert("No mind map data to save.");
      },
      elaborateOnSelectedNode: async () => {
        const currentSelectedNodeId = selectedNodeId;
        if (!currentSelectedNodeId || !nodesDataSet || !edgesDataSet) { setError("No node selected or mind map data not available."); return; }
        const selectedNode = nodesDataSet.get(currentSelectedNodeId);
        if (!selectedNode) { setError("Selected node data not found."); return; }
        setCurrentLoadingType('elaboration'); setNetworkLoadingState('loading'); setError(null);
        const { isFrozen: wasPhysicsFrozen } = getPhysicsState(); if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);
        try {
          const allLabels = nodesDataSet.get({ fields: ['label'] }).map(n => n.label).filter(Boolean);
          const currentMapThemes = [...new Set(allLabels)].slice(0, 10).join(', ');
          const prompt = getElaborateNodePrompt(selectedNode.label, currentMapThemes);
          const result = await generateText({ prompt, responseMimeType: "application/json" });
          const newDetails: ElaborationDetail[] = parseJSON(result.text);
          if (!Array.isArray(newDetails)) throw new Error("Invalid elaboration data from API.");
          const newNodes: MindMapNode[] = []; const newEdges: MindMapEdge[] = [];
          newDetails.forEach((detail, i) => {
            const newNodeId = generateNewNodeId('elab_');
            newNodes.push({ id: newNodeId, label: detail.label, title: detail.title || detail.label, group: 'elaboration', value: isObsidianStyle ? 2 : undefined });
            newEdges.push({ 
                from: currentSelectedNodeId, 
                to: newNodeId, 
                label: detail.relationshipLabel || '', 
                arrows: arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }} : '', 
                id: `edge_elab_${currentSelectedNodeId}_to_${newNodeId}_${uuidv4().slice(0,4)}`
            });
          });
          nodesDataSet.add(newNodes); edgesDataSet.add(newEdges);
          setNetworkLoadingState('ready');
          if (networkInstanceRef.current) { networkInstanceRef.current.focus(currentSelectedNodeId, { animation: true }); if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 700); }
        } catch (err) { console.error('Error elaborating node:', err); setError(err instanceof Error ? err.message : 'Unknown error during elaboration.'); setNetworkLoadingState('error'); if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false); }
      },
      explainSelectedNode: async (explanationType: SpecificExplanationType | 'default') => {
        const currentSelectedNodeId = selectedNodeId;
        if (!currentSelectedNodeId || !nodesDataSet || !edgesDataSet) { setError("No node selected for explanation."); return; }
        const selectedNode = nodesDataSet.get(currentSelectedNodeId);
        if (!selectedNode) { setError("Selected node data not found."); return; }

        const loadingTypeKey = `explanation_${explanationType}` as `explanation_${SpecificExplanationType | 'default'}`;
        setCurrentLoadingType(loadingTypeKey);
        setNetworkLoadingState('loading');
        setError(null);

        const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
        if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);

        try {
          const allLabels = nodesDataSet.get({ fields: ['label'] }).map(n => n.label).filter(Boolean);
          const currentMapThemes = [...new Set(allLabels)].slice(0, 10).join(', ');

          let prompt = "";
          if (explanationType === 'default') {
            prompt = getExplainNodePrompt(selectedNode.label, currentMapThemes);
          } else {
            prompt = getExplainNodePromptSpecific(selectedNode.label, currentMapThemes, explanationType);
          }

          const result = await generateText({ prompt, responseMimeType: "application/json" });
          const detail: ExplanationDetail = parseJSON(result.text);
          if (!detail || typeof detail.label !== 'string') throw new Error("Invalid explanation data from API.");

          const newNodeId = generateNewNodeId(`expl_${explanationType}_`);
          nodesDataSet.add({
            id: newNodeId,
            label: detail.label,
            title: detail.title || detail.label,
            group: `explanation_${explanationType}` as MindMapNode['group'], 
            value: isObsidianStyle ? 2 : undefined
          });
          edgesDataSet.add({
            from: currentSelectedNodeId,
            to: newNodeId,
            label: detail.relationshipLabel,
            arrows: arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }} : '',
            id: `edge_expl_${explanationType}_${currentSelectedNodeId}_${newNodeId}`
          });

          setNetworkLoadingState('ready');
          if (networkInstanceRef.current) {
            networkInstanceRef.current.focus(newNodeId, { animation: true });
            if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 700);
          }
        } catch (err) {
          console.error(`Error explaining node (type: ${explanationType}):`, err);
          setError(err instanceof Error ? err.message : `Unknown error during ${explanationType} explanation.`);
          setNetworkLoadingState('error');
          if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
        }
      },
      addNodeFromChat: async (entityText: string, chatMessageContext: string): Promise<AddNodeFromChatResult> => {
        if (!nodesDataSet || !edgesDataSet) {
            console.warn("Cannot add node from chat: dataSet not initialized.");
            return { mainNodeAdded: false };
        }
        setCurrentLoadingType('chat_add_node'); setNetworkLoadingState('loading'); setError(null);
        const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
        if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);

        try {
            const currentMapDataForPrompt = getMapContextForChat();
            const prompt = getFindParentAndDefineEntityPrompt(entityText, chatMessageContext, currentMapDataForPrompt);
            const llmResult = await generateText({ prompt, responseMimeType: "application/json" });
            const { bestParentNodeLabel, entityDefinition } = parseJSON(llmResult.text) as { bestParentNodeLabel: string | null, entityDefinition: string };

            if (!entityDefinition) {
                throw new Error("AI failed to provide a definition for the entity.");
            }

            const newNodeId = generateNewNodeId('chat_');
            nodesDataSet.add({
                id: newNodeId,
                label: entityText,
                title: entityDefinition,
                group: 'chat_added',
                value: isObsidianStyle ? 4 : undefined,
                shape: isObsidianStyle ? 'dot' : 'box'
            });

            let parentNodeId: string | null = null;
            let finalParentNodeLabel: string | null = null;

            if (bestParentNodeLabel) {
                const existingNodes = nodesDataSet.get({ returnType: 'Array' }) as MindMapNode[];
                const parentNode = existingNodes.find(n => n.label.toLowerCase() === bestParentNodeLabel.toLowerCase());
                if (parentNode) {
                    parentNodeId = parentNode.id;
                    finalParentNodeLabel = parentNode.label;
                    edgesDataSet.add({
                        from: parentNode.id,
                        to: newNodeId,
                        label: "related (from chat)",
                        arrows: arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }} : '',
                        id: `edge_chat_${parentNode.id}_${newNodeId}`
                    });
                } else {
                    console.warn(`AI suggested parent "${bestParentNodeLabel}", but it was not found on the map.`);
                }
            }

            setNetworkLoadingState('ready');
            if (networkInstanceRef.current) {
                networkInstanceRef.current.focus(newNodeId, { animation: true, scale: networkInstanceRef.current.getScale() * 1.05 });
                if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 700);
            }
            return { mainNodeAdded: true, newNodeId, newNodeLabel: entityText, parentNodeId, parentNodeLabel: finalParentNodeLabel };

        } catch (err) {
            console.error('Error adding node from chat:', err);
            setError(err instanceof Error ? err.message : 'Unknown error during chat node addition.');
            setNetworkLoadingState('error');
            if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
            return { mainNodeAdded: false, newNodeLabel: entityText };
        }
    },
      expandMap: async (numSubNodesToGenerate: number, allowInternet: boolean): Promise<{ totalNodesAdded: number }> => {
          if (!nodesDataSet || !edgesDataSet) throw new Error("Mind map data not available for expansion.");

          setCurrentLoadingType('expansion');
          setNetworkLoadingState('loading');
          setError(null);

          const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
          if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);

          let totalNodesAdded = 0;
          try {
              const allNodes = nodesDataSet.get({ returnType: 'Array' }) as MindMapNode[];
              const allEdges = edgesDataSet.get({ returnType: 'Array' }) as MindMapEdge[];

              const topLevelNodeIds = new Set<string>();
              const hasIncomingMainEdge = new Set<string>();

              allNodes.forEach(node => {
                  if (node.group === 'center' || node.group === 'main' || node.group === 'historical_era') topLevelNodeIds.add(node.id);
              });
              allEdges.forEach(edge => {
                  const fromNode = nodesDataSet.get(edge.from);
                  if (fromNode && (fromNode.group === 'center' || fromNode.group === 'main' || fromNode.group === 'historical_era')) {
                      hasIncomingMainEdge.add(edge.to);
                  }
              });
              allNodes.forEach(node => {
                  if (!topLevelNodeIds.has(node.id) && !hasIncomingMainEdge.has(node.id)) {
                      topLevelNodeIds.add(node.id);
                  }
              });
              if (topLevelNodeIds.size === 0 && allNodes.length > 0) {
                  allNodes.forEach(node => topLevelNodeIds.add(node.id));
              }

              const parentNodesToExpand = allNodes.filter(node => topLevelNodeIds.has(node.id));
              if (parentNodesToExpand.length === 0 && allNodes.length > 0) {
                   parentNodesToExpand.push(...allNodes.slice(0, Math.min(3, allNodes.length)));
              }
              if(parentNodesToExpand.length === 0) {
                  throw new Error("No suitable nodes found to expand.");
              }

              const currentMapContext = getMapContextForChat();

              for (const parentNode of parentNodesToExpand) {
                  try {
                      const prompt = getExpandMapNodePrompt(parentNode.label, numSubNodesToGenerate, currentMapContext, allowInternet);
                      const result = await generateText({ prompt, responseMimeType: "application/json", tools: allowInternet ? [{googleSearch: {}}] : undefined });
                      const newSubNodesData: Array<{label: string, title?: string, relationshipLabel?: string}> = parseJSON(result.text);

                      if (Array.isArray(newSubNodesData)) {
                          const newNodesBatch: MindMapNode[] = [];
                          const newEdgesBatch: MindMapEdge[] = [];
                          newSubNodesData.forEach((subNode, i) => {
                              let finalLabel = subNode.label;
                              if (/^Node\d+$/.test(subNode.label) && subNode.title && subNode.title.length > 5 && subNode.title.length < 50) {
                                  finalLabel = subNode.title.split('.')[0].split(',')[0];
                                  if (finalLabel.length < 3 || finalLabel.length > 40) finalLabel = subNode.label;
                              }

                              const newNodeId = generateNewNodeId(`exp_${parentNode.id}_${i}_`);
                              newNodesBatch.push({ id: newNodeId, label: finalLabel, title: subNode.title || finalLabel, group: mindMapType === 'historical' ? 'historical_event' : 'detail', value: isObsidianStyle ? 2 : undefined });
                              newEdgesBatch.push({ from: parentNode.id, to: newNodeId, label: subNode.relationshipLabel || 'related', arrows: arrowsEnabled ? { to: { enabled: true, scaleFactor: 0.7, type: 'arrow' }} : '', id: `edge_exp_${parentNode.id}_${newNodeId}` });
                              totalNodesAdded++;
                          });
                          if (newNodesBatch.length > 0) nodesDataSet.add(newNodesBatch);
                          if (newEdgesBatch.length > 0) edgesDataSet.add(newEdgesBatch);
                      }
                  } catch (individualError) {
                      console.warn(`Error expanding sub-nodes for '${parentNode.label}':`, individualError);
                  }
              }
              setNetworkLoadingState('ready');
              if (networkInstanceRef.current) {
                  networkInstanceRef.current.fit({ animation: true });
                   if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 700);
              }
              return { totalNodesAdded };
          } catch (err) {
              console.error('Error during map expansion process:', err);
              setError(err instanceof Error ? err.message : 'Unknown error during map expansion.');
              setNetworkLoadingState('error');
              if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
              throw err;
          }
      },
      freezeSelectedNode: async () => {
        if (!selectedNodeId || !nodesDataSet) {
          throw new Error("No node selected or dataset not available.");
        }
        const node = nodesDataSet.get(selectedNodeId);
        if (node) {
          const newFixedState = node.fixed && (node.fixed as {x:boolean,y:boolean}).x === true ? false : { x: true, y: true };
          nodesDataSet.update({ ...node, fixed: newFixedState });
        } else {
          throw new Error("Selected node not found.");
        }
      },
      isNodeFrozen: (nodeId: string): boolean => {
        if (!nodesDataSet) return false;
        const node = nodesDataSet.get(nodeId);
        return !!(node && node.fixed && (node.fixed as {x:boolean,y:boolean}).x === true);
      },
      addMissingDescriptions: async (): Promise<{ nodesUpdated: number }> => {
        if (!nodesDataSet) throw new Error("Mind map data not available.");

        setCurrentLoadingType('add_descriptions');
        setNetworkLoadingState('loading');
        setError(null);

        const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
        if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);

        let nodesUpdated = 0;
        try {
            const allNodes = nodesDataSet.get({ returnType: 'Array' }) as MindMapNode[];
            const nodesToUpdate = allNodes.filter(node => !node.title || node.title.trim() === '' || node.title.trim() === node.label.trim());

            if (nodesToUpdate.length === 0) {
                setNetworkLoadingState('ready');
                if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 50);
                return { nodesUpdated: 0 };
            }
            
            const currentMapContext = getMapContextForChat();

            for (const node of nodesToUpdate) {
                try {
                    const prompt = getAddNodeDescriptionPrompt(node.label, currentMapContext);
                    const result = await generateText({ prompt, responseMimeType: "application/json" });
                    const parsedResult = parseJSON(result.text) as { description: string };
                    
                    if (parsedResult && parsedResult.description && parsedResult.description.trim() !== "") {
                        nodesDataSet.update({ id: node.id, title: parsedResult.description.trim() });
                        nodesUpdated++;
                    } else {
                        console.warn(`No valid description received for node: ${node.label}`);
                    }
                } catch (individualError) {
                    console.error(`Error adding description for node '${node.label}':`, individualError);
                }
            }
            setNetworkLoadingState('ready');
            if (networkInstanceRef.current && wasPhysicsFrozen && mindMapType !== 'historical') {
                setTimeout(() => setPhysicsEnabled(false), 700);
            }
            return { nodesUpdated };

        } catch (err) {
            console.error('Error during add missing descriptions process:', err);
            setError(err instanceof Error ? err.message : 'Unknown error while adding descriptions.');
            setNetworkLoadingState('error');
            if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
            throw err; 
        }
      },
      enhanceSelectedNodeDescription: async (): Promise<{ success: boolean; newDescription?: string }> => {
        if (!selectedNodeId || !nodesDataSet) {
            throw new Error("No node selected or dataset not available for enhancing description.");
        }
        const selectedNode = nodesDataSet.get(selectedNodeId);
        if (!selectedNode) {
            throw new Error("Selected node data not found for enhancing description.");
        }

        setCurrentLoadingType('enhancing_description');
        setNetworkLoadingState('loading');
        setError(null);

        const { isFrozen: wasPhysicsFrozen } = getPhysicsState();
        if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);

        try {
            const originalDescription = selectedNode.title || selectedNode.label; 
            const prompt = getEnhanceNodeDescriptionPrompt(originalDescription, selectedNode.label);
            const result = await generateText({ prompt, responseMimeType: "text/plain" });
            const supplementaryText = result.text.trim();

            if (supplementaryText && supplementaryText.length > 0) {
                const newDescription = `${originalDescription}\n\n${supplementaryText}`;
                nodesDataSet.update({ id: selectedNodeId, title: newDescription });
                setNetworkLoadingState('ready');
                if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 700);
                return { success: true, newDescription };
            } else {
                setNetworkLoadingState('ready');
                if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 50);
                return { success: false }; 
            }
        } catch (err) {
            console.error('Error enhancing node description:', err);
            setError(err instanceof Error ? err.message : 'Unknown error during description enhancement.');
            setNetworkLoadingState('error');
            if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(false);
            throw err; 
        }
      },
      giveExamplesForSelectedNode: () => handleGenericElaborationAction('give_examples', getGiveExamplesPrompt, 'example_node'),
      elaborateProsForSelectedNode: () => handleGenericElaborationAction('elaborate_pros', getElaborateProsPrompt, 'pros_node'),
      elaborateConsForSelectedNode: () => handleGenericElaborationAction('elaborate_cons', getElaborateConsPrompt, 'cons_node'),
      togglePhysics: (freeze: boolean) => { setPhysicsEnabled(!freeze); },
      centerNetworkView: () => {
        if (networkInstanceRef.current) {
          const { isFrozen: wasPhysicsFrozen } = getPhysicsState(); if (wasPhysicsFrozen && mindMapType !== 'historical') setPhysicsEnabled(true);
          networkInstanceRef.current.fit({ animation: { duration: 700, easingFunction: 'easeInOutQuad' } });
          if (wasPhysicsFrozen && mindMapType !== 'historical') setTimeout(() => setPhysicsEnabled(false), 750);
        }
      },
      getMapDataForObsidianExport: (): ObsidianNodeData[] | null => {
        if (!nodesDataSet || !edgesDataSet) return null;
        const allNodes = nodesDataSet.get({ returnType: 'Array' }) as MindMapNode[];
        const allEdges = edgesDataSet.get({ returnType: 'Array' }) as MindMapEdge[];
        return allNodes.map(node => ({
          id: node.id, originalTitle: node.label,
          description: (node.title && node.title !== node.label) ? node.title : '',
          tags: node.era ? [node.era.replace(/\s+/g, '_')] : [],
          aliases: [],
          outgoingLinks: allEdges.filter(e => e.from === node.id)
                                  .map(e => nodesDataSet.get(e.to))
                                  .filter(Boolean)
                                  .map(targetNode => ({ targetOriginalTitle: targetNode!.label })),
        }));
      },
      getImportantNodesForFlashcards: (): Array<{ label: string; title?: string; }> | null => {
        if (!nodesDataSet) return null;
        const allNodes = nodesDataSet.get({ returnType: 'Array' }) as MindMapNode[];
        const importantNodesData: Array<{ label: string; title?: string }> = [];
        const addedNodeIds = new Set<string>();

        const alwaysImportantGroups = ['center', 'main'];
        const historicalImportantGroups = ['historical_era', 'historical_event'];
        const obsidianValueThreshold = 6; 

        allNodes.forEach(node => {
          if (!node.label || node.label.trim() === "" || addedNodeIds.has(node.id)) {
            return; 
          }
          let isConsideredImportant = false;
          if (node.group && alwaysImportantGroups.includes(node.group)) {
            isConsideredImportant = true;
          } else if (mindMapType === 'historical' && node.group && historicalImportantGroups.includes(node.group)) {
            isConsideredImportant = true;
          } else if (isObsidianStyle && typeof node.value === 'number' && node.value >= obsidianValueThreshold) {
            isConsideredImportant = true;
          }
          
          if (isConsideredImportant) {
            importantNodesData.push({ label: node.label, title: node.title });
            addedNodeIds.add(node.id);
          }
        });
        return importantNodesData;
      },
      getMapContextForChat,
      getSelectedNodeDetails: (): { id: string; label: string; description?: string; } | null => {
          if (selectedNodeId && nodesDataSet) { 
              const node = nodesDataSet.get(selectedNodeId); 
              if (node) return { id: node.id, label: node.label, description: node.title };
          }
          return null;
      },
      mergeNewContent, 
      getDetailsForNodeIds,
      addConnectionNodeAndEdges,
    };
  }, [nodesDataSet, edgesDataSet, selectedNodeId, isObsidianStyle, sourceIdentifier, sourceType, generateNewNodeId, getPhysicsState, setPhysicsEnabled, mindMapType, onLoadingStateChange, onNodeSelected, arrowsEnabled]); 

  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(networkLoadingState === 'loading', currentLoadingType);
    }
  }, [networkLoadingState, currentLoadingType, onLoadingStateChange]);

  useEffect(() => {
    async function initializeOrLoadMindMap() {
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
        networkInstanceRef.current = null;
      }
      setNodesDataSet(null);
      setEdgesDataSet(null);
      setSelectedNodeId(null);
      if (onNodeSelected) onNodeSelected(null);
      setError(null);
      lastAssignedNodeId.current = 0;

      if (!sourceIdentifier || !sourceType) {
        setNetworkLoadingState('idle');
        return;
      }
      
      setCurrentLoadingType('generation'); 

      if (preloadedMapData) {
        try {
          const initialNodes = preloadedMapData.nodes.map((node, i) => {
            const idStr = String(node.id || generateNewNodeId(`node_preloaded_${i}_`));
            if (node.id) lastAssignedNodeId.current = Math.max(lastAssignedNodeId.current, parseInt(String(node.id).replace( /^\D+/g, ''), 10) || 0);
            let value = (isObsidianStyle && typeof node.value === 'number') ? node.value : (isObsidianStyle ? 3 : undefined);
            if (node.group === 'center' && isObsidianStyle) value = Math.max(value || 0, 10);
            return {...node, id: idStr, value, label: node.label || `Node ${idStr}` };
          });
          const initialEdges = preloadedMapData.edges.map((e, i) => ({...e, id: String(e.id || `edge_preloaded_${i}_`), from: String(e.from), to: String(e.to) }));
          
          setNodesDataSet(new DataSet<MindMapNode>(initialNodes));
          setEdgesDataSet(new DataSet<MindMapEdge>(initialEdges));
          setNetworkLoadingState('ready');
          if (onLoadingStateChange) onLoadingStateChange(false, 'generation');
        } catch (err) {
          console.error('Error processing preloaded mind map data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load preloaded map data.');
          setNetworkLoadingState('error');
          if (onLoadingStateChange) onLoadingStateChange(false, 'generation');
        }
        return; 
      }
      
      setNetworkLoadingState('loading');
      try {
        let basePrompt = "";
        if (mindMapType === 'historical') {
          basePrompt = getHistoricalMapPrompt(mindMapComplexity, isObsidianStyle);
        } else {
          basePrompt = getMindMapFromContentPrompt(mindMapComplexity, mindMapType, isObsidianStyle);
        }

        let result;
        if (sourceType === 'url') {
            result = await generateText({ prompt: basePrompt, videoUrl: sourceIdentifier, responseMimeType: "application/json" });
        } else if (sourceType === 'transcript' && sourceTextContent) {
            const combinedPrompt = `${basePrompt}\n\nAnalyze the following text content:\n---\n${sourceTextContent}\n---`;
            result = await generateText({ prompt: combinedPrompt, responseMimeType: "application/json" });
        } else {
            throw new Error("Invalid source type or missing content for mind map generation.");
        }
        
        const parsedData = parseJSON(result.text) as MindMapData;
        if (!parsedData || !Array.isArray(parsedData.nodes) || !Array.isArray(parsedData.edges)) throw new Error("Invalid mind map data structure.");

        parsedData.nodes.forEach(node => {
            if (/^Node\d+$/.test(node.label || '') && node.title && node.title.length > 5 && node.title.length < 50) {
                const newLabel = node.title.split('.')[0].split(',')[0].trim();
                if (newLabel.length > 3 && newLabel.length < 40) node.label = newLabel;
            }
        });

        let initialNodes = parsedData.nodes.map((node, i) => {
            const idStr = String(node.id || generateNewNodeId(`node_init_${i}_`));
            if (node.id) lastAssignedNodeId.current = Math.max(lastAssignedNodeId.current, parseInt(String(node.id).replace( /^\D+/g, ''), 10) || 0);
            let value = (isObsidianStyle && typeof node.value === 'number') ? node.value : (isObsidianStyle ? 3 : undefined);
            if (node.group === 'center' && isObsidianStyle) value = Math.max(value || 0, 10);
            const processedNode: MindMapNode = {...node, id: idStr, value, label: node.label || `Node ${idStr}` };
            if (mindMapType === 'historical') {
              processedNode.group = node.group || 'historical_event';
              if (node.date) {
                const dateParts = String(node.date).split('-');
                if (dateParts.length === 1 && /^\d{4}$/.test(dateParts[0])) { 
                  processedNode.parsedDate = new Date(parseInt(dateParts[0]), 0, 1); 
                } else if (dateParts.length === 2 && /^\d{4}$/.test(dateParts[0]) && /^\d{1,2}$/.test(dateParts[1])) { 
                  processedNode.parsedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, 1); 
                } else if (dateParts.length === 3 && /^\d{4}$/.test(dateParts[0]) && /^\d{1,2}$/.test(dateParts[1]) && /^\d{1,2}$/.test(dateParts[2])) { 
                  processedNode.parsedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                } else {
                  console.warn(`Invalid date format for node ${node.label}: ${node.date}. Node will not be placed chronologically.`);
                }
              }
            }
            return processedNode;
        });

        if (mindMapType === 'historical') {
          const nodesWithDates = initialNodes.filter(n => n.parsedDate);
          const nodesWithoutDates = initialNodes.filter(n => !n.parsedDate);

          nodesWithDates.sort((a, b) => (a.parsedDate as Date).getTime() - (b.parsedDate as Date).getTime());
          initialNodes = [...nodesWithDates, ...nodesWithoutDates];

          if (nodesWithDates.length > 0) {
            const minDate = nodesWithDates[0].parsedDate as Date;
            const maxDate = nodesWithDates[nodesWithDates.length - 1].parsedDate as Date;
            const timeRange = maxDate.getTime() - minDate.getTime();

            const canvasWidth = networkRef.current?.clientWidth || 1000;
            const padding = 100; 
            const timelineWidth = canvasWidth - 2 * padding;

            nodesWithDates.forEach((node, index) => {
              let xPos;
              if (timeRange > 0) {
                const nodeTimeOffset = (node.parsedDate as Date).getTime() - minDate.getTime();
                xPos = padding + (nodeTimeOffset / timeRange) * timelineWidth;
              } else { 
                xPos = canvasWidth / 2;
              }
              node.x = xPos;
              node.y = (index % 7 - 3) * 80; 
              node.fixed = { x: true, y: true };
            });
            nodesWithoutDates.forEach((node, index) => {
                node.x = padding + (index * 100) % timelineWidth;
                node.y = (Math.floor(nodesWithDates.length / 7) + 2) * 80 + (index % 3 -1) * 60 ; 
                node.fixed = {x: true, y: true};
            });
          }
        }

        const initialEdges = parsedData.edges.map((e, i) => ({...e, id: String(e.id || `edge_init_${i}_`), from: String(e.from), to: String(e.to) }));
        setNodesDataSet(new DataSet<MindMapNode>(initialNodes)); setEdgesDataSet(new DataSet<MindMapEdge>(initialEdges));
        setNetworkLoadingState('ready');
      } catch (err) { console.error('Error generating mind map:', err); setError(err instanceof Error ? err.message : 'Unknown error.'); setNetworkLoadingState('error'); }
    }
    initializeOrLoadMindMap();
    return () => { if (networkInstanceRef.current) { networkInstanceRef.current.destroy(); networkInstanceRef.current = null; }};
  }, [sourceIdentifier, sourceType, sourceTextContent, mindMapComplexity, mindMapType, isObsidianStyle, preloadedMapData, generateNewNodeId, onNodeSelected, onLoadingStateChange, arrowsEnabled]);

  useEffect(() => {
    if (networkInstanceRef.current && networkLoadingState === 'ready' && nodesDataSet) {
        const updates: any[] = [];
        nodesDataSet.forEach(node => {
            const isSelected = selectedNodesForConnection.includes(node.id);
            let updateRequired = false;
            let newBorderColor = node.originalBorderColor; // Assume originalBorderColor is stored if needed, or derive from group
            let newBorderWidth = node.originalBorderWidth || 1;

            // Determine original border color (simplified, you might need more robust logic based on group)
            const groupStyles = (networkInstanceRef.current?.options?.groups as any)?.[node.group || 'default'];
            const defaultNodeColor = networkInstanceRef.current?.options?.nodes?.color;
            const baseBorder = groupStyles?.color?.border || (groupStyles?.shape === 'text' && !isObsidianStyle ? 'rgba(0,0,0,0)' : (defaultNodeColor as any)?.border || '#6C709A');


            if (isSelected) {
                if (node.color?.border !== CONNECTION_NODE_HIGHLIGHT_COLOR || node.borderWidth !== 3) {
                    if (!node.originalBorderColor) updates.push({id: node.id, originalBorderColor: baseBorder, originalBorderWidth: node.borderWidth || 1});
                    updates.push({ id: node.id, color: { ...node.color, border: CONNECTION_NODE_HIGHLIGHT_COLOR }, borderWidth: 3 });
                    updateRequired = true;
                }
            } else {
                // Check if it was previously selected and needs reverting
                if (node.color?.border === CONNECTION_NODE_HIGHLIGHT_COLOR || node.borderWidth === 3) {
                     updates.push({ id: node.id, color: { ...node.color, border: node.originalBorderColor || baseBorder }, borderWidth: node.originalBorderWidth || 1 });
                     updateRequired = true;
                }
            }
        });
        if (updates.length > 0) {
            nodesDataSet.update(updates);
        }
    }
  }, [selectedNodesForConnection, nodesDataSet, networkLoadingState, isObsidianStyle]);


  useEffect(() => {
    if (networkInstanceRef.current && networkLoadingState === 'ready') {
      const optionsUpdate: Options = { 
        edges: { 
            width: BASE_EDGE_WIDTH * linkThicknessMultiplier,
            arrows: { to: { enabled: arrowsEnabled, scaleFactor: 0.7, type: 'arrow' }}
        },
        physics: {
            barnesHut: {
                gravitationalConstant: -repelForce, 
                centralGravity: centerForce,
                springLength: linkDistance,
                springConstant: linkForce,
            }
        }
      };
      if (isObsidianStyle) {
        optionsUpdate.nodes = {
            size: BASE_OBSIDIAN_NODE_SIZE, 
            scaling: {
                min: BASE_OBSIDIAN_NODE_SCALING_MIN * nodeSizeMultiplier,
                max: BASE_OBSIDIAN_NODE_SCALING_MAX * nodeSizeMultiplier, 
                label: { drawThreshold: textFadeThreshold }
            }
        };
      } else { 
        optionsUpdate.nodes = {
            size: Math.min(BASE_NON_OBSIDIAN_NODE_SIZE * nodeSizeMultiplier, MAX_NON_OBSIDIAN_NODE_SIZE), 
            scaling: { label: { drawThreshold: 5 } } 
        };
      }
      networkInstanceRef.current.setOptions(optionsUpdate);
    }
  }, [textFadeThreshold, nodeSizeMultiplier, linkThicknessMultiplier, isObsidianStyle, networkLoadingState, arrowsEnabled, centerForce, repelForce, linkForce, linkDistance]);

  useEffect(() => {
    if (networkLoadingState === 'ready' && nodesDataSet && edgesDataSet && networkRef.current) {
      if (networkInstanceRef.current) networkInstanceRef.current.destroy();
      const defaultFont = { color: isObsidianStyle ? '#DCDCDC' : '#e0e0e0', size: isObsidianStyle ? 12 : 13, face: 'Google Sans Flex, sans-serif', multi: 'html' as const };
      const defaultNodeColor = { border: isObsidianStyle ? '#6C709A' : '#5C608A', background: isObsidianStyle ? '#4A4D6A' : '#3A3D5A', highlight: { border: '#88c0d0', background: isObsidianStyle ? '#5f6283' : '#4f527a' }, hover: { border: '#77adda', background: isObsidianStyle ? '#555879' : '#45486a' }};

      const isHistoricalMap = mindMapType === 'historical';

      const options: Options = {
        autoResize: true,
        nodes: {
            shape: isObsidianStyle ? 'dot' : (isHistoricalMap ? 'box' : 'box'),
            scaling: isObsidianStyle ? {
                min: BASE_OBSIDIAN_NODE_SCALING_MIN * nodeSizeMultiplier,
                max: BASE_OBSIDIAN_NODE_SCALING_MAX * nodeSizeMultiplier,
                label: { enabled: true, min: 10, max: 20, drawThreshold: textFadeThreshold, maxVisible: 25 }
            } : {
                label: { enabled: true, min: 12, max: 24, drawThreshold: 5, maxVisible: 20 }
            },
            size: isObsidianStyle ? BASE_OBSIDIAN_NODE_SIZE : Math.min(BASE_NON_OBSIDIAN_NODE_SIZE * nodeSizeMultiplier, MAX_NON_OBSIDIAN_NODE_SIZE),
            margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 },
            font: defaultFont,
            color: defaultNodeColor,
            borderWidth: 1,
            borderWidthSelected: 2, // Default selection (single node)
            shadow: false
        },
        edges: {
            color: { color: isObsidianStyle ? '#777' : '#666', highlight: '#999', hover: '#888', inherit: false },
            font: { color: '#b0b0b0', size: 10, align: 'middle', strokeWidth: 0, background: 'rgba(30,30,30,0.6)' },
            arrows: { to: { enabled: arrowsEnabled, scaleFactor: 0.7, type: 'arrow' }},
            smooth: { enabled: !isObsidianStyle && !isHistoricalMap, type: "cubicBezier", forceDirection: "vertical", roundness: 0.4 },
            width: BASE_EDGE_WIDTH * linkThicknessMultiplier,
            hoverWidth: 0.5 * linkThicknessMultiplier
        },
        physics: {
            enabled: !isPhysicsCurrentlyFrozen && !isHistoricalMap, 
            barnesHut: { 
                gravitationalConstant: -repelForce, 
                centralGravity: centerForce, 
                springLength: linkDistance, 
                springConstant: linkForce, 
                damping: 0.15, 
                avoidOverlap: 0.7 
            },
            maxVelocity: 60,
            minVelocity: 0.5,
            solver: 'barnesHut',
            stabilization: { enabled: true, iterations: 1000, updateInterval: 25, fit: true }
        },
        interaction: { hover: true, dragNodes: !isHistoricalMap, dragView: true, zoomView: true, tooltipDelay: 150, multiselect: isConnectionModeActive, selectable: true }, // Enable multiselect if in connection mode
        layout: { hierarchical: false },
        groups: {
            center: {
                shape: 'ellipse',
                color: { background: '#FFBF00', border: '#A0D2DB' }, 
                borderWidth: 3, 
                font: { ...defaultFont, size: isObsidianStyle? 20 : 18, color: '#FFFFFF', face: 'Titan One, sans-serif' },
                margin: { top: 15, right: 20, bottom: 15, left: 20 }
            },
            main: {
                shape: isObsidianStyle ? 'dot' : 'box',
                color: { background: '#2A6460', border: '#4A8480' },
                font: { ...defaultFont, size: 14, color: '#e8e8e8' },
                margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }
            },
            detail: {
                shape: isObsidianStyle ? 'dot' : 'text',
                font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: isObsidianStyle ? '#DCDCDC' : '#c0c0c0' },
                color: isObsidianStyle ? { background: '#4A4D6A', border: '#6C709A'} : { background: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)'},
                margin: isObsidianStyle ? { top: 8, right: 8, bottom: 8, left: 8 } : undefined
            },
            research: { shape: 'star', color: { background: '#28a745', border: '#1e7e34' }, font: { ...defaultFont, size: 13, color: '#ffffff' }, margin: { top: 10, right: 15, bottom: 10, left: 15 } },
            elaboration: { shape: 'dot', size: 15, color: { background: '#b48ead', border: '#886a7b' }, font: { ...defaultFont, size: 12, color: '#f0f0f0' }},
            example_node: { shape: 'dot', size: 14, color: { background: '#FFD700', border: '#B8860B' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            pros_node: { shape: 'dot', size: 14, color: { background: '#90EE90', border: '#3CB371' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            cons_node: { shape: 'dot', size: 14, color: { background: '#F08080', border: '#CD5C5C' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            explanation_default: { shape: 'dot', size: 14, color: { background: '#76c7c0', border: '#5a9a94' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            explanation_what: { shape: 'dot', size: 14, color: { background: '#6BAED6', border: '#4A7894' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            explanation_who: { shape: 'dot', size: 14, color: { background: '#FD8D3C', border: '#D06B24' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            explanation_when: { shape: 'dot', size: 14, color: { background: '#74C476', border: '#528A53' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            explanation_why: { shape: 'dot', size: 14, color: { background: '#9E9AC8', border: '#73708F' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            explanation_how: { shape: 'dot', size: 14, color: { background: '#8B5A2B', border: '#B88A5B' }, font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' }, margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : { top: 8, right: 12, bottom: 8, left: 12 }},
            chat_added: { 
                shape: isObsidianStyle ? 'dot' : 'box',
                color: { background: '#5e81ac', border: '#81a1c1' }, 
                font: { ...defaultFont, size: isObsidianStyle ? 12 : 13, color: '#eceff4' },
                value: isObsidianStyle ? 4 : undefined, 
                margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : {top: 8, right: 12, bottom: 8, left: 12}
            },
            obsidian_default: { shape: 'dot', color: { background: '#4A4D6A', border: '#6C709A' }, font: { ...defaultFont, color: '#DCDCDC', size: 12 }},
            historical_event: {
                shape: isObsidianStyle ? 'dot' : 'box',
                color: { background: '#D2B48C', border: '#A0522D' }, 
                font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: isObsidianStyle ? '#1E1E1E' : '#3A2F0B' },
                margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : {top: 8, right: 12, bottom: 8, left: 12}
            },
            historical_era: { 
                shape: isObsidianStyle ? 'dot' : 'ellipse',
                color: { background: '#C19A6B', border: '#8B4513' },
                font: { ...defaultFont, size: isObsidianStyle ? 13 : 14, color: isObsidianStyle ? '#FFFFFF' : '#4B3621', face: 'Google Sans Flex, sans-serif' },
                margin: isObsidianStyle ? {top:12, right:12, bottom:12, left:12} : {top: 10, right: 15, bottom: 10, left: 15}
            },
            group_merged_default: { 
                shape: isObsidianStyle ? 'dot' : 'box',
                color: { background: '#6a5acd', border: '#483d8b' }, 
                font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' },
                value: isObsidianStyle ? 2 : undefined,
                margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : {top: 8, right: 12, bottom: 8, left: 12}
            },
            group_merged_alternate: { 
                shape: isObsidianStyle ? 'dot' : 'box',
                color: { background: '#3cb371', border: '#2e8b57' }, 
                font: { ...defaultFont, size: isObsidianStyle ? 11 : 12, color: '#f0f0f0' },
                value: isObsidianStyle ? 2 : undefined,
                margin: isObsidianStyle ? {top:10, right:10, bottom:10, left:10} : {top: 8, right: 12, bottom: 8, left: 12}
            },
            connector_node: {
              shape: isObsidianStyle ? 'diamond' : 'hexagon',
              color: { background: '#FFB300', border: '#E65100' }, // Amber/Orange
              font: { ...defaultFont, size: isObsidianStyle ? 12 : 13, color: '#1E1E1E' },
              value: isObsidianStyle ? 6 : undefined,
              borderWidth: 2,
              margin: {top:12, right:12, bottom:12, left:12}
            }
        }
      };
      networkInstanceRef.current = new Network(networkRef.current, { nodes: nodesDataSet, edges: edgesDataSet }, options) as NetworkInstance;
      
      networkInstanceRef.current.on("click", (params) => {
        const clickedNodeId = params.nodes.length > 0 ? params.nodes[0] as string : null;
        if (isConnectionModeActive) {
          if (clickedNodeId) {
            onToggleNodeForConnection(clickedNodeId);
          }
        } else {
          // Standard single node selection behavior
          if (clickedNodeId) {
            setSelectedNodeId(clickedNodeId);
            if (onNodeSelected) onNodeSelected(clickedNodeId);
          } else {
            // Clicked on empty space, deselect if a node was selected
            if (selectedNodeId || params.nodes.length === 0 && params.edges.length === 0) {
               setSelectedNodeId(null);
               if (onNodeSelected) onNodeSelected(null);
            }
          }
        }
      });

      // Deselect node if clicking on empty space NOT in connection mode
      networkInstanceRef.current.on("deselectNode", () => {
        if (!isConnectionModeActive) {
          setSelectedNodeId(null);
          if (onNodeSelected) onNodeSelected(null);
        }
      });
      
      networkInstanceRef.current.once("stabilizationIterationsDone", () => {
        if (networkInstanceRef.current) {
          networkInstanceRef.current.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });

          if (nodesDataSet && mindMapType !== 'historical') {
            const allNodes = nodesDataSet.get({ returnType: 'Array' }) as MindMapNode[];
            let rootNode: MindMapNode | undefined = allNodes.find(node => node.group === 'center');

            if (!rootNode && isObsidianStyle && allNodes.length > 0) {
                rootNode = allNodes.reduce((prev, current) => (prev.value || 0) >= (current.value || 0) ? prev : current, allNodes[0]);
            } else if (!rootNode && allNodes.length > 0) {
                rootNode = allNodes[0];
            }

            if (rootNode) {
                const isAlreadyFixed = rootNode.fixed && (rootNode.fixed as {x:boolean,y:boolean}).x === true;
                if (!isAlreadyFixed) {
                    nodesDataSet.update({ id: rootNode.id, fixed: { x: true, y: true } });
                }
            }
          }
        }
      });

    }
  }, [ networkLoadingState, nodesDataSet, edgesDataSet, isObsidianStyle, getPhysicsState, setPhysicsEnabled, isPhysicsCurrentlyFrozen, onNodeSelected, textFadeThreshold, nodeSizeMultiplier, linkThicknessMultiplier, mindMapType, arrowsEnabled, centerForce, repelForce, linkForce, linkDistance, isConnectionModeActive, onToggleNodeForConnection ]); // Added isConnectionModeActive and onToggleNodeForConnection to dependencies

  const renderLoadingSpinner = () => (<div className="status-container"><div className="loading-spinner"></div><p className="status-text">{currentLoadingType === 'generation' ? 'Generating...' : currentLoadingType === 'elaboration' ? 'Elaborating...' : currentLoadingType.startsWith('explanation_') ? `Explaining (${currentLoadingType.split('_')[1]})...` : currentLoadingType === 'expansion' ? 'Expanding...' : currentLoadingType === 'give_examples' ? 'Generating Examples...' : currentLoadingType === 'elaborate_pros' ? 'Finding Pros...' : currentLoadingType === 'elaborate_cons' ? 'Finding Cons...' : currentLoadingType === 'add_descriptions' ? 'Adding Descriptions...' : currentLoadingType === 'enhancing_description' ? 'Enhancing...' : currentLoadingType === 'merging_content' ? 'Merging Content...' : currentLoadingType === 'making_connection' ? 'Making Connection...' : 'Adding Node...'}</p></div>);
  const renderErrorState = () => (<div className="status-container error-container"><div className="error-icon" aria-hidden="true">⚠️</div><h3 className="error-title">Error {currentLoadingType.startsWith('explanation_') ? `Explaining (${currentLoadingType.split('_')[1]})` : currentLoadingType}</h3><p className="error-message">{error || 'Unknown error.'}</p><p className="error-suggestion">Try again or adjust settings.</p></div>);

  return (
    <div
      className="content-container-wrapper"
      style={{
        backgroundColor: mindMapType === 'historical' ? 'var(--color-parchment-bg, #f5efDC)' : 'var(--obsidian-editor-bg)'
      }}
    >
      {networkLoadingState === 'loading' && (currentLoadingType === 'generation' || currentLoadingType === 'chat_add_node' || currentLoadingType === 'add_descriptions' || currentLoadingType === 'merging_content' || currentLoadingType === 'making_connection') && renderLoadingSpinner()}
      {networkLoadingState === 'error' && renderErrorState()}
      <div ref={networkRef} className="mindmap-network-container" style={{ display: (networkLoadingState === 'ready' || (nodesDataSet && networkLoadingState === 'loading' && currentLoadingType !== 'generation' && currentLoadingType !== 'chat_add_node' && currentLoadingType !== 'add_descriptions' && currentLoadingType !== 'enhancing_description' && currentLoadingType !== 'merging_content' && currentLoadingType !== 'making_connection')) ? 'block' : 'none' }} />
      {networkLoadingState === 'idle' && !sourceIdentifier && (<div className="status-container"><p className="status-text">Paste YouTube URL or Upload Transcript to start.</p></div>)}
      {networkLoadingState === 'idle' && sourceIdentifier && (<div className="status-container"><p className="status-text">Map will appear here.</p></div>)}
      {networkLoadingState === 'loading' && (currentLoadingType === 'elaboration' || currentLoadingType.startsWith('explanation_') || currentLoadingType === 'expansion' || currentLoadingType === 'give_examples' || currentLoadingType === 'elaborate_pros' || currentLoadingType === 'elaborate_cons' || currentLoadingType === 'enhancing_description') && (<div className="elaboration-spinner-overlay">{renderLoadingSpinner()}</div>)}
      <style>{`
        .content-container-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 8px; overflow: hidden; position: relative; }
        .elaboration-spinner-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(30,30,30,0.75); z-index: 10; display: flex; align-items: center; justify-content: center; }
        .mindmap-network-container { width: 100%; height: 100%; outline: none; contain: layout size style; /* Added to mitigate ResizeObserver warnings */ } 
        .vis-network:focus { outline: none !important; }
        .vis-tooltip { font-family: 'Google Sans Flex', sans-serif; font-size: 11px; color: #DCDCDC; background-color: #252528; border: 1px solid #3a3a3f; border-radius: 4px; padding: 5px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: pre-wrap; max-width: 300px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-all; }
        .status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; color: var(--color-text); height: 100%; }
        .loading-spinner { animation: spin 1s ease-in-out infinite; border: 4px solid rgba(220,220,220,0.2); border-radius: 50%; border-top-color: var(--color-accent); height: 50px; width: 50px; margin-bottom: 1.5rem; }
        @keyframes spin { to { transform: rotate(360deg); } } .status-text { font-size: 1rem; color: var(--color-subtitle); }
        .error-container { color: var(--color-error); border: 1px solid var(--color-error); background-color: rgba(229,115,115,0.1); border-radius: 6px; width: calc(100% - 4rem); max-width: 600px; box-sizing: border-box; }
        .error-icon { font-size: 2.5rem; margin-bottom: 0.5rem; } .error-title { font-size: 1.25rem; font-weight: bold; color: var(--color-error); margin-bottom: 0.75rem; }
        .error-message { font-size: 1rem; margin-bottom: 0.5rem; } .error-suggestion { font-size: 0.9rem; color: var(--color-subtitle); }
      `}</style>
    </div>
  );
});

export default ContentContainer;
