/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import { MindMapComplexity, MindMapType, SpecificExplanationType } from '@/lib/types';
import { ExampleEntry } from '@/lib/exampleData';
import React, { useState, useRef, useEffect } from 'react';

interface OptionsPanelProps {
  complexity: MindMapComplexity;
  onComplexityChange: (newComplexity: MindMapComplexity) => void;
  mindMapType: MindMapType;
  onMindMapTypeChange: (newType: MindMapType) => void;
  isObsidianStyle: boolean;
  onIsObsidianStyleChange: (checked: boolean) => void;
  onSaveMap: () => void;
  selectDisabled: boolean;
  saveButtonDisabled: boolean;

  selectedNodeId: string | null;
  onElaborateNode: () => void;
  isElaboratingNode: boolean;
  onGiveExamplesForNode: () => void;
  isGivingExamples: boolean;
  onElaborateProsForNode: () => void;
  isElaboratingPros: boolean;
  onElaborateConsForNode: () => void;
  isElaboratingCons: boolean;


  onExplainNodeAction: (explanationType: SpecificExplanationType | 'default') => void;
  isExplainActionLoading: boolean;
  currentExplainActionType: SpecificExplanationType | 'default' | null;

  nodeActionButtonDisabled: boolean;

  isLayoutFrozen: boolean;
  onToggleFreezeLayout: () => void;
  freezeButtonDisabled: boolean;

  onCenterLayout: () => void;
  centerButtonDisabled: boolean;

  // Display settings
  textFadeThreshold: number;
  onTextFadeThresholdChange: (value: number) => void;
  nodeSizeMultiplier: number;
  onNodeSizeMultiplierChange: (value: number) => void;
  linkThicknessMultiplier: number;
  onLinkThicknessMultiplierChange: (value: number) => void;
  arrowsEnabled: boolean;
  onArrowsEnabledChange: (value: boolean) => void;

  // Force settings
  centerForce: number;
  onCenterForceChange: (value: number) => void;
  repelForce: number;
  onRepelForceChange: (value: number) => void;
  linkForce: number;
  onLinkForceChange: (value: number) => void;
  linkDistance: number;
  onLinkDistanceChange: (value: number) => void;

  onExportObsidian: () => void;
  isExportingObsidian: boolean;
  exportObsidianDisabled: boolean;

  onToggleUserGuide: () => void;

  onToggleChatPanel: () => void;
  chatButtonDisabled: boolean;

  numSubNodesForExpansion: number;
  onNumSubNodesForExpansionChange: (value: number) => void;
  onExpandMap: () => void;
  isExpandingMap: boolean;
  expandMapDisabled: boolean;

  onFreezeSelectedNode: () => void;
  isFreezingNode: boolean;
  isCurrentNodeFrozen: boolean;

  onAddDescriptions: () => void;
  isAddingDescriptions: boolean;
  addDescriptionsDisabled: boolean;

  onEnhanceDescription: () => void;
  isEnhancingDescription: boolean;

  examples: ExampleEntry[];
  onLoadExample: (example: ExampleEntry) => void;

  showCreateMenu: boolean;
  onToggleCreateMenu: () => void;
  onCreateFlashcards: () => void;
  isCreatingFlashcards: boolean;
  appSourceIdentifier: string | null | undefined;

  textToConvert: string;
  onTextToConvertChange: (value: string) => void;
  onConvertTextToTxt: () => void;
  isConvertingText: boolean;

  mergeSourceText: string;
  onMergeSourceTextChange: (value: string) => void;
  mergeSourceFile: File | null;
  onMergeFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessingMergeFile: boolean;
  useAlternateColorForMerge: boolean;
  onUseAlternateColorForMergeChange: (value: boolean) => void;
  attemptMergeConnections: boolean;
  onAttemptMergeConnectionsChange: (value: boolean) => void;
  makeMergedTopNodesMain: boolean; 
  onMakeMergedTopNodesMainChange: (value: boolean) => void; 
  onMergeContentSubmit: () => Promise<void>;
  isMergingContent: boolean;
  isContentGenerated: boolean; 
  overallLoadingForMerge: boolean;

  // For "Make a Connection"
  isConnectionModeActive: boolean;
  selectedNodesForConnectionCount: number;
  onToggleConnectionMode: () => void;
  isMakingConnection: boolean;
}

