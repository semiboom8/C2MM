/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import ContentContainer from '@/components/ContentContainer';
import OptionsPanel from '@/components/OptionsPanel';
import UserGuideModal from '@/components/UserGuideModal';
import ChatPanel from '@/components/ChatPanel';
import ToastNotification from '@/components/ToastNotification';
// QuizModal import removed
import { getYoutubeEmbedUrl, validateYoutubeUrl } from '@/lib/youtube';
import { MindMapComplexity, MindMapType, ChatMessage, AddNodeFromChatResult, SpecificExplanationType, MindMapData } from '@/lib/types'; // QuizQuestion removed
import { createObsidianZip, triggerDownload, ObsidianNodeData } from '@/lib/obsidianExport';
import { generateText, GenerateTextApiOutput } from '@/lib/textGeneration';
import { getChatWithMapPrompt, getMakeConnectionPrompt } from '@/lib/prompts';
import { examplesData, ExampleEntry } from '@/lib/exampleData';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Tool } from '@google/genai';
// uuid import removed as it was for quiz question IDs

const VALIDATE_INPUT_URL = true; // Assumed to be true for button validation logic

// Type for loading states passed from ContentContainer
type ContentLoadingType =
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
  'making_connection';

interface ContentContainerHandle {
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
  addMissingDescriptions: () => Promise<{ nodesUpdated: number}>;
  enhanceSelectedNodeDescription: () => Promise<{ success: boolean; newDescription?: string }>;
  mergeNewContent: (newContentSource: string, newContentType: 'url' | 'text', useAlternateColor: boolean, attemptMerge: boolean, makeNewTopNodesMain: boolean) => Promise<void>;
  getDetailsForNodeIds: (nodeIds: string[]) => Promise<Array<{id: string, label: string, title?:string, x?: number, y?: number}>>;
  addConnectionNodeAndEdges: (details: { connectorNodeLabel: string; connectorNodeTitle?: string; selectedNodeIds: string[]; position?: { x: number; y: number }; isObsidianStyle: boolean; arrowsEnabled: boolean; }) => Promise<{newNodeId: string} | null>;
}

