/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import { ChatMessage } from '@/lib/types';
import React, { useEffect, useRef, useState } from 'react';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (queryOverride?: string, allowInternet?: boolean) => void;
  isLoading: boolean;
  selectedNodeLabel: string | null; 
  onAddNodeFromChat: (entityText: string, chatMessageContext: string) => void; // Updated signature
  currentMapNodeLabels: string[];
  allowInternetAccess: boolean; 
  onAllowInternetAccessChange: (value: boolean) => void; 
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen, onClose, messages, inputValue, onInputChange, onSendMessage, isLoading,
  selectedNodeLabel, onAddNodeFromChat, currentMapNodeLabels,
  allowInternetAccess, onAllowInternetAccessChange, 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [panelPosition, setPanelPosition] = useState({ x: 50, y: 50 });
  const [clickedEntities, setClickedEntities] = useState<Set<string>>(new Set());

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);}, [isOpen]);

  const handleSend = () => { if (inputValue.trim() || !isLoading) onSendMessage(undefined, allowInternetAccess);};
  const handleStarterPromptClick = (promptText: string) => { if (!isLoading) onSendMessage(promptText, allowInternetAccess);};

  const onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return; setIsDragging(true);
    const panelRect = panelRef.current.getBoundingClientRect();
    setDragStartPos({ x: e.clientX - panelRect.left, y: e.clientY - panelRect.top });
    e.preventDefault(); 
  };

  const onDragMove = (e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;
    const parentRect = panelRef.current.parentElement?.getBoundingClientRect(); if (!parentRect) return;
    let newX = e.clientX - dragStartPos.x - parentRect.left;
    let newY = e.clientY - dragStartPos.y - parentRect.top;
    newX = Math.max(0, Math.min(newX, parentRect.width - panelRef.current.offsetWidth));
    newY = Math.max(0, Math.min(newY, parentRect.height - panelRef.current.offsetHeight));
    setPanelPosition({ x: newX, y: newY });
  };
  const onDragEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) { document.addEventListener('mousemove', onDragMove); document.addEventListener('mouseup', onDragEnd); }
    else { document.removeEventListener('mousemove', onDragMove); document.removeEventListener('mouseup', onDragEnd); }
    return () => { document.removeEventListener('mousemove', onDragMove); document.removeEventListener('mouseup', onDragEnd); };
  }, [isDragging, dragStartPos]);

  const handleNewEntityClick = (entityText: string, fullMessageText: string, messageIndex: number) => {
    const entityKey = `${messageIndex}_${entityText}`;
    if (clickedEntities.has(entityKey) || isLoading) return; 
    
    onAddNodeFromChat(entityText, fullMessageText); // Pass entityText and fullMessageText as context
    setClickedEntities(prev => new Set(prev).add(entityKey));
  };

  const renderMessageContent = (text: string, messageIndex: number) => {
    const parts = []; let lastIndex = 0; const entityRegex = /\*\*(.*?)\*\*/g; let match;
    while ((match = entityRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(<span key={`text-${messageIndex}-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      const entityText = match[1]; const entityKey = `${messageIndex}_${entityText}`;
      const entityTextLower = entityText.toLowerCase();
      const isExistingOnMap = currentMapNodeLabels.some(label => label.toLowerCase() === entityTextLower);
      const isClickedNewEntity = clickedEntities.has(entityKey);

      if (isExistingOnMap) {
        parts.push(<span key={`entity-${messageIndex}-${match.index}`} className="chat-entity existing-on-map" title="Already on map">{entityText}</span>);
      } else {
        parts.push(<span key={`entity-${messageIndex}-${match.index}`} className={`chat-entity new-entity ${isClickedNewEntity ? 'clicked' : ''}`} title={isClickedNewEntity ? "Added to map" : "Click to add to map."} onClick={() => !isClickedNewEntity && handleNewEntityClick(entityText, text, messageIndex)}>{entityText}</span>);
      }
      lastIndex = entityRegex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(<span key={`text-${messageIndex}-${lastIndex}-end`}>{text.substring(lastIndex)}</span>);
    return parts;
  };
  
  const starterPrompts = [
    { id: 'summarize', text: "Summarize the main topics of the current map." },
    { id: 'explain_selected', text: selectedNodeLabel ? `Explain "${selectedNodeLabel}" in more detail.` : "Explain selected node (select one first)", disabled: !selectedNodeLabel },
    { id: 'interconnections', text: "How are the topics in this map interconnected?" },
  ];

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className="chat-panel-content" style={{ left: `${panelPosition.x}px`, top: `${panelPosition.y}px` }} role="dialog" aria-labelledby="chat-panel-title">
      <div className="chat-panel-header" onMouseDown={onDragStart}>
        <h2 id="chat-panel-title" className="chat-panel-title">Chat with Your Map</h2>
        <button onClick={onClose} className="chat-panel-close-button" aria-label="Close chat panel">&times;</button>
      </div>
      <div className="chat-messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            {renderMessageContent(msg.text, index)}
            {msg.sender === 'ai' && msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="chat-message-sources"><strong>Sources:</strong><ul>{msg.groundingSources.map((source, srcIndex) => (<li key={srcIndex}><a href={source.uri} target="_blank" rel="noopener noreferrer">{source.title || source.uri}</a></li>))}</ul></div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length -1]?.sender === 'user' && (<div className="chat-message ai loading-message">Thinking...</div>)}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-starter-prompts">{starterPrompts.map(p => (<button key={p.id} onClick={() => handleStarterPromptClick(p.text)} className="chat-starter-prompt-button" disabled={isLoading || p.disabled} title={p.disabled && p.id === 'explain_selected' ? "Select a node first" : undefined}>{p.text}</button>))}</div>
      <div className="chat-options-area">
          <label htmlFor="internet-access-checkbox" className="chat-options-label">
              <input type="checkbox" id="internet-access-checkbox" checked={allowInternetAccess} onChange={(e) => onAllowInternetAccessChange(e.target.checked)} disabled={isLoading}/> Allow internet access for broader context
          </label>
      </div>
      <div className="chat-input-area">
        <input ref={inputRef} type="text" className="chat-input-field" placeholder="Ask something about the map..." value={inputValue} onChange={onInputChange} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()} disabled={isLoading}/>
        <button onClick={handleSend} className="button-primary chat-send-button" disabled={isLoading || !inputValue.trim()}>Send</button>
      </div>
    </div>
  );
};
export default ChatPanel;