export default function OptionsPanel({
  complexity, onComplexityChange, mindMapType, onMindMapTypeChange,
  isObsidianStyle, onIsObsidianStyleChange, onSaveMap, selectDisabled,
  saveButtonDisabled, selectedNodeId, onElaborateNode, isElaboratingNode,
  onGiveExamplesForNode, isGivingExamples, onElaborateProsForNode, isElaboratingPros,
  onElaborateConsForNode, isElaboratingCons,
  onExplainNodeAction, isExplainActionLoading, currentExplainActionType,
  nodeActionButtonDisabled, isLayoutFrozen,
  onToggleFreezeLayout, freezeButtonDisabled, onCenterLayout, centerButtonDisabled,
  textFadeThreshold, onTextFadeThresholdChange, nodeSizeMultiplier,
  onNodeSizeMultiplierChange, linkThicknessMultiplier, onLinkThicknessMultiplierChange,
  arrowsEnabled, onArrowsEnabledChange,
  centerForce, onCenterForceChange, repelForce, onRepelForceChange,
  linkForce, onLinkForceChange, linkDistance, onLinkDistanceChange,
  onExportObsidian, isExportingObsidian, exportObsidianDisabled,
  onToggleUserGuide, onToggleChatPanel, chatButtonDisabled,
  numSubNodesForExpansion, onNumSubNodesForExpansionChange, onExpandMap,
  isExpandingMap, expandMapDisabled,
  onFreezeSelectedNode, isFreezingNode, isCurrentNodeFrozen,
  onAddDescriptions, isAddingDescriptions, addDescriptionsDisabled,
  onEnhanceDescription, isEnhancingDescription,
  examples, onLoadExample,
  showCreateMenu, onToggleCreateMenu, onCreateFlashcards, isCreatingFlashcards, appSourceIdentifier,
  textToConvert, onTextToConvertChange, onConvertTextToTxt, isConvertingText,
  mergeSourceText, onMergeSourceTextChange, mergeSourceFile, onMergeFileChange,
  isProcessingMergeFile, useAlternateColorForMerge, onUseAlternateColorForMergeChange,
  attemptMergeConnections, onAttemptMergeConnectionsChange,
  makeMergedTopNodesMain, onMakeMergedTopNodesMainChange,
  onMergeContentSubmit,
  isMergingContent, isContentGenerated, overallLoadingForMerge,
  isConnectionModeActive, selectedNodesForConnectionCount, onToggleConnectionMode, isMakingConnection,
}: OptionsPanelProps) {
  const [showAdvancedMain, setShowAdvancedMain] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showForceSettings, setShowForceSettings] = useState(false);

  const [showExplainDropdown, setShowExplainDropdown] = useState(false);
  const [showElaborateDropdown, setShowElaborateDropdown] = useState(false);
  const [showExamplesMenu, setShowExamplesMenu] = useState(false);
  const explainDropdownRef = useRef<HTMLDivElement>(null);
  const elaborateDropdownRef = useRef<HTMLDivElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);

  const complexityOptions: { value: MindMapComplexity; label: string }[] = [
    { value: 'auto', label: 'Auto (Default)' }, { value: 'simple', label: 'Simple' },
    { value: 'detailed', label: 'Detailed' }, { value: 'extended', label: 'Extended Research' },
  ];
  const mindMapTypeOptions: { value: MindMapType; label: string }[] = [
    { value: 'auto', label: 'Auto (Default)' }, { value: 'tutorial', label: 'Tutorial / How-To' },
    { value: 'concept_deep_dive', label: 'Concept Deep Dive' }, { value: 'pros_and_cons', label: 'Pros & Cons' },
    { value: 'comparison', label: 'Comparison' },
    { value: 'historical', label: 'Historical Timeline' },
  ];

  const explainOptions: { type: SpecificExplanationType; label: string }[] = [
    { type: 'what', label: 'Explain What' }, { type: 'who', label: 'Explain Who' },
    { type: 'when', label: 'Explain When' }, { type: 'why', label: 'Explain Why' },
    { type: 'how', label: 'Explain How' },
  ];

  const elaborateOptions: { type: 'give_examples' | 'elaborate_pros' | 'elaborate_cons'; label: string; action: () => void; isLoading: boolean }[] = [
    { type: 'give_examples', label: 'Give Examples', action: onGiveExamplesForNode, isLoading: isGivingExamples },
    { type: 'elaborate_pros', label: 'Elaborate Pros', action: onElaborateProsForNode, isLoading: isElaboratingPros },
    { type: 'elaborate_cons', label: 'Elaborate Cons', action: onElaborateConsForNode, isLoading: isElaboratingCons },
  ];

  const getExplainButtonText = () => {
    if (isExplainActionLoading) {
      if (currentExplainActionType) {
        const typeCap = currentExplainActionType.charAt(0).toUpperCase() + currentExplainActionType.slice(1);
        return currentExplainActionType === 'default' ? 'Explaining...' : `Explain ${typeCap}...`;
      }
      return 'Explaining...';
    }
    return 'Explain Node';
  };

  const getElaborateMainButtonText = () => {
    if (isElaboratingNode) return 'Elaborating...';
    if (isGivingExamples) return 'Generating Examples...';
    if (isElaboratingPros) return 'Finding Pros...';
    if (isElaboratingCons) return 'Finding Cons...';
    return 'Elaborate Node';
  };

  const anyElaborateActionLoading = isElaboratingNode || isGivingExamples || isElaboratingPros || isElaboratingCons;


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent, ref: React.RefObject<HTMLDivElement>, setShow: React.Dispatch<React.SetStateAction<boolean>>) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShow(false);
      }
    };
    if (showExplainDropdown) document.addEventListener('mousedown', (e) => handleClickOutside(e, explainDropdownRef, setShowExplainDropdown));
    if (showElaborateDropdown) document.addEventListener('mousedown', (e) => handleClickOutside(e, elaborateDropdownRef, setShowElaborateDropdown));

    return () => {
      document.removeEventListener('mousedown', (e) => handleClickOutside(e, explainDropdownRef, setShowExplainDropdown));
      document.removeEventListener('mousedown', (e) => handleClickOutside(e, elaborateDropdownRef, setShowElaborateDropdown));
    };
  }, [showExplainDropdown, showElaborateDropdown]);


  return (
    <div className="options-panel">
      <div className="options-group checkbox-group">
        <input type="checkbox" id="obsidian-style-checkbox" checked={isObsidianStyle} onChange={(e) => onIsObsidianStyleChange(e.target.checked)} disabled={selectDisabled || isConnectionModeActive} className="options-checkbox"/>
        <label htmlFor="obsidian-style-checkbox" className="options-checkbox-label">Obsidian Knowledge Graph Style</label>
      </div>
      <div className="options-group">
        <label htmlFor="mindmap-type-select" className="options-label">Mind Map Content Type:</label>
        <select id="mindmap-type-select" value={mindMapType} onChange={(e) => onMindMapTypeChange(e.target.value as MindMapType)} disabled={selectDisabled || isConnectionModeActive} className="options-select">
          {mindMapTypeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
      <div className="options-group">
        <label htmlFor="complexity-select" className="options-label">Mind Map Complexity:</label>
        <select id="complexity-select" value={complexity} onChange={(e) => onComplexityChange(e.target.value as MindMapComplexity)} disabled={selectDisabled || isConnectionModeActive} className="options-select">
          {complexityOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
      <div className="options-group button-grid">
         <button onClick={onCenterLayout} disabled={centerButtonDisabled || selectDisabled || !isContentGenerated} className="button-secondary options-button">Center Layout</button>
        <button onClick={onToggleFreezeLayout} disabled={freezeButtonDisabled || selectDisabled || !isContentGenerated} className="button-secondary options-button">{isLayoutFrozen ? 'Unfreeze Layout' : 'Freeze Layout'}</button>
      </div>
       <div className="options-group">
        <button
          onClick={onToggleConnectionMode}
          className={`button-secondary options-button make-connection-button ${isConnectionModeActive ? 'active' : ''}`}
          disabled={!isContentGenerated || selectDisabled || isMakingConnection}
          title={isConnectionModeActive ? (selectedNodesForConnectionCount >= 2 ? "Click again or press Enter to finalize connection" : "Select at least 2 nodes") : "Enter Connection Mode"}
        >
          <span className="google-symbols icon-link" style={{ display: 'none', marginRight: '0.4em', fontSize: '1.1em', verticalAlign: 'text-bottom' }}>link</span>
          {isMakingConnection ? 'Connecting...' : 'Make Connection'}
          {isConnectionModeActive && selectedNodesForConnectionCount > 0 && (
            <span className="connection-node-counter">{selectedNodesForConnectionCount} node{selectedNodesForConnectionCount !== 1 ? 's' : ''} selected</span>
          )}
        </button>
      </div>
      <div className="options-group button-grid">
        <div className="split-button-container" ref={elaborateDropdownRef}>
            <button
              onClick={onElaborateNode}
              disabled={nodeActionButtonDisabled || !selectedNodeId || anyElaborateActionLoading || !isContentGenerated}
              className="button-secondary options-button split-button-main"
              title={selectedNodeId ? "Elaborate selected node (default)" : "Select a node"}
            >
              {getElaborateMainButtonText()}
            </button>
            <button
              onClick={() => setShowElaborateDropdown(prev => !prev)}
              disabled={nodeActionButtonDisabled || !selectedNodeId || anyElaborateActionLoading || !isContentGenerated}
              className="button-secondary options-button split-button-arrow"
              aria-haspopup="true"
              aria-expanded={showElaborateDropdown}
              title="More elaboration options"
            >
              <span className="arrow-down-icon"></span>
            </button>
            {showElaborateDropdown && (
              <div className="custom-dropdown-menu" role="menu">
                {elaborateOptions.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => { opt.action(); setShowElaborateDropdown(false); }}
                    className="custom-dropdown-item"
                    role="menuitem"
                    disabled={anyElaborateActionLoading}
                  >
                    {opt.isLoading ? 'Processing...' : opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        <div className="split-button-container" ref={explainDropdownRef}>
          <button
            onClick={() => onExplainNodeAction('default')}
            disabled={nodeActionButtonDisabled || !selectedNodeId || isExplainActionLoading || !isContentGenerated}
            className="button-secondary options-button split-button-main"
            title={selectedNodeId ? "Explain selected node (default)" : "Select a node"}
          >
            {getExplainButtonText()}
          </button>
          <button
            onClick={() => setShowExplainDropdown(prev => !prev)}
            disabled={nodeActionButtonDisabled || !selectedNodeId || isExplainActionLoading || !isContentGenerated}
            className="button-secondary options-button split-button-arrow"
            aria-haspopup="true"
            aria-expanded={showExplainDropdown}
            title="More explain options"
          >
            <span className="arrow-down-icon"></span>
          </button>
          {showExplainDropdown && (
            <div className="custom-dropdown-menu" role="menu">
              {explainOptions.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { onExplainNodeAction(opt.type); setShowExplainDropdown(false);}}
                  className="custom-dropdown-item"
                  role="menuitem"
                  disabled={isExplainActionLoading}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="options-group">
        <button
            onClick={onEnhanceDescription}
            className="button-secondary options-button enhance-description-button"
            disabled={nodeActionButtonDisabled || !selectedNodeId || isEnhancingDescription || !isContentGenerated}
            title={selectedNodeId ? (isEnhancingDescription ? "Enhancing..." : "Enhanced Description") : "Select a node to enhance its description"}
        >
            <span className="google-symbols icon-default">description</span>
            <span className="google-symbols icon-hover">auto_awesome</span>
            {isEnhancingDescription ? 'Enhancing...' : 'Enhance Description'}
        </button>
      </div>

      <div className="options-group"><button onClick={onSaveMap} disabled={saveButtonDisabled || !isContentGenerated} className="button-secondary options-button" style={{ width: '100%' }}>Save Map</button></div>
      <div className="options-group"><button onClick={onToggleChatPanel} disabled={chatButtonDisabled || !isContentGenerated} className="button-secondary options-button" style={{ width: '100%', marginTop: '0.5rem' }}>Chat with Map</button></div>

      <div className="options-group">
        <button onClick={onToggleUserGuide} className="button-secondary options-button" style={{ width: '100%', marginTop: '0.5rem' }} disabled={selectDisabled && !anyElaborateActionLoading && !isExplainActionLoading && !isExportingObsidian && !isExpandingMap && !isFreezingNode && !isCreatingFlashcards && !isAddingDescriptions && !isConvertingText && !isEnhancingDescription && !isMakingConnection}>User Guide</button>
      </div>

      <div className="options-group">
        <button
            onClick={onToggleCreateMenu}
            className="button-secondary options-button"
            style={{ width: '100%', marginTop: '0.5rem' }}
            aria-expanded={showCreateMenu}
            disabled={(selectDisabled && !isCreatingFlashcards && !isConvertingText) || isConnectionModeActive}
        >
          {showCreateMenu ? 'Hide Creation Tools' : 'Show Creation Tools'}
        </button>
      </div>

      {showCreateMenu && (
        <div className="create-tools-container">
          <h3 className="create-tools-title">Creation Tools:</h3>
          <div className="tool-section">
            <button
              onClick={onCreateFlashcards}
              className="button-primary options-button"
              disabled={isCreatingFlashcards || selectDisabled || !isContentGenerated}
              style={{width: '100%'}}
            >
              {isCreatingFlashcards ? 'Creating Flashcards...' : 'Create Flashcards from Map'}
            </button>
          </div>
          <div className="tool-section">
            <h4 className="tool-subtitle">Convert Text to .txt</h4>
            <textarea
              className="convert-text-area"
              value={textToConvert}
              onChange={(e) => onTextToConvertChange(e.target.value)}
              placeholder="Paste or type text here..."
              disabled={isConvertingText || selectDisabled}
              rows={4}
              aria-label="Text to convert to .txt file"
            />
            <button
              onClick={onConvertTextToTxt}
              className="button-primary options-button"
              disabled={isConvertingText || !textToConvert.trim() || selectDisabled}
              style={{width: '100%', marginTop: '0.5rem'}}
            >
              {isConvertingText ? 'Downloading...' : 'Download .txt'}
            </button>
          </div>
        </div>
      )}

      <div className="options-group">
        <button onClick={() => setShowExamplesMenu(!showExamplesMenu)} className="button-secondary options-button" style={{ width: '100%', marginTop: '0.5rem' }} aria-expanded={showExamplesMenu} disabled={selectDisabled || isConnectionModeActive}>
          {showExamplesMenu ? 'Hide Examples' : 'Show Examples'}
        </button>
      </div>

      {showExamplesMenu && (
        <div className="examples-container">
          <h3 className="examples-title">Load an Example:</h3>
          {examples.map(example => (
            <button
              key={example.id}
              className="example-item-button button-secondary"
              onClick={() => onLoadExample(example)}
              disabled={selectDisabled}
              title={`Load: ${example.title}\nURL: ${example.videoUrl}`}
            >
              <span className="example-item-title">{example.title}</span>
              <span className="example-item-url">{example.videoUrl}</span>
            </button>
          ))}
        </div>
      )}

      <div className="options-group">
          <button onClick={() => setShowAdvancedMain(!showAdvancedMain)} className="button-secondary options-button" style={{ width: '100%', marginTop: '0.5rem' }} aria-expanded={showAdvancedMain} disabled={selectDisabled || isConnectionModeActive}>
              {showAdvancedMain ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </button>
      </div>
      
      {showAdvancedMain && (
        <div className="advanced-options-container">
            {/* Display Collapsible Section */}
            <div className="options-group collapsible-section">
              <button onClick={() => setShowDisplaySettings(!showDisplaySettings)} className="collapsible-header button-secondary options-button" aria-expanded={showDisplaySettings}>
                Display
                <span className={`chevron ${showDisplaySettings ? 'up' : 'down'}`}></span>
              </button>
              {showDisplaySettings && (
                <div className="collapsible-content">
                  <div className="options-group checkbox-group" style={{marginTop: '0.5rem'}}>
                    <input type="checkbox" id="arrows-enabled-checkbox" checked={arrowsEnabled} onChange={(e) => onArrowsEnabledChange(e.target.checked)} disabled={selectDisabled || !isContentGenerated} className="options-checkbox"/>
                    <label htmlFor="arrows-enabled-checkbox" className="options-checkbox-label">Arrows</label>
                  </div>
                  {isObsidianStyle && (
                    <>
                      <div className="options-group slider-group">
                        <label htmlFor="text-fade-slider" className="slider-label">Text fade threshold: {textFadeThreshold}</label>
                        <input type="range" id="text-fade-slider" min="1" max="20" step="1" value={textFadeThreshold} onChange={(e) => onTextFadeThresholdChange(parseInt(e.target.value, 10))} className="options-slider" disabled={selectDisabled || !isContentGenerated}/>
                      </div>
                      <div className="options-group slider-group">
                        <label htmlFor="node-size-slider" className="slider-label">Node size: {nodeSizeMultiplier.toFixed(1)}x</label>
                        <input type="range" id="node-size-slider" min="0.5" max="2.0" step="0.1" value={nodeSizeMultiplier} onChange={(e) => onNodeSizeMultiplierChange(parseFloat(e.target.value))} className="options-slider" disabled={selectDisabled || !isContentGenerated}/>
                      </div>
                      <div className="options-group slider-group">
                        <label htmlFor="link-thickness-slider" className="slider-label">Link thickness: {linkThicknessMultiplier.toFixed(1)}x</label>
                        <input type="range" id="link-thickness-slider" min="0.5" max="3.0" step="0.1" value={linkThicknessMultiplier} onChange={(e) => onLinkThicknessMultiplierChange(parseFloat(e.target.value))} className="options-slider" disabled={selectDisabled || !isContentGenerated}/>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Forces Collapsible Section */}
            <div className="options-group collapsible-section">
              <button onClick={() => setShowForceSettings(!showForceSettings)} className="collapsible-header button-secondary options-button" aria-expanded={showForceSettings}>
                Forces
                <span className={`chevron ${showForceSettings ? 'up' : 'down'}`}></span>
              </button>
              {showForceSettings && (
                <div className="collapsible-content">
                  <div className="options-group slider-group" style={{marginTop: '0.5rem'}}>
                    <label htmlFor="center-force-slider" className="slider-label">Center force: {centerForce.toFixed(2)}</label>
                    <input type="range" id="center-force-slider" min="0" max="1" step="0.01" value={centerForce} onChange={(e) => onCenterForceChange(parseFloat(e.target.value))} className="options-slider" disabled={selectDisabled || !isContentGenerated}/>
                  </div>
                  <div className="options-group slider-group">
                    <label htmlFor="repel-force-slider" className="slider-label">Repel force: {repelForce.toFixed(0)}</label>
                    <input type="range" id="repel-force-slider" min="500" max="30000" step="100" value={repelForce} onChange={(e) => onRepelForceChange(parseFloat(e.target.value))} className="options-slider" disabled={selectDisabled || !isContentGenerated}/>
                  </div>
                  <div className="options-group slider-group">
                    <label htmlFor="link-force-slider" className="slider-label">Link force: {linkForce.toFixed(3)}</label>
                    <input type="range" id="link-force-slider" min="0.005" max="0.1" step="0.001" value={linkForce} onChange={(e) => onLinkForceChange(parseFloat(e.target.value))} className="options-slider" disabled={selectDisabled || !isContentGenerated}/>
                  </div>
                  <div className="options-group slider-group">
                    <label htmlFor="link-distance-slider" className="slider-label">Link distance: {linkDistance.toFixed(0)}</label>
                    <input type="range" id="link-distance-slider" min="50" max="300" step="5" value={linkDistance} onChange={(e) => onLinkDistanceChange(parseFloat(e.target.value))} className="options-slider" disabled={selectDisabled || !isContentGenerated}/>
                  </div>
                </div>
              )}
            </div>
            
          {/* Existing Advanced Controls moved slightly below the new Display/Forces sections */}
          <div className="options-group input-group" style={{marginTop: '1rem'}}>
            <label htmlFor="num-subnodes-input" className="options-label">Sub-nodes per Main Node (Expand Map):</label>
            <input
                type="number"
                id="num-subnodes-input"
                value={numSubNodesForExpansion}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 5) {
                        onNumSubNodesForExpansionChange(val);
                    } else if (e.target.value === "") {
                        onNumSubNodesForExpansionChange(1); // Default to 1 if cleared
                    }
                }}
                min="1"
                max="5"
                step="1"
                disabled={expandMapDisabled || isExpandingMap || selectDisabled || !isContentGenerated}
                className="options-input"
                style={{width: '60px', textAlign: 'center', marginRight: '1rem'}}
            />
          </div>
          <div className="options-group">
            <button
                onClick={onExpandMap}
                disabled={expandMapDisabled || isExpandingMap || selectDisabled || !isContentGenerated}
                className="button-primary options-button"
                style={{ width: '100%' }}
                title="For each top-level node, generate related sub-nodes."
            >
                {isExpandingMap ? 'Expanding Map...' : 'Expand Map'}
            </button>
          </div>

          <div className="options-group" style={{ marginTop: '1rem' }}>
            <button
              onClick={onFreezeSelectedNode}
              disabled={nodeActionButtonDisabled || !selectedNodeId || isFreezingNode || !isContentGenerated}
              className="button-secondary options-button"
              style={{ width: '100%' }}
              title={selectedNodeId ? (isCurrentNodeFrozen ? "Unfreeze selected node's position" : "Freeze selected node's position") : "Select a node to freeze/unfreeze"}
            >
              {isFreezingNode ? 'Updating Freeze...' : (isCurrentNodeFrozen ? 'Unfreeze Node' : 'Freeze Node')}
            </button>
          </div>

          <div className="options-group" style={{ marginTop: '1rem' }}>
            <button
              onClick={onAddDescriptions}
              disabled={addDescriptionsDisabled || isAddingDescriptions || !isContentGenerated}
              className="button-primary options-button"
              style={{ width: '100%' }}
              title="Automatically generate and add descriptions (tooltips) to nodes missing them."
            >
              {isAddingDescriptions ? 'Adding Descriptions...' : 'Add Descriptions'}
            </button>
          </div>
          
          {isObsidianStyle && (
            <div className="options-group" style={{ marginTop: '1rem' }}>
              <button onClick={onExportObsidian} disabled={exportObsidianDisabled || isExportingObsidian || selectDisabled || !isContentGenerated} className="button-primary options-button" style={{ width: '100%' }}>{isExportingObsidian ? 'Exporting...' : 'Export for Obsidian'}</button>
            </div>
          )}

          <div className="tool-section" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--obsidian-input-border)' }}>
            <h3 className="options-label" style={{fontSize: '1rem', fontWeight: 500, color: 'var(--color-text)'}}>Upload Additional Content</h3>
            <input
              type="text"
              placeholder="YouTube URL or Text to Merge"
              value={mergeSourceText}
              onChange={(e) => onMergeSourceTextChange(e.target.value)}
              className="options-input"
              disabled={overallLoadingForMerge || isMergingContent}
              aria-label="URL or Text for merging content"
            />
            <input
              type="file"
              id="merge-source-file-input-options-panel" 
              ref={mergeFileInputRef}
              onChange={onMergeFileChange}
              accept=".txt"
              style={{ display: 'none' }}
              disabled={overallLoadingForMerge || isMergingContent}
              aria-label="Upload .txt file for merging content"
            />
            <button 
                onClick={() => mergeFileInputRef.current?.click()}
                disabled={overallLoadingForMerge || isMergingContent} 
                className="button-secondary options-button"
                style={{width: '100%', marginTop: '0.5rem'}}
            >
                <span className="google-symbols" style={{marginRight: '0.3em', fontSize:'1.1em'}}>upload_file</span>
                {isProcessingMergeFile ? 'Processing File...' : (mergeSourceFile ? `File: ${mergeSourceFile.name.substring(0,20)}${mergeSourceFile.name.length > 20 ? '...' : ''}` : 'Upload .txt to Merge')}
            </button>
            <div className="checkbox-group" style={{marginTop: '0.75rem'}}>
                <input type="checkbox" id="use-alternate-color-merge" checked={useAlternateColorForMerge} onChange={(e) => onUseAlternateColorForMergeChange(e.target.checked)} disabled={overallLoadingForMerge || isMergingContent} className="options-checkbox"/>
                <label htmlFor="use-alternate-color-merge" className="options-checkbox-label">Use distinct color for new nodes</label>
            </div>
            <div className="checkbox-group">
                <input type="checkbox" id="attempt-merge-connections" checked={attemptMergeConnections} onChange={(e) => onAttemptMergeConnectionsChange(e.target.checked)} disabled={overallLoadingForMerge || isMergingContent} className="options-checkbox"/>
                <label htmlFor="attempt-merge-connections" className="options-checkbox-label">Merge Content (Connect with AI)</label>
            </div>
            <div className="checkbox-group" style={{marginBottom: '0.75rem'}}>
                <input type="checkbox" id="make-merged-top-nodes-main" checked={makeMergedTopNodesMain} onChange={(e) => onMakeMergedTopNodesMainChange(e.target.checked)} disabled={overallLoadingForMerge || isMergingContent} className="options-checkbox"/>
                <label htmlFor="make-merged-top-nodes-main" className="options-checkbox-label">Make New Top-Level Nodes Main</label>
            </div>
            <button 
                onClick={onMergeContentSubmit} 
                disabled={!isContentGenerated || overallLoadingForMerge || isMergingContent || (!mergeSourceText.trim() && !mergeSourceFile)} 
                className="button-primary options-button"
                style={{width: '100%'}}
                title={!isContentGenerated ? "Generate an initial map first." : "Merge the provided content into the current map."}
            >
                {isMergingContent ? 'Merging...' : 'Merge into Map'}
            </button>
          </div>

        </div>
      )}
      <style>{`
        .options-panel { background-color: var(--obsidian-sidebar-bg, #252528); padding: 1rem; border-radius: 6px; margin-top: 1rem; border: 1px solid var(--obsidian-border-color, #3a3a3f); }
        .options-group { margin-bottom: 0.75rem; } .options-group:last-child { margin-bottom: 0; }
        .options-label { display: block; font-size: 0.9rem; color: var(--color-text, #dcdcdc); margin-bottom: 0.35rem; }
        .checkbox-group { display: flex; align-items: center; margin-bottom: 0.85rem; }
        .options-checkbox { margin-right: 0.5rem; width: 16px; height: 16px; accent-color: var(--color-accent); }
        .options-checkbox:disabled { cursor: not-allowed; }
        .options-checkbox-label { font-size: 0.9rem; color: var(--color-text, #dcdcdc); cursor: pointer; }
        .options-select, .options-input { width: 100%; background-color: var(--obsidian-input-bg, #2a2a2e); color: var(--color-text, #dcdcdc); border: 1px solid var(--obsidian-input-border, #4a4a4f); padding: 0.4rem 0.6rem; border-radius: 4px; font-family: var(--font-primary); font-size: 0.9rem; }
        .options-select:disabled, .options-input:disabled { background-color: #2f2f32; color: #777777; cursor: not-allowed; opacity: 0.7; }
        .options-select:focus, .options-input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 2px rgba(78, 116, 228, 0.3); }
        .options-button { width: 100%; padding: 0.6rem 1rem; display: flex; align-items: center; justify-content: center; }
        .button-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .advanced-options-container { border-top: 1px solid var(--obsidian-border-color, #3a3a3f); margin-top: 1rem; padding-top: 1rem; }
        
        .collapsible-section { margin-bottom: 0.75rem; }
        .collapsible-header { display: flex; justify-content: space-between; align-items: center; width: 100%; text-align: left; }
        .collapsible-content { padding-top: 0.75rem; border-top: 1px solid var(--obsidian-input-border); margin-top:0.5rem; }
        .chevron { display: inline-block; width: 0; height: 0; margin-left: 8px; vertical-align: middle; border-style: solid; transition: transform 0.2s ease-in-out; }
        .chevron.down { border-width: 5px 4px 0 4px; border-color: currentColor transparent transparent transparent; }
        .chevron.up { border-width: 0 4px 5px 4px; border-color: transparent transparent currentColor transparent; }

        .slider-group { margin-bottom: 1rem; } .input-group { margin-bottom: 1rem; display: flex; flex-direction: column; }
        .slider-label { display: block; font-size: 0.85rem; color: var(--color-text, #dcdcdc); margin-bottom: 0.4rem; }
        .options-slider { width: 100%; cursor: pointer; accent-color: var(--color-accent); }
        .options-slider:disabled { cursor: not-allowed; opacity: 0.5; }
        .options-slider::-webkit-slider-runnable-track { background: var(--obsidian-input-bg, #2a2a2e); height: 6px; border-radius: 3px; border: 1px solid var(--obsidian-input-border, #4a4a4f); }
        .options-slider::-moz-range-track { background: var(--obsidian-input-bg, #2a2a2e); height: 6px; border-radius: 3px; border: 1px solid var(--obsidian-input-border, #4a4a4f); }
        .options-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -5px; background: var(--color-accent, #4e74e4); height: 16px; width: 16px; border-radius: 50%; border: 1px solid var(--obsidian-border-color); }
        .options-slider::-moz-range-thumb { background: var(--color-accent, #4e74e4); height: 14px; width: 14px; border-radius: 50%; border: 1px solid var(--obsidian-border-color); }

        .split-button-container { display: flex; position: relative; }
        .split-button-main { flex-grow: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; border-right: none; }
        .split-button-arrow { display: flex; align-items: center; justify-content: center; width: 30px; padding: 0.6rem 0; border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: 1px solid var(--color-secondary-accent); }
        .split-button-arrow .arrow-down-icon { display: inline-block; width: 6px; height: 6px; border-style: solid; border-color: currentColor; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); pointer-events: none; margin-bottom: 2px; }
        .split-button-main:disabled + .split-button-arrow, .split-button-arrow:disabled { border-left-color: var(--color-border-disabled, #3f3f42); }

        .custom-dropdown-menu { position: absolute; top: 100%; left: 0; right: 0; background-color: var(--obsidian-button-bg); border: 1px solid var(--obsidian-border-color); border-top: none; border-radius: 0 0 4px 4px; z-index: 100; box-shadow: 0 4px 8px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
        .custom-dropdown-item { background-color: transparent; border: none; color: var(--obsidian-button-text); padding: 0.6rem 1rem; text-align: left; width: 100%; font-size: 0.9rem; font-family: var(--font-primary); }
        .custom-dropdown-item:hover:not(:disabled) { background-color: var(--obsidian-button-hover-bg); color: #ffffff; }
        .custom-dropdown-item:disabled { color: #777777; cursor: not-allowed; }
        .examples-container, .create-tools-container { border-top: 1px solid var(--obsidian-border-color, #3a3a3f); margin-top: 1rem; padding-top: 1rem; }
        .examples-title, .create-tools-title { font-size: 1rem; color: var(--color-text); margin-bottom: 0.5rem; font-weight: 500; }
        .example-item-button { display: block; width: 100%; text-align: left; margin-bottom: 0.5rem; padding: 0.5rem 0.75rem; }
        .example-item-button:last-child { margin-bottom: 0; }
        .example-item-title { display: block; font-size: 0.85rem; font-weight: 500; color: var(--color-text-active); margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .example-item-url { display: block; font-size: 0.75rem; color: var(--color-secondary-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .tool-section { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed var(--obsidian-input-border); }
        .tool-section:first-of-type { margin-top: 0.5rem; padding-top: 0; border-top: none; }
        .tool-subtitle { font-size: 0.95rem; color: var(--color-secondary-accent); margin-bottom: 0.5rem; font-weight: 500; }
        .convert-text-area { width: 100%; min-height: 80px; background-color: var(--obsidian-input-bg, #2a2a2e); color: var(--color-text, #dcdcdc); border: 1px solid var(--obsidian-input-border, #4a4a4f); padding: 0.5rem 0.75rem; border-radius: 4px; font-family: var(--font-primary); font-size: 0.9rem; resize: vertical; margin-bottom: 0.5rem; }
        .convert-text-area:disabled { background-color: #2f2f32; color: #777777; cursor: not-allowed; opacity: 0.7; }
        .convert-text-area:focus { border-color: var(--color-accent); box-shadow: 0 0 0 2px rgba(78, 116, 228, 0.3); }

        .enhance-description-button .icon-default { display: inline-flex; align-items: center; }
        .enhance-description-button .icon-hover { display: none; align-items: center; }
        .enhance-description-button:hover:not(:disabled) .icon-default { display: none; }
        .enhance-description-button:hover:not(:disabled) .icon-hover { display: inline-flex; }
        .enhance-description-button:hover:not(:disabled) { border-color: var(--color-warning-yellow, #FFD700); color: var(--color-warning-yellow, #FFD700); }
        .enhance-description-button:hover:not(:disabled) .google-symbols { color: var(--color-warning-yellow, #FFD700); }

        .make-connection-button .icon-link { display: none; }
        .make-connection-button:hover:not(:disabled) .icon-link { display: inline-flex; }
        .make-connection-button.active { background-color: var(--color-connection-mode-active, #3f51b5) !important; border-color: var(--color-accent, #4e74e4) !important; color: #ffffff !important; }
        .make-connection-button.active .icon-link { display: inline-flex !important; } /* Ensure icon shows in active mode */
        .connection-node-counter { margin-left: 0.5em; font-size: 0.8rem; opacity: 0.8; }

      `}</style>
    </div>
  );
}