export default function App() {
  const [videoUrl, setVideoUrl] = useState(''); // Used as key for ContentContainer and to store source ID
  const [textInput, setTextInput] = useState(''); // New state for controlled input
  const [urlValidating, setUrlValidating] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [isElaboratingNode, setIsElaboratingNode] = useState(false);
  const [isGivingExamples, setIsGivingExamples] = useState(false);
  const [isElaboratingPros, setIsElaboratingPros] = useState(false);
  const [isElaboratingCons, setIsElaboratingCons] = useState(false);
  const [isExplainActionLoading, setIsExplainActionLoading] = useState(false);
  const [currentExplainActionType, setCurrentExplainActionType] = useState<SpecificExplanationType | 'default' | null>(null);
  const [isFreezingNode, setIsFreezingNode] = useState(false);
  const [isCurrentNodeFrozen, setIsCurrentNodeFrozen] = useState(false);
  const [isAddingDescriptions, setIsAddingDescriptions] = useState(false);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);

  const [isExportingObsidian, setIsExportingObsidian] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [mindMapComplexity, setMindMapComplexity] = useState<MindMapComplexity>('auto');
  const [mindMapType, setMindMapType] = useState<MindMapType>('auto');
  const [isObsidianStyle, setIsObsidianStyle] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string | null>(null);
  const [isLayoutFrozen, setIsLayoutFrozen] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);

  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInputValue, setChatInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentMapNodeLabels, setCurrentMapNodeLabels] = useState<string[]>([]);
  const [allowInternetForChat, setAllowInternetForChat] = useState(true);

  const [numSubNodesPerExpansion, setNumSubNodesPerExpansion] = useState(3);
  const [isExpandingMap, setIsExpandingMap] = useState(false);

  // Display settings
  const [textFadeThreshold, setTextFadeThreshold] = useState(1); 
  const [nodeSizeMultiplier, setNodeSizeMultiplier] = useState(1.0);
  const [linkThicknessMultiplier, setLinkThicknessMultiplier] = useState(1.0);
  const [arrowsEnabled, setArrowsEnabled] = useState(false); 

  // Force settings
  const [centerForce, setCenterForce] = useState(0.1);
  const [repelForce, setRepelForce] = useState(15000); 
  const [linkForce, setLinkForce] = useState(0.02);
  const [linkDistance, setLinkDistance] = useState(120);


  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [activePreloadedMap, setActivePreloadedMap] = useState<MindMapData | null>(null);

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isCreatingFlashcards, setIsCreatingFlashcards] = useState(false);
  const [textToConvert, setTextToConvert] = useState('');
  const [isConvertingText, setIsConvertingText] = useState(false);


  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [generationSource, setGenerationSource] = useState<'url' | 'transcript' | null>(null);

  // State for Merge Content feature
  const [mergeSourceText, setMergeSourceText] = useState('');
  const [mergeSourceFile, setMergeSourceFile] = useState<File | null>(null);
  const [mergeSourceFileContent, setMergeSourceFileContent] = useState<string | null>(null);
  const [isProcessingMergeFile, setIsProcessingMergeFile] = useState(false);
  const [useAlternateColorForMerge, setUseAlternateColorForMerge] = useState(false);
  const [attemptMergeConnections, setAttemptMergeConnections] = useState(true); 
  const [makeMergedTopNodesMain, setMakeMergedTopNodesMain] = useState(true);
  const [isMergingContent, setIsMergingContent] = useState(false);

  // State for "Make a Connection" feature
  const [isConnectionModeActive, setIsConnectionModeActive] = useState(false);
  const [selectedNodesForConnection, setSelectedNodesForConnection] = useState<string[]>([]);
  const [isMakingConnection, setIsMakingConnection] = useState(false);


  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentContainerRef = useRef<ContentContainerHandle>(null);

  const handleIsObsidianStyleChange = (checked: boolean) => {
    setIsObsidianStyle(checked);
    if (checked) {
      setArrowsEnabled(false);
      setRepelForce(15000); 
      setLinkForce(0.02);   
      setLinkDistance(120); 
    } else {
      setArrowsEnabled(true);
      setRepelForce(20000); 
      setLinkForce(0.03);   
      setLinkDistance(150); 
    }
  };

  const showAppToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage(null);
    }, 3500);
  };

  const updateCurrentMapNodeLabels = useCallback(async () => {
    if (contentContainerRef.current) {
      try {
        const labels = await contentContainerRef.current.getAllNodeLabels();
        setCurrentMapNodeLabels(labels || []);
      } catch (error) {
        console.error("Error fetching node labels for App state:", error);
        setCurrentMapNodeLabels([]);
      }
    } else {
      setCurrentMapNodeLabels([]);
    }
  }, []);

  const handleTextInputChange = (newValue: string) => {
    setTextInput(newValue);
    if (transcriptFile && newValue !== transcriptFile.name) {
        setTranscriptFile(null);
        setTranscriptContent(null);
        // generationSource will be set by handleSubmit or derived for button logic
        showAppToast("Switched to URL/Text input. Transcript cleared.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setTranscriptFile(file);
        // setVideoUrl(''); // videoUrl is for ContentContainer key
        setTextInput(file.name); // Update controlled input state
        
        setIsProcessingFile(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          setTranscriptContent(e.target?.result as string);
          setIsProcessingFile(false);
          showAppToast(`Transcript "${file.name}" loaded.`);
          // setGenerationSource('transcript'); // This will be derived by button logic / set in handleSubmit
        };
        reader.onerror = () => {
          setIsProcessingFile(false);
          showAppToast('Error reading file.');
          setTranscriptFile(null);
          setTextInput(''); // Clear text input if file reading failed
          // setGenerationSource(null);
        };
        reader.readAsText(file);
      } else {
        showAppToast('Invalid file type. Please select a .txt file.');
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !overallLoading) { // overallLoading check is fine here
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const currentTextInputValue = textInput.trim();
    if (!currentTextInputValue && !transcriptContent) {
      inputRef.current?.focus();
      return;
    }
    if (overallLoading) return;


    let currentSourceForGeneration: 'url' | 'transcript' = 'url';
    let sourceDataForGeneration: string = '';

    if (transcriptFile && transcriptContent && currentTextInputValue === transcriptFile.name) {
      currentSourceForGeneration = 'transcript';
      sourceDataForGeneration = transcriptContent;
    } else if (currentTextInputValue) { 
      currentSourceForGeneration = 'url'; // This means it's either a URL or generic text
      sourceDataForGeneration = currentTextInputValue;
    } else {
      inputRef.current?.focus(); 
      return;
    }
    setGenerationSource(currentSourceForGeneration);


    setActivePreloadedMap(null);
    setUrlValidating(currentSourceForGeneration === 'url');
    setVideoUrl(''); 
    setSelectedNodeId(null);
    setSelectedNodeLabel(null);
    setIsCurrentNodeFrozen(false);
    setCurrentMapNodeLabels([]);
    setContentLoading(true);
    setIsLayoutFrozen(false);
    setChatMessages([]);
    setShowCreateMenu(false);
    setIsConnectionModeActive(false);
    setSelectedNodesForConnection([]);


    if (currentSourceForGeneration === 'url') {
      if (VALIDATE_INPUT_URL) {
        const validationResult = validateYoutubeUrl(sourceDataForGeneration);
        if (validationResult.isValid) {
          proceedWithGeneration(sourceDataForGeneration, 'url');
        } else {
          alert(validationResult.error || 'Invalid YouTube URL or Text input for URL mode');
          setUrlValidating(false);
          setContentLoading(false);
        }
      } else {
        proceedWithGeneration(sourceDataForGeneration, 'url');
      }
    } else { // Transcript mode
      setUrlValidating(false); 
      proceedWithGeneration(sourceDataForGeneration, 'transcript');
    }
  };

  const proceedWithGeneration = (sourceIdentifier: string, type: 'url' | 'transcript') => {
    setVideoUrl(type === 'url' ? sourceIdentifier : transcriptFile?.name || 'transcript.txt');
    setReloadCounter((c) => c + 1);
    setUrlValidating(false);
  };


  const handleLoadExample = (example: ExampleEntry) => {
    if (overallLoading) return;

    setTextInput(example.videoUrl); 
    setTranscriptFile(null);
    setTranscriptContent(null);
    setGenerationSource('url'); // Ensure sourceType is 'url' for preloaded examples

    setActivePreloadedMap(example.mindMapData);
    setVideoUrl(example.videoUrl); 

    setUrlValidating(false);
    setContentLoading(false);
    setIsElaboratingNode(false);
    setIsGivingExamples(false);
    setIsElaboratingPros(false);
    setIsElaboratingCons(false);
    setIsExplainActionLoading(false);
    setCurrentExplainActionType(null);
    setIsFreezingNode(false);
    setIsAddingDescriptions(false);
    setIsEnhancingDescription(false);
    setIsExportingObsidian(false);
    setIsChatLoading(false);
    setIsExpandingMap(false);
    setIsLayoutFrozen(false);
    setSelectedNodeId(null);
    setSelectedNodeLabel(null);
    setIsCurrentNodeFrozen(false);
    setShowCreateMenu(false);
    setIsCreatingFlashcards(false);
    setChatMessages([]);
    setIsConnectionModeActive(false);
    setSelectedNodesForConnection([]);
    setIsMakingConnection(false);

    setTimeout(() => updateCurrentMapNodeLabels(), 100);


    setReloadCounter(c => c + 1);
    showAppToast(`Loaded example: ${example.title}`);
  };


  const handleContentLoadingStateChange = useCallback((isLoading: boolean, type: ContentLoadingType) => {
    if (type === 'generation') {
      setContentLoading(isLoading);
      if (!isLoading) { setIsLayoutFrozen(false); updateCurrentMapNodeLabels(); }
    } else if (type === 'elaboration') {
      setIsElaboratingNode(isLoading);
      if (!isLoading) updateCurrentMapNodeLabels();
    } else if (type === 'give_examples') {
      setIsGivingExamples(isLoading);
      if (!isLoading) updateCurrentMapNodeLabels();
    } else if (type === 'elaborate_pros') {
      setIsElaboratingPros(isLoading);
      if (!isLoading) updateCurrentMapNodeLabels();
    } else if (type === 'elaborate_cons') {
      setIsElaboratingCons(isLoading);
      if (!isLoading) updateCurrentMapNodeLabels();
    } else if (type.startsWith('explanation_')) {
      setIsExplainActionLoading(isLoading);
      if (!isLoading) {
        setCurrentExplainActionType(null);
        updateCurrentMapNodeLabels();
      } else {
        const explainType = type.substring('explanation_'.length) as SpecificExplanationType | 'default';
        setCurrentExplainActionType(explainType);
      }
    } else if (type === 'expansion') {
        setIsExpandingMap(isLoading);
        if (!isLoading) updateCurrentMapNodeLabels();
    } else if (type === 'chat_add_node') {
        setIsChatLoading(isLoading);
        if (!isLoading) updateCurrentMapNodeLabels();
    } else if (type === 'add_descriptions') {
        setIsAddingDescriptions(isLoading);
    } else if (type === 'enhancing_description') {
        setIsEnhancingDescription(isLoading);
    } else if (type === 'merging_content') {
        setIsMergingContent(isLoading);
        if (!isLoading) updateCurrentMapNodeLabels();
    } else if (type === 'making_connection') {
        setIsMakingConnection(isLoading);
        // if (!isLoading) updateCurrentMapNodeLabels(); // update labels happens after adding node anyway
    }
  }, [updateCurrentMapNodeLabels]);

  const currentYear = new Date().getFullYear();

  const handleSaveMap = async () => {
    if (contentContainerRef.current) {
      await contentContainerRef.current.captureAndDownloadImage();
    }
  };

  const handleNodeSelectedForApp = useCallback(async (nodeId: string | null) => {
    if (isConnectionModeActive) return; // Regular node selection disabled in connection mode

    setSelectedNodeId(nodeId);
    if (nodeId && contentContainerRef.current) {
        const details = contentContainerRef.current.getSelectedNodeDetails();
        setSelectedNodeLabel(details?.label || null);
        const frozenStatus = await contentContainerRef.current.isNodeFrozen(nodeId);
        setIsCurrentNodeFrozen(frozenStatus);
    } else {
        setSelectedNodeLabel(null);
        setIsCurrentNodeFrozen(false);
    }
  }, [isConnectionModeActive, setSelectedNodeId, setSelectedNodeLabel, setIsCurrentNodeFrozen]);

  const handleNodeToggleForConnection = useCallback((nodeId: string) => {
    setSelectedNodesForConnection(prevSelected => {
      if (prevSelected.includes(nodeId)) {
        return prevSelected.filter(id => id !== nodeId);
      } else {
        return [...prevSelected, nodeId];
      }
    });
  }, []);

  const handleElaborateNode = async () => {
    if (contentContainerRef.current && selectedNodeId && !isElaboratingNode && !isGivingExamples && !isElaboratingPros && !isElaboratingCons && !contentLoading && !urlValidating && !isExplainActionLoading && !isExportingObsidian && !isChatLoading && !isExpandingMap && !isFreezingNode && !isAddingDescriptions && !isEnhancingDescription) {
      try {
        await contentContainerRef.current.elaborateOnSelectedNode();
      } catch (error) {
        console.error("Error elaborating node in App:", error);
        showAppToast(`Failed to elaborate node: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleGiveExamplesForNode = async () => {
    if (contentContainerRef.current && selectedNodeId && !isElaboratingNode && !isGivingExamples && !isElaboratingPros && !isElaboratingCons && !overallLoading) {
        try { await contentContainerRef.current.giveExamplesForSelectedNode(); }
        catch (error) { showAppToast(`Failed to get examples: ${error instanceof Error ? error.message : 'Unknown error'}`);}
    }
  };
  const handleElaborateProsForNode = async () => {
    if (contentContainerRef.current && selectedNodeId && !isElaboratingNode && !isGivingExamples && !isElaboratingPros && !isElaboratingCons && !overallLoading) {
        try { await contentContainerRef.current.elaborateProsForSelectedNode(); }
        catch (error) { showAppToast(`Failed to elaborate pros: ${error instanceof Error ? error.message : 'Unknown error'}`);}
    }
  };
  const handleElaborateConsForNode = async () => {
     if (contentContainerRef.current && selectedNodeId && !isElaboratingNode && !isGivingExamples && !isElaboratingPros && !isElaboratingCons && !overallLoading) {
        try { await contentContainerRef.current.elaborateConsForSelectedNode(); }
        catch (error) { showAppToast(`Failed to elaborate cons: ${error instanceof Error ? error.message : 'Unknown error'}`);}
    }
  };

  const handleExplainNodeAction = async (explanationType: SpecificExplanationType | 'default') => {
    if (contentContainerRef.current && selectedNodeId && !isExplainActionLoading && !overallLoading) {
      setIsExplainActionLoading(true);
      setCurrentExplainActionType(explanationType);
      try {
        await contentContainerRef.current.explainSelectedNode(explanationType);
      } catch (error) {
        console.error(`Error explaining node (type: ${explanationType}):`, error);
        showAppToast(`Failed to explain node: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleFreezeSelectedNode = async () => {
    if (contentContainerRef.current && selectedNodeId && !isFreezingNode && !overallLoading) {
        setIsFreezingNode(true);
        try {
            await contentContainerRef.current.freezeSelectedNode(); 
            const nodeDetails = contentContainerRef.current.getSelectedNodeDetails();
            const newFrozenStatus = await contentContainerRef.current.isNodeFrozen(selectedNodeId);
            setIsCurrentNodeFrozen(newFrozenStatus);
            showAppToast(`Node '${nodeDetails?.label || 'Selected Node'}' ${newFrozenStatus ? 'frozen' : 'unfrozen'}.`);
        } catch (error) {
            console.error("Error toggling node freeze state in App:", error);
            showAppToast(`Failed to update node freeze state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsFreezingNode(false);
        }
    }
  };


  const handleExportObsidian = async () => {
    if (contentContainerRef.current && !isExportingObsidian && (videoUrl || transcriptFile) && !overallLoading) {
      setIsExportingObsidian(true);
      try {
        const nodesData = contentContainerRef.current.getMapDataForObsidianExport();
        if (nodesData && nodesData.length > 0) {
          let baseTitle = 'mindmap_export';
          const currentEffectiveSource = (transcriptFile && textInput === transcriptFile.name) ? 'transcript' : 'url';
          if (currentEffectiveSource === 'transcript' && transcriptFile) {
            baseTitle = transcriptFile.name.replace(/\.[^/.]+$/, ""); 
          } else if (currentEffectiveSource === 'url' && textInput) {
            baseTitle = textInput.split('?v=')[1]?.split('&')[0] || textInput.split('/').pop() || baseTitle;
          }
          const sanitizedTitle = baseTitle.replace(/[^a-zA-Z0-9_]/g, '_');
          const zipBlob = await createObsidianZip(nodesData);
          triggerDownload(zipBlob, `${sanitizedTitle}_obsidian_export.zip`);
          showAppToast('Obsidian export completed!');
        } else {
          showAppToast('No data to export or invalid data.');
        }
      } catch (error) {
        console.error("Error exporting for Obsidian:", error);
        showAppToast(`Obsidian export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsExportingObsidian(false);
      }
    }
  };

  const handleToggleUserGuide = () => {
    setShowUserGuide(prev => !prev);
  };

  const handleToggleChatPanel = () => {
    if (!showChatPanel) {
        updateCurrentMapNodeLabels(); 
    }
    setShowChatPanel(prev => !prev);
  };

  const handleChatSendMessage = async (queryOverride?: string, useInternetForThisMessage?: boolean) => {
    const query = queryOverride || chatInputValue.trim();
    if (!query || isChatLoading) return;

    setIsChatLoading(true);
    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text: query, timestamp: Date.now() }];
    setChatMessages(newMessages);
    setChatInputValue('');

    try {
        const mapContext = contentContainerRef.current?.getMapContextForChat() || "No map context available.";
        const prompt = getChatWithMapPrompt(mapContext, newMessages.slice(-7, -1), query, !!useInternetForThisMessage);
        
        const toolsConfig: Tool[] | undefined = useInternetForThisMessage ? [{googleSearch: {}}] : undefined;
        const response = await generateText({ prompt, tools: toolsConfig });

        setChatMessages(prev => [...prev, { sender: 'ai', text: response.text, timestamp: Date.now(), groundingSources: response.groundingSources }]);
    } catch (error) {
        console.error('Error in chat:', error);
        const errorMsg = error instanceof Error ? error.message : 'Sorry, something went wrong.';
        setChatMessages(prev => [...prev, { sender: 'ai', text: `Error: ${errorMsg}`, timestamp: Date.now() }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const handleAddNodeFromChat = async (entityText: string, chatMessageContext: string) => {
      if (!contentContainerRef.current || isChatLoading) return;
      setIsChatLoading(true); 
      try {
          const result = await contentContainerRef.current.addNodeFromChat(entityText, chatMessageContext);
          if (result.mainNodeAdded) {
              showAppToast(`Node '${result.newNodeLabel}' added to map${result.parentNodeLabel ? ` under '${result.parentNodeLabel}'` : ''}.`);
              await updateCurrentMapNodeLabels(); 
          } else {
              showAppToast(`Failed to add '${entityText}' to the map.`);
          }
      } catch (error) {
          console.error("Error adding node from chat in App:", error);
          showAppToast(`Error adding node: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsChatLoading(false);
      }
  };

  const handleExpandMap = async () => {
      if (!contentContainerRef.current || isExpandingMap || overallLoading) return;
      setIsExpandingMap(true);
      try {
          const { totalNodesAdded } = await contentContainerRef.current.expandMap(numSubNodesPerExpansion, allowInternetForChat);
          showAppToast(totalNodesAdded > 0 ? `${totalNodesAdded} new sub-node(s) added.` : 'No new sub-nodes were added. Try adjusting settings or the map content.');
      } catch (error) {
          console.error("Error expanding map in App:", error);
          showAppToast(`Failed to expand map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsExpandingMap(false);
      }
  };

  const handleAddDescriptions = async () => {
    if (!contentContainerRef.current || isAddingDescriptions || overallLoading) return;
    setIsAddingDescriptions(true);
    try {
        const { nodesUpdated } = await contentContainerRef.current.addMissingDescriptions();
        if (nodesUpdated > 0) {
            showAppToast(`Descriptions added to ${nodesUpdated} node(s).`);
        } else {
            showAppToast('No nodes needed descriptions, or no descriptions could be generated.');
        }
    } catch (error) {
        console.error("Error adding descriptions in App:", error);
        showAppToast(`Failed to add descriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsAddingDescriptions(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!contentContainerRef.current || !selectedNodeId || isEnhancingDescription || overallLoading) return;
    setIsEnhancingDescription(true);
    try {
        const result = await contentContainerRef.current.enhanceSelectedNodeDescription();
        if (result.success) {
            showAppToast(`Description for '${selectedNodeLabel || 'selected node'}' enhanced.`);
        } else {
            showAppToast(`Could not enhance description. AI might not have found additions.`);
        }
    } catch (error) {
        console.error("Error enhancing description in App:", error);
        showAppToast(`Failed to enhance description: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsEnhancingDescription(false);
    }
  };


  const handleToggleCreateMenu = () => {
    setShowCreateMenu(prev => !prev);
  };

  const handleCreateFlashcards = async () => {
    if (!contentContainerRef.current || isCreatingFlashcards || overallLoading) return;
    setIsCreatingFlashcards(true);
    try {
      const nodesData = contentContainerRef.current.getImportantNodesForFlashcards();
      if (!nodesData || nodesData.length === 0) {
        showAppToast("No important nodes found to create flashcards.");
        setIsCreatingFlashcards(false);
        return;
      }

      const flashcards = nodesData.map(node => ({
        front: node.label,
        back: node.title && node.title.trim() !== "" && node.title.trim() !== node.label.trim() ? node.title : `Definition or details for ${node.label}`
      }));

      const escapeCsvField = (field: string): string => {
        return String(field || '').replace(/"/g, '""');
      };
      
      let csvContent = ''; 
      flashcards.forEach(card => {
        csvContent += `"${escapeCsvField(card.front)}","${escapeCsvField(card.back)}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      let baseName = 'mindmap';
      const currentEffectiveSource = (transcriptFile && textInput === transcriptFile.name) ? 'transcript' : 'url';
      if (currentEffectiveSource === 'transcript' && transcriptFile) {
        baseName = transcriptFile.name.replace(/\.[^/.]+$/, ""); 
      } else if (currentEffectiveSource === 'url' && textInput) {
         baseName = textInput.split('v=')[1]?.split('&')[0] || textInput.split('/').pop() || baseName;
      }
      const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
      triggerDownload(blob, `${sanitizedBaseName}_flashcards.csv`);
      showAppToast(`Flashcards CSV downloaded for ${flashcards.length} nodes!`);

    } catch (error) { 
      console.error("Error creating flashcards:", error);
      showAppToast(`Flashcard creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingFlashcards(false);
    }
  };

  const handleConvertTextToTxt = () => {
    if (!textToConvert.trim() || isConvertingText) return;
    setIsConvertingText(true);
    try {
      const d = new Date();
      const timestamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
      const filename = `converted_text_${timestamp}.txt`;
      const blob = new Blob([textToConvert], { type: 'text/plain;charset=utf-8;' });
      triggerDownload(blob, filename);
      showAppToast("Text downloaded as .txt!");
      setTextToConvert(''); 
    } catch (error) {
      console.error("Error converting text to .txt:", error);
      showAppToast(`Text download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConvertingText(false);
    }
  };

  const handleMergeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            setMergeSourceFile(file);
            setMergeSourceText(''); 
            setIsProcessingMergeFile(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                setMergeSourceFileContent(e.target?.result as string);
                setIsProcessingMergeFile(false);
                showAppToast(`Merge file "${file.name}" ready.`);
            };
            reader.onerror = () => {
                setIsProcessingMergeFile(false);
                showAppToast('Error reading merge file.');
                setMergeSourceFile(null);
                setMergeSourceFileContent(null);
            };
            reader.readAsText(file);
        } else {
            showAppToast('Invalid file type for merge. Please select a .txt file.');
            if (event.target) event.target.value = '';
            setMergeSourceFile(null);
        }
    }
  };

  const handleMergeContentSubmit = async () => {
    if (isMergingContent || overallLoading || (isProcessingMergeFile && !mergeSourceFileContent)) return;

    let sourceTypeForMerge: 'url' | 'text' | null = null;
    let sourceDataForMerge: string = '';

    if (mergeSourceFileContent && mergeSourceFile) {
        sourceTypeForMerge = 'text'; 
        sourceDataForMerge = mergeSourceFileContent;
    } else if (mergeSourceText.trim()) {
        const trimmedText = mergeSourceText.trim();
        const validationResult = validateYoutubeUrl(trimmedText); 
        if (validationResult.isValid) {
            sourceTypeForMerge = 'url';
        } else {
            sourceTypeForMerge = 'text'; 
        }
        sourceDataForMerge = trimmedText;
    }

    if (!sourceTypeForMerge || !sourceDataForMerge) {
        showAppToast("No content provided for merging.");
        return;
    }

    if (!contentContainerRef.current) {
        showAppToast("Map container not ready.");
        return;
    }
    
    const mapExists = !!(videoUrl || transcriptFile || activePreloadedMap);
    if (!mapExists) {
        showAppToast("Please generate or load an initial map before merging content.");
        return;
    }

    setIsMergingContent(true);
    try {
        await contentContainerRef.current.mergeNewContent(
            sourceDataForMerge,
            sourceTypeForMerge,
            useAlternateColorForMerge,
            attemptMergeConnections,
            makeMergedTopNodesMain 
        );
        showAppToast("Content merged successfully!");
        setMergeSourceText('');
        setMergeSourceFile(null);
        setMergeSourceFileContent(null);
        const mergeFileInput = document.getElementById('merge-source-file-input-options-panel') as HTMLInputElement | null;
        if (mergeFileInput) mergeFileInput.value = '';

    } catch (error) {
        console.error("Error merging content in App:", error);
        showAppToast(`Failed to merge content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsMergingContent(false);
    }
  };

  const processConnection = async () => {
    if (!contentContainerRef.current || selectedNodesForConnection.length < 2) {
      showAppToast(selectedNodesForConnection.length < 2 ? "Please select at least 2 nodes to make a connection." : "Map container not ready.");
      setIsConnectionModeActive(false);
      setSelectedNodesForConnection([]);
      return;
    }

    setIsMakingConnection(true);
    showAppToast("Generating connection...");

    try {
      const nodeDetailsArray = await contentContainerRef.current.getDetailsForNodeIds(selectedNodesForConnection);
      const nodeLabels = nodeDetailsArray.map(n => n.label);
      const prompt = getMakeConnectionPrompt(nodeLabels);
      const result = await generateText({ prompt, responseMimeType: "application/json" });

      let parsedResult: { connectorNodeLabel: string; connectorNodeTitle?: string; };
      try {
        let jsonStr = result.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) jsonStr = match[2].trim();
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse AI response for connection:", parseError, "Raw text:", result.text);
        throw new Error("AI returned invalid format for connection.");
      }
      
      if (!parsedResult.connectorNodeLabel) {
        throw new Error("AI did not provide a label for the connection node.");
      }

      let sumX = 0, sumY = 0, countWithCoords = 0;
      nodeDetailsArray.forEach(node => {
        if (typeof node.x === 'number' && typeof node.y === 'number') {
          sumX += node.x;
          sumY += node.y;
          countWithCoords++;
        }
      });
      
      const position = countWithCoords > 0 ? { x: sumX / countWithCoords, y: sumY / countWithCoords } : undefined;

      const connectorDetails = {
        connectorNodeLabel: parsedResult.connectorNodeLabel,
        connectorNodeTitle: parsedResult.connectorNodeTitle,
        selectedNodeIds: selectedNodesForConnection,
        position,
        isObsidianStyle: isObsidianStyle,
        arrowsEnabled: arrowsEnabled,
      };

      const addResult = await contentContainerRef.current.addConnectionNodeAndEdges(connectorDetails);
      if(addResult?.newNodeId){
        showAppToast(`Connection node "${parsedResult.connectorNodeLabel}" created!`);
        await updateCurrentMapNodeLabels();
      } else {
        showAppToast(`Failed to create connection node.`);
      }

    } catch (error) {
      console.error("Error making connection:", error);
      showAppToast(`Failed to make connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMakingConnection(false);
      setIsConnectionModeActive(false);
      setSelectedNodesForConnection([]);
    }
  };

  const handleToggleConnectionMode = () => {
    if (isConnectionModeActive) { // Trying to exit mode
      if (selectedNodesForConnection.length >= 2) {
        processConnection();
      } else {
        setIsConnectionModeActive(false);
        setSelectedNodesForConnection([]);
        showAppToast("Connection mode deactivated. Not enough nodes selected.");
      }
    } else { // Trying to enter mode
      setIsConnectionModeActive(true);
      setSelectedNodesForConnection([]);
      showAppToast("Connection Mode Activated. Click on 2 or more nodes on the map, then click 'Make Connection' again or press Enter.");
      setSelectedNodeId(null); // Deselect any single-selected node
      setSelectedNodeLabel(null);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isConnectionModeActive) {
        event.preventDefault();
        if (selectedNodesForConnection.length >= 2) {
          processConnection();
        } else {
          showAppToast("Please select at least 2 nodes to make a connection.");
          // Optionally, also exit connection mode here if Enter is pressed with < 2 nodes:
          // setIsConnectionModeActive(false);
          // setSelectedNodesForConnection([]);
        }
      }
    };

    if (isConnectionModeActive) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    } else {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isConnectionModeActive, selectedNodesForConnection, processConnection]);


  const overallLoading = contentLoading || urlValidating || isProcessingFile || isElaboratingNode || isGivingExamples || isElaboratingPros || isElaboratingCons || isExplainActionLoading || isExpandingMap || isExportingObsidian || isFreezingNode || isChatLoading || isCreatingFlashcards || isAddingDescriptions || isConvertingText || isEnhancingDescription || isMergingContent || isProcessingMergeFile || isMakingConnection;
  const nodeSpecificActionLoading = isElaboratingNode || isGivingExamples || isElaboratingPros || isElaboratingCons || isExplainActionLoading || isFreezingNode || isEnhancingDescription;
  const anyActionLoading = overallLoading || nodeSpecificActionLoading;
  const isContentGenerated = !!(videoUrl || transcriptFile || activePreloadedMap); 

  let generateButtonTextDisplay = 'Generate Mind Map';
  let isGenerateButtonDisabled = true;

  const isEffectiveTranscriptMode = !!(transcriptFile && transcriptContent && textInput === transcriptFile.name);
  const isEffectiveUrlMode = !isEffectiveTranscriptMode && textInput.trim() !== '';

  if (contentLoading) {
    generateButtonTextDisplay = 'Generating...';
    isGenerateButtonDisabled = true;
  } else if (urlValidating) {
    generateButtonTextDisplay = 'Validating URL...';
    isGenerateButtonDisabled = true;
  } else if (isProcessingFile) {
    generateButtonTextDisplay = 'Processing File...';
    isGenerateButtonDisabled = true;
  } else if (overallLoading) { 
    if (isElaboratingNode) generateButtonTextDisplay = 'Elaborating...';
    else if (isExpandingMap) generateButtonTextDisplay = 'Expanding...';
    else if (isMakingConnection) generateButtonTextDisplay = 'Connecting...';
    else generateButtonTextDisplay = 'Processing...';
    isGenerateButtonDisabled = true;
  } else { 
    if (isEffectiveTranscriptMode) {
      generateButtonTextDisplay = 'Generate from Transcript';
      isGenerateButtonDisabled = !transcriptContent; 
    } else if (isEffectiveUrlMode) {
      generateButtonTextDisplay = 'Generate Mind Map';
      const { isValid } = validateYoutubeUrl(textInput.trim());
      isGenerateButtonDisabled = !isValid;
    } else { 
      generateButtonTextDisplay = 'Generate Mind Map';
      isGenerateButtonDisabled = true; 
    }
  }


  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="headline">Content to Mind Map AI</h1>
        <p className="subtitle">Turn YouTube videos or text transcripts into interactive mind maps. Paste a URL or upload a .txt file to start!</p>
      </header>
      <main className="main-container">
        <aside className="left-side">
          <div className="input-area">
            <input
              ref={inputRef} 
              type="text"
              aria-label="YouTube Video URL or Transcript Filename"
              placeholder="Paste YouTube URL or Upload Transcript"
              value={textInput} 
              onKeyDown={handleKeyDown}
              onChange={(e) => handleTextInputChange(e.target.value)}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                handleTextInputChange(pastedText);
              }}
              className="url-input"
              disabled={overallLoading && !isProcessingFile} 
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt"
              style={{ display: 'none' }}
              disabled={overallLoading} 
              id="main-transcript-file-input"
            />
            <div className="button-group-horizontal">
                <button onClick={handleUploadButtonClick} disabled={overallLoading} className="button-secondary upload-button">
                    Upload .txt
                </button>
                <button onClick={handleSubmit} disabled={isGenerateButtonDisabled} className="button-primary generate-button-main">
                   {generateButtonTextDisplay}
                </button>
            </div>
          </div>
          <OptionsPanel
            complexity={mindMapComplexity}
            onComplexityChange={setMindMapComplexity}
            mindMapType={mindMapType}
            onMindMapTypeChange={setMindMapType}
            isObsidianStyle={isObsidianStyle}
            onIsObsidianStyleChange={handleIsObsidianStyleChange}
            onSaveMap={handleSaveMap}
            selectDisabled={overallLoading} 
            saveButtonDisabled={!isContentGenerated || overallLoading || isConnectionModeActive}
            selectedNodeId={selectedNodeId}
            onElaborateNode={handleElaborateNode}
            isElaboratingNode={isElaboratingNode}
            onGiveExamplesForNode={handleGiveExamplesForNode}
            isGivingExamples={isGivingExamples}
            onElaborateProsForNode={handleElaborateProsForNode}
            isElaboratingPros={isElaboratingPros}
            onElaborateConsForNode={handleElaborateConsForNode}
            isElaboratingCons={isElaboratingCons}
            onExplainNodeAction={handleExplainNodeAction}
            isExplainActionLoading={isExplainActionLoading}
            currentExplainActionType={currentExplainActionType}
            nodeActionButtonDisabled={!selectedNodeId || overallLoading || isConnectionModeActive}
            isLayoutFrozen={isLayoutFrozen}
            onToggleFreezeLayout={() => {
                if (contentContainerRef.current) {
                    contentContainerRef.current.togglePhysics(isLayoutFrozen); 
                    setIsLayoutFrozen(!isLayoutFrozen);
                }
            }}
            freezeButtonDisabled={!isContentGenerated || overallLoading || mindMapType === 'historical' || isConnectionModeActive}
            onCenterLayout={() => contentContainerRef.current?.centerNetworkView()}
            centerButtonDisabled={!isContentGenerated || overallLoading || isConnectionModeActive}
            
            textFadeThreshold={textFadeThreshold}
            onTextFadeThresholdChange={setTextFadeThreshold}
            nodeSizeMultiplier={nodeSizeMultiplier}
            onNodeSizeMultiplierChange={setNodeSizeMultiplier}
            linkThicknessMultiplier={linkThicknessMultiplier}
            onLinkThicknessMultiplierChange={setLinkThicknessMultiplier}
            arrowsEnabled={arrowsEnabled}
            onArrowsEnabledChange={setArrowsEnabled}
            centerForce={centerForce}
            onCenterForceChange={setCenterForce}
            repelForce={repelForce}
            onRepelForceChange={setRepelForce}
            linkForce={linkForce}
            onLinkForceChange={setLinkForce}
            linkDistance={linkDistance}
            onLinkDistanceChange={setLinkDistance}

            onExportObsidian={handleExportObsidian}
            isExportingObsidian={isExportingObsidian}
            exportObsidianDisabled={!isObsidianStyle || !isContentGenerated || overallLoading || isConnectionModeActive}
            onToggleUserGuide={handleToggleUserGuide}
            onToggleChatPanel={handleToggleChatPanel}
            chatButtonDisabled={!isContentGenerated || (overallLoading && !isChatLoading) || isConnectionModeActive}
            numSubNodesForExpansion={numSubNodesPerExpansion}
            onNumSubNodesForExpansionChange={setNumSubNodesPerExpansion}
            onExpandMap={handleExpandMap}
            isExpandingMap={isExpandingMap}
            expandMapDisabled={!isContentGenerated || overallLoading || isConnectionModeActive}
            onFreezeSelectedNode={handleFreezeSelectedNode}
            isFreezingNode={isFreezingNode}
            isCurrentNodeFrozen={isCurrentNodeFrozen}
            onAddDescriptions={handleAddDescriptions}
            isAddingDescriptions={isAddingDescriptions}
            addDescriptionsDisabled={!isContentGenerated || overallLoading || isConnectionModeActive}
            onEnhanceDescription={handleEnhanceDescription}
            isEnhancingDescription={isEnhancingDescription}
            examples={examplesData}
            onLoadExample={handleLoadExample}
            showCreateMenu={showCreateMenu}
            onToggleCreateMenu={handleToggleCreateMenu}
            onCreateFlashcards={handleCreateFlashcards}
            isCreatingFlashcards={isCreatingFlashcards}
            appSourceIdentifier={videoUrl || transcriptFile?.name} 
            textToConvert={textToConvert}
            onTextToConvertChange={setTextToConvert}
            onConvertTextToTxt={handleConvertTextToTxt}
            isConvertingText={isConvertingText}
            
            mergeSourceText={mergeSourceText}
            onMergeSourceTextChange={setMergeSourceText}
            mergeSourceFile={mergeSourceFile}
            onMergeFileChange={handleMergeFileChange}
            isProcessingMergeFile={isProcessingMergeFile}
            useAlternateColorForMerge={useAlternateColorForMerge}
            onUseAlternateColorForMergeChange={setUseAlternateColorForMerge}
            attemptMergeConnections={attemptMergeConnections}
            onAttemptMergeConnectionsChange={setAttemptMergeConnections}
            makeMergedTopNodesMain={makeMergedTopNodesMain}
            onMakeMergedTopNodesMainChange={setMakeMergedTopNodesMain}
            onMergeContentSubmit={handleMergeContentSubmit}
            isMergingContent={isMergingContent}
            isContentGenerated={isContentGenerated} 
            overallLoadingForMerge={overallLoading}
            
            isConnectionModeActive={isConnectionModeActive}
            selectedNodesForConnectionCount={selectedNodesForConnection.length}
            onToggleConnectionMode={handleToggleConnectionMode}
            isMakingConnection={isMakingConnection}
          />
        </aside>
        <section className="right-side" aria-live="polite">
           <ContentContainer
            key={reloadCounter}
            ref={contentContainerRef}
            sourceIdentifier={videoUrl} 
            sourceType={generationSource} 
            sourceTextContent={generationSource === 'transcript' ? transcriptContent : null}
            mindMapComplexity={mindMapComplexity}
            mindMapType={mindMapType}
            isObsidianStyle={isObsidianStyle}
            onLoadingStateChange={handleContentLoadingStateChange}
            onNodeSelected={handleNodeSelectedForApp}
            initialPhysicsFrozen={isLayoutFrozen}
            textFadeThreshold={textFadeThreshold}
            nodeSizeMultiplier={nodeSizeMultiplier}
            linkThicknessMultiplier={linkThicknessMultiplier}
            preloadedMapData={activePreloadedMap}
            arrowsEnabled={arrowsEnabled}
            centerForce={centerForce}
            repelForce={repelForce}
            linkForce={linkForce}
            linkDistance={linkDistance}
            isConnectionModeActive={isConnectionModeActive}
            selectedNodesForConnection={selectedNodesForConnection}
            onToggleNodeForConnection={handleNodeToggleForConnection}
          />
        </section>
      </main>
      <footer className="app-footer">
        <p className="attribution">&copy; {currentYear} Content to Mind Map AI. For demonstration purposes.</p>
      </footer>
      {showUserGuide && <UserGuideModal onClose={handleToggleUserGuide} />}
      <ChatPanel
        isOpen={showChatPanel}
        onClose={handleToggleChatPanel}
        messages={chatMessages}
        inputValue={chatInputValue}
        onInputChange={(e) => setChatInputValue(e.target.value)}
        onSendMessage={handleChatSendMessage}
        isLoading={isChatLoading}
        selectedNodeLabel={selectedNodeLabel}
        onAddNodeFromChat={handleAddNodeFromChat}
        currentMapNodeLabels={currentMapNodeLabels}
        allowInternetAccess={allowInternetForChat}
        onAllowInternetAccessChange={setAllowInternetForChat}
      />
      <ToastNotification message={toastMessage} show={showToast} />
      <style>{`
        :root {
          --color-background: #1e1e1e; --color-text: #dcdcdc; --color-accent: #4e74e4;
          --color-secondary-accent: #7a82a8; --color-error: #e57373;
          --color-warning-yellow: #FFD700; /* Gold */
          --color-connection-mode-active: #3f51b5; /* A slightly different blue for active connection mode */
          --color-connection-node-highlight: #FFD700; /* Gold for highlighting nodes selected for connection */
          --font-display: 'Titan One', sans-serif; --font-primary: 'Google Sans Flex', sans-serif;
          --obsidian-sidebar-bg: #252528; --obsidian-editor-bg: #1e1e1e;
          --obsidian-border-color: #3a3a3f; --obsidian-input-bg: #2a2a2e;
          --obsidian-input-border: #4a4a4f; --obsidian-button-bg: #3a3a3f;
          --obsidian-button-hover-bg: #4a4a4f; --obsidian-button-text: #dcdcdc;
          --color-headline: var(--color-text); --color-subtitle: #b0b0b0;
          --color-attribution: #909090; --color-video-container-background: #2a2a2e;
          --color-video-placeholder-text: #a0a0a0;
          --color-content-placeholder-border: var(--obsidian-border-color);
          --color-content-placeholder-text: var(--color-text);
          --color-parchment-bg: #f5efDC;
        }
        .app-container { display: flex; flex-direction: column; min-height: 100vh; background-color: var(--color-background); color: var(--color-text); }
        .app-header { text-align: center; padding: 1.5rem 1rem; border-bottom: 1px solid var(--obsidian-border-color); }
        .headline { font-family: var(--font-display); font-weight: 400; font-size: clamp(2.5rem, 5vw, 3.5rem); color: var(--color-headline); margin-bottom: 0.5rem; }
        .subtitle { font-size: clamp(0.9rem, 2.5vw, 1.1rem); color: var(--color-subtitle); max-width: 600px; margin: 0 auto; }
        .main-container { display: flex; flex-grow: 1; padding: 1.5rem; gap: 1.5rem; overflow: hidden; }
        .left-side { width: 320px; min-width: 280px; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; padding-right: 0.5rem; scrollbar-width: thin; scrollbar-color: var(--obsidian-border-color) var(--obsidian-input-bg); }
        .left-side::-webkit-scrollbar { width: 8px; } .left-side::-webkit-scrollbar-track { background: var(--obsidian-input-bg); border-radius: 4px; }
        .left-side::-webkit-scrollbar-thumb { background-color: var(--obsidian-border-color); border-radius: 4px; border: 2px solid var(--obsidian-input-bg); }
        .right-side { flex-grow: 1; display: flex; flex-direction: column; border: 1px solid var(--obsidian-border-color); border-radius: 8px; background-color: var(--obsidian-editor-bg); min-height: 400px; }
        .input-area { display: flex; flex-direction: column; gap: 0.75rem; background-color: var(--obsidian-sidebar-bg); padding: 1rem; border-radius: 6px; border: 1px solid var(--obsidian-border-color); }
        .url-input { width: 100%; padding: 0.75rem; font-size: 0.95rem; }
        .button-group-horizontal { display: flex; gap: 0.5rem; }
        .upload-button { flex-basis: 35%; padding: 0.75rem 0.5rem; font-size: 0.9rem; }
        .generate-button-main { flex-grow: 1; padding: 0.75rem 1rem; font-size: 1rem; }
        .app-footer { text-align: center; padding: 1rem; border-top: 1px solid var(--obsidian-border-color); }
        .attribution { font-size: 0.8rem; color: var(--color-attribution); }
        @media (max-width: 768px) {
          .main-container { flex-direction: column; padding: 1rem; gap: 1rem; }
          .left-side { width: 100%; max-height: 50vh; padding-right: 0; }
          .right-side { min-height: 300px; }
          .headline { font-size: 2rem; } .subtitle { font-size: 0.9rem; }
          .upload-button { font-size: 0.85rem; }
          .generate-button-main { font-size: 0.95rem; }
        }
        .google-symbols { font-family: 'Google Symbols'; font-weight: normal; font-style: normal; font-size: 1.1em; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; -moz-osx-font-smoothing: grayscale; font-feature-settings: 'liga'; vertical-align: text-bottom; margin-right: 0.25em;}

      `}</style>
    </div>
  );
}
