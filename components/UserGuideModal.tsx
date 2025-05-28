/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import React from 'react';

interface UserGuideModalProps {
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  return (
    <div className="user-guide-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="user-guide-title">
      <div className="user-guide-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="user-guide-modal-header">
          <h2 id="user-guide-title" className="user-guide-modal-title">Quick User Guide</h2>
          <button onClick={onClose} className="user-guide-modal-close-button" aria-label="Close user guide">
            &times;
          </button>
        </div>
        <div className="user-guide-modal-body">
          <h3>Getting Started</h3>
          <ol>
            <li>
              <strong>Provide Content:</strong>
              <ul>
                <li><strong>Paste YouTube URL:</strong> Enter a YouTube video link in the main input field.</li>
                <li><strong>Upload Transcript:</strong> Click the "Upload .txt" button to select a plain text transcript file from your computer. The filename will appear in the input field.</li>
              </ul>
            </li>
            <li><strong>Generate Mind Map:</strong> Click the "Generate Mind Map" (or "Generate from Transcript") button to create your mind map.</li>
          </ol>

          <h3>Main Options (Left Panel)</h3>
          <ul>
            <li><strong>Obsidian Knowledge Graph Style (Checkbox):</strong><p>Toggles visuals & AI style between an Obsidian-like graph (dots, networked links, default) and a standard mind map (boxes, arrows).</p></li>
            <li>
              <strong>Mind Map Content Type (Dropdown):</strong>
              <p>Sets the theme for AI generation. Affects information structure. Options include:</p>
              <ul>
                <li><strong>Auto (Default):</strong> AI determines the best structure.</li>
                <li><strong>Tutorial / How-To:</strong> Structures map as steps.</li>
                <li><strong>Concept Deep Dive:</strong> Focuses on explaining a core concept.</li>
                <li><strong>Pros & Cons:</strong> Outlines advantages and disadvantages.</li>
                <li><strong>Comparison:</strong> Highlights differences and similarities.</li>
                <li><strong>Historical Timeline:</strong> Arranges events and figures chronologically based on AI-extracted dates. Useful for understanding historical sequences or developments over time. Physics are disabled for this layout.</li>
              </ul>
            </li>
            <li><strong>Mind Map Complexity (Dropdown):</strong><p>Controls map detail (Auto, Simple, Detailed, Extended Research). "Extended" adds related research topics.</p></li>
            <li><strong>Center Layout (Button):</strong><p>Fits the entire mind map within the current view.</p></li>
            <li><strong>Freeze/Unfreeze Layout (Button):</strong><p>Stops or starts automatic node movement (not applicable for Historical Timeline).</p></li>
            <li><strong>Elaborate Node (Button & Dropdown):</strong><p>Expands on the selected node. Choose from default elaboration, give examples, or elaborate pros/cons. Select a node, then click.</p></li>
            <li><strong>Explain Node (Button & Dropdown):</strong><p>Adds a child node to clarify the selected node. Choose default explanation or specify What, Who, When, Why, or How. Select a node, then click.</p></li>
            <li><strong>Save Map (Button):</strong><p>Downloads a PNG image of the current mind map view.</p></li>
            <li>
              <strong>Chat with Map (Button):</strong>
              <p>Opens a floating chat panel. Ask questions about the current mind map.
                <strong>Interactive Entities:</strong> Key terms identified by AI in responses are interactive:
                If a term is <strong>already on your map</strong>, it's <strong>yellow</strong> and non-clickable (tooltip: "Already on map").
                If a term is <strong>new</strong>, it's <strong>blue</strong>. Hover for "Click to add to map." Click to add it as a new node. The term turns <strong>yellow</strong> in chat after being added.
                Use the "Allow internet access" checkbox in chat for broader context.
              </p>
            </li>
             <li><strong>Show/Hide Creation Tools (Button):</strong><p>Toggles tools like "Create Flashcards from Map".</p></li>
            <li><strong>Show/Hide Examples (Button):</strong><p>Toggles a list of pre-made example mind maps you can load.</p></li>
            <li><strong>Show/Hide Advanced Settings (Button):</strong><p>Toggles advanced controls like visual adjustments and export options.</p></li>
          </ul>

          <h3>Advanced Settings (Visible when "Show Advanced Settings" is clicked)</h3>
          <p><em>Most visual sliders are active if "Obsidian Knowledge Graph Style" is checked.</em></p>
          <ul>
            <li><strong>Text Fade Threshold (Slider):</strong><p>Controls when node labels fade on zoom out (Obsidian style).</p></li>
            <li><strong>Node Size Multiplier (Slider):</strong><p>Adjusts overall node size.</p></li>
            <li><strong>Link Thickness Multiplier (Slider):</strong><p>Changes connection line thickness.</p></li>
            <li>
              <strong>Sub-nodes per Main Node (Input) & Expand Map (Button):</strong>
              <p>Set how many sub-nodes (default 3, range 1-5) to generate per main/top-level node. Click "Expand Map" to generate these sub-nodes, using map context and optionally external AI/web data (based on chat's internet access setting).</p>
            </li>
            <li><strong>Freeze/Unfreeze Node (Button):</strong><p>Fixes or unfixes the selected node's position on the canvas.</p></li>
            <li><strong>Export for Obsidian (Button):</strong><p>Downloads a .zip of Markdown notes for Obsidian. Requires Obsidian style and a generated map.</p></li>
          </ul>
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>Scroll for more if needed.</p>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
