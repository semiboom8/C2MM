/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import { MindMapComplexity, MindMapType, ChatMessage, SpecificExplanationType } from "./types";

// Renamed from getMindMapFromVideoPrompt to be more generic
export const getMindMapFromContentPrompt = (complexity: MindMapComplexity, mindMapType: MindMapType, isObsidianStyleFromCheckbox: boolean): string => {
  let complexityInstructions = "";
  let nodeCountSuggestion = "Max 10-15 nodes for overall clarity unless the source material is very complex.";
  let contentInstructions = "";
  let exampleNodeExtension = "";
  let exampleEdgeExtension = "";
  let finalMindMapTypeStringForDisplay = mindMapType.replace(/_/g, ' ');

  let promptPrefix = "";
  if (isObsidianStyleFromCheckbox) {
    promptPrefix = `Render this as an Obsidian knowledge graph (networked nodes, personal knowledge graph style). Nodes can be sized based on their perceived importance or number of connections; include a "value" field (integer 1-10, default 3 if unsure) for each node to suggest this. Higher value means more important/connected. Edges should generally not have arrows. Prefer "dot" or "circle" shapes for nodes. `;
  }

  switch (complexity) {
    case 'simple':
      complexityInstructions = "Focus on 2-4 main ideas and their most direct sub-points. Keep the mind map concise and easy to grasp at a glance.";
      nodeCountSuggestion = "Aim for a low node count, e.g., 5-8 nodes.";
      break;
    case 'detailed':
      complexityInstructions = "Provide a comprehensive breakdown of the source material's content. Include more sub-points and finer details explicitly mentioned, ensuring a thorough representation.";
      nodeCountSuggestion = "Aim for a richer map, e.g., 10-20 nodes if the content supports it, but prioritize clarity over sheer quantity.";
      break;
    case 'extended':
      complexityInstructions = "Generate a detailed mind map of the source material's content as per the 'detailed' complexity. Additionally, identify and include 2-4 related concepts or topics for further research that are NOT explicitly mentioned but are logically connected to its themes. These research nodes should be clearly distinguishable: assign them to a group named 'research' and prefix their labels with 'Research: '.";
      nodeCountSuggestion = "Aim for 12-25 nodes, including the research suggestions. Ensure research nodes are distinct.";
      break;
    case 'auto':
    default:
      complexityInstructions = "Determine the optimal level of detail for the mind map based on the source material's content. Aim for a balance between comprehensiveness and clarity, creating a useful overview for learning.";
      break;
  }

  switch (mindMapType) {
    case 'tutorial':
      contentInstructions = "Structure the mind map as a step-by-step tutorial or procedural guide. Main nodes should represent major steps or stages, and sub-nodes should detail sub-steps, required materials, or important considerations for each stage. The flow should be logical and sequential.";
      exampleNodeExtension = ` { "id": "step_2_detail_B", "label": "Detail for Step 2", "group": "detail", "shape": "${isObsidianStyleFromCheckbox ? 'dot' : 'text'}", "title": "More info on this part of Step 2."${isObsidianStyleFromCheckbox ? ', "value": 3' : ''} }`;
      exampleEdgeExtension = ` { "from": "step_2_main", "to": "step_2_detail_B", ${isObsidianStyleFromCheckbox ? '"label": "sub-step"' : '"arrows": "to", "label": "details"'} }`;
      break;
    case 'concept_deep_dive':
      contentInstructions = "Focus on a single core concept or a few tightly related core concepts presented in the source material. The central node(s) should be these concept(s). Branch out to explain definitions, key characteristics, examples, applications, implications, and related sub-concepts in detail to provide a thorough understanding.";
      exampleNodeExtension = ` { "id": "characteristic_X", "label": "Characteristic X", "group": "detail", "shape": "${isObsidianStyleFromCheckbox ? 'dot' : 'text'}", "title": "Explanation of Characteristic X."${isObsidianStyleFromCheckbox ? ', "value": 4' : ''} }`;
      exampleEdgeExtension = ` { "from": "core_concept_main", "to": "characteristic_X", ${isObsidianStyleFromCheckbox ? '"label": "has characteristic"' : '"arrows": "to", "label": "defines"'} }`;
      break;
    case 'pros_and_cons':
      contentInstructions = "Analyze the source material for topics involving advantages and disadvantages, or arguments for and against a particular subject. The mind map should clearly delineate these. A central node might introduce the subject, with main branches for 'Pros' (or 'Advantages') and 'Cons' (or 'Disadvantages'), listing specific points under each.";
      exampleNodeExtension = ` { "id": "pro_point_1", "label": "Advantage 1", "group": "main", "shape": "${isObsidianStyleFromCheckbox ? 'dot' : 'box'}", "title": "Specific advantage explained."${isObsidianStyleFromCheckbox ? ', "value": 5' : ''} }`;
      exampleEdgeExtension = ` { "from": "pros_branch", "to": "pro_point_1", ${isObsidianStyleFromCheckbox ? '"label": "is a pro"' : '"arrows": "to", "label": "point"'} }`;
      break;
    case 'comparison':
      contentInstructions = "If the source material compares two or more items, ideas, or theories, structure the mind map to highlight this comparison. A central node could be 'Comparison of X and Y'. Branches could represent each item being compared, with sub-nodes detailing attributes, features, or criteria used for comparison, showing how each item fares.";
      exampleNodeExtension = ` { "id": "item_A_feature_1", "label": "Feature 1 of Item A", "group": "detail", "shape": "${isObsidianStyleFromCheckbox ? 'dot' : 'text'}", "title": "Detail about Feature 1 of Item A."${isObsidianStyleFromCheckbox ? ', "value": 3' : ''} }`;
      exampleEdgeExtension = ` { "from": "item_A_branch", "to": "item_A_feature_1", ${isObsidianStyleFromCheckbox ? '"label": "has feature"' : '"arrows": "to", "label": "feature"'} }`;
      break;
    // Historical type is handled by a separate prompt function
    case 'auto':
    default:
      finalMindMapTypeStringForDisplay = "Auto (Default)";
      contentInstructions = "Analyze the source material's content and determine the most appropriate and effective mind map structure to represent its information for learning and understanding. This might involve a general hierarchical breakdown or another suitable organization based on the content's nature.";
      exampleNodeExtension = ` { "id": "detail_B", "label": "Detail B", "group": "detail", "shape": "${isObsidianStyleFromCheckbox ? 'dot' : 'text'}", "title": "More info on Detail B."${isObsidianStyleFromCheckbox ? ', "value": 2' : ''} }`;
      exampleEdgeExtension = ` { "from": "key_concept_A", "to": "detail_B", ${isObsidianStyleFromCheckbox ? '"label": "related to"' : '"arrows": "to", "label": "explains"'} }`;
      break;
  }

  if (complexity === 'extended') {
    const researchNodeShape = 'star';
    exampleNodeExtension += `, { "id": "research_topic_X", "label": "Research: Advanced Topic X", "group": "research", "shape": "${researchNodeShape}", "title": "Explore Advanced Topic X for deeper understanding."${isObsidianStyleFromCheckbox ? ', "value": 5' : ''} }`;
    exampleEdgeExtension += `, { "from": "key_concept_A", "to": "research_topic_X", ${isObsidianStyleFromCheckbox ? '"label": "research idea"' : '"arrows": "to", "label": "related research"'} }`;
  }


  return `${promptPrefix}You are an expert in analyzing content (from video or text) and structuring its key information into a visual graph.
The goal is to create a representation of the main topics and their relationships from the provided source material, suitable for learning and further research.

Analyze the provided content and generate a graph based on the following guidelines:
Mind Map Content Type: ${finalMindMapTypeStringForDisplay}
${contentInstructions}

Complexity Level: ${complexity}
${complexityInstructions}
${nodeCountSuggestion}

The output MUST be a valid JSON object containing two main keys: "nodes" and "edges".

"nodes": An array of objects, where each object represents a node.
Each node object MUST have:
  - "id": A unique STRING identifier (e.g., "node_1", "center_topic", "research_topic_A"). Consider using semantic prefixes like "main_", "detail_", "concept_".
  - "label": A concise text label for the node (max 5-7 words for readability, 'Research:' prefix for extended research nodes if applicable). Placeholder IDs like "Node123" are highly discouraged; create descriptive labels.
  - "group": (Optional, but recommended) A string to categorize nodes. Common groups: "center", "main", "detail", "research".
  - "title": (Optional) A slightly more descriptive text that can appear as a tooltip (1-2 sentences explaining the node). This should be different from the label if used.
  - "shape": (Optional) If Obsidian style, prefer "dot". Otherwise: "ellipse" for 'center', 'box' for 'main', 'text' for 'detail', 'star' for 'research'.
  - "value": (Optional, integer) If Obsidian style, provide a value (1-10, default 3) reflecting node importance/connectivity.

"edges": An array of objects, where each object represents a connection (edge) between two nodes.
Each edge object MUST have:
  - "from": The "id" (string) of the source node.
  - "to": The "id" (string) of the target node.
  - "label": (Optional) A very short label for the edge if it clarifies the relationship (e.g., "explains", "example", "leads to"). Max 1-2 words.
  - "arrows": (Optional) If Obsidian style, omit arrows or set to empty string. Otherwise, use "to".

Prioritize identifying:
1.  The central theme(s) or core message(s) of the source material.
2.  Key concepts, arguments, or sections discussed.
3.  Supporting details, examples, or sub-points.
4.  If 'extended' complexity, suggest distinct research topics.

Ensure the graph is well-structured, logical, and easy to understand.
Node labels should be succinct and descriptive. Avoid generic placeholder IDs in labels.

Example JSON structure (illustrative, adapt based on type/complexity/style):
{
  "nodes": [
    { "id": "content_main_idea_1", "label": "Content Main Idea", "group": "center", "shape": "ellipse", "title": "This is the central theme of the content."${isObsidianStyleFromCheckbox ? ', "value": 10' : ''} },
    { "id": "key_concept_A", "label": "Key Concept A", "group": "main", "shape": "${isObsidianStyleFromCheckbox ? 'dot' : 'box'}", "title": "Detailed explanation of Key Concept A."${isObsidianStyleFromCheckbox ? ', "value": 7' : ''} }
    ${exampleNodeExtension ? `,${exampleNodeExtension}` : ""}
  ],
  "edges": [
    { "from": "content_main_idea_1", "to": "key_concept_A"${isObsidianStyleFromCheckbox ? '' : ', "arrows": "to", "label": "introduces"'} }
    ${exampleEdgeExtension ? `,${exampleEdgeExtension}` : ""}
  ]
}

Provide ONLY the JSON object in your response, without any surrounding text or markdown fences.
If processing a text transcript, the transcript content will be appended to this prompt. Analyze that appended text.
`;
};
export const getMindMapFromVideoPrompt = getMindMapFromContentPrompt; // Alias for backward compatibility if anything still uses it


export const getHistoricalMapPrompt = (complexity: MindMapComplexity, isObsidianStyleFromCheckbox: boolean): string => {
  let complexityInstructions = "";
  let nodeCountSuggestion = "Aim for 10-20 key events/figures. Focus on chronological significance.";

  switch (complexity) {
    case 'simple':
      complexityInstructions = "Identify 5-10 major historical events, figures, or periods mentioned in the source material. Focus on the most significant elements for a basic timeline.";
      nodeCountSuggestion = "Aim for a low node count, e.g., 5-10 nodes.";
      break;
    case 'detailed':
      complexityInstructions = "Provide a comprehensive timeline of events, figures, and periods discussed in the source material. Include important sub-events or related details with their respective dates.";
      nodeCountSuggestion = "Aim for 15-25 nodes if the content supports it, ensuring chronological accuracy.";
      break;
    case 'extended':
      complexityInstructions = "Generate a detailed timeline as per 'detailed' complexity. Additionally, identify 2-3 broader historical contexts or related long-term developments that these events contributed to or were part of. These contextual nodes might not have specific single dates but represent spans or concepts.";
      nodeCountSuggestion = "Aim for 18-30 nodes, including contextual elements.";
      break;
    case 'auto':
    default:
      complexityInstructions = "Determine the optimal level of detail for the historical timeline based on the source material's content. Create a clear and informative chronological representation of key historical elements.";
      break;
  }

  let promptPrefix = "";
  if (isObsidianStyleFromCheckbox) {
    promptPrefix = `Render this as an Obsidian-style knowledge graph where nodes represent historical events/figures. Nodes can be sized based on perceived importance (include "value": 1-10). Edges show relationships or sequence. `;
  }


  return `${promptPrefix}You are an expert in analyzing content (from video or text) to extract historical information and structure it as a chronological timeline graph.

The goal is to represent historical events, figures, and periods from the source material in a timeline format.
Mind Map Content Type: Historical Timeline
${complexityInstructions}
${nodeCountSuggestion}

The output MUST be a valid JSON object containing "nodes" and "edges".

"nodes": An array of objects. Each node object represents a historical event, figure, or period and MUST have:
  - "id": A unique STRING identifier (e.g., "event_1776", "figure_napoleon").
  - "label": Concise label (max 5-7 words, e.g., "Declaration of Independence", "Napoleon Bonaparte").
  - "title": (Optional) More descriptive tooltip (1-2 sentences).
  - "date": CRITICAL - A machine-readable date string. Prioritize "YYYY-MM-DD". If day/month unknown, use "YYYY-MM" or "YYYY". For periods, use start date.
  - "era": (Optional) A string for the historical era (e.g., "Renaissance", "World War II", "Industrial Revolution").
  - "group": (Optional) Suggest "historical_event" or "historical_figure". If 'extended' complexity, broader contexts can be "historical_context".
  - "shape": (Optional) If Obsidian style, prefer "dot". Otherwise, "box" for events, "ellipse" for figures.
  - "value": (Optional, integer 1-10) If Obsidian style, reflects importance.

"edges": An array of objects. Each edge connects two nodes.
  - "from": The "id" of the source node.
  - "to": The "id" of the target node.
  - "label": (Optional) Short label for relationship (e.g., "precedes", "influences", "part of").
  - "arrows": "to" (to show direction/sequence).

Prioritize:
1. Accurate extraction of historical events/figures and their names.
2. Finding a plausible DATE for each. This is crucial for timeline layout.
3. Identifying an ERA or period if applicable.
4. Logical connections between events if explicitly mentioned or clearly implied.

Example JSON:
{
  "nodes": [
    { "id": "event_1776_declar", "label": "Declaration Signed", "date": "1776-07-04", "era": "American Revolution", "group": "historical_event", "title": "The Second Continental Congress signed the Declaration of Independence."${isObsidianStyleFromCheckbox ? ', "value": 8' : ''} },
    { "id": "figure_jefferson", "label": "Thomas Jefferson", "date": "1743", "era": "Enlightenment", "group": "historical_figure", "title": "Primary author of the Declaration."${isObsidianStyleFromCheckbox ? ', "value": 7' : ''} },
    { "id": "context_independence_mov", "label": "Independence Movement", "date": "1765", "era": "Colonial America", "group": "historical_context", "title": "Growing sentiment for independence from Great Britain."${isObsidianStyleFromCheckbox ? ', "value": 6' : ''} }
  ],
  "edges": [
    { "from": "context_independence_mov", "to": "event_1776_declar", "label": "led to", "arrows": "to" },
    { "from": "figure_jefferson", "to": "event_1776_declar", "label": "authored", "arrows": "to" }
  ]
}

Provide ONLY the JSON object, no surrounding text/markdown.
If processing a text transcript, the transcript content will be appended to this prompt. Analyze that appended text.
`;
};


export const getElaborateNodePrompt = (selectedNodeLabel: string, currentMapThemes: string): string => {
  let contextInfo = currentMapThemes ? `The selected node ("${selectedNodeLabel}") is part of a mind map with themes: [${currentMapThemes}]. New elaborations should complement these.` : `The selected node is "${selectedNodeLabel}".`;
  return `You are an AI assistant expanding a mind map node.
Node: "${selectedNodeLabel}". ${contextInfo}
Generate 2-3 distinct concepts or details elaborating on "${selectedNodeLabel}", suitable as new child nodes.
Response MUST be a VALID JSON array of objects. Each object needs:
  - "label": Concise label for the new elaboration (max 5-7 words).
  - "title": (Optional) Descriptive tooltip (1-2 sentences).
  - "relationshipLabel": Short label (1-3 words) for the edge to "${selectedNodeLabel}" (e.g., "explains", "example", "supports").
Example:
[
  { "label": "Specific Aspect 1", "title": "Explains aspect 1 of ${selectedNodeLabel}.", "relationshipLabel": "details" },
  { "label": "Related Sub-topic", "relationshipLabel": "sub-topic of" }
]
ONLY the JSON array, no surrounding text.`;
};

export const getExplainNodePrompt = (selectedNodeLabel: string, currentMapThemes: string): string => {
  let contextInfo = currentMapThemes ? `Node "${selectedNodeLabel}" is in a mind map with themes: [${currentMapThemes}]. Explanation should fit this context.` : `Node is "${selectedNodeLabel}".`;
  return `You are an AI assistant simplifying a mind map concept.
Node: "${selectedNodeLabel}". ${contextInfo}
Generate a SINGLE, clear, concise explanation for "${selectedNodeLabel}", suitable as a new child node clarifying the parent.
Response MUST be a VALID JSON object (NOT an array) with:
  - "label": Concise explanation label (max 7-10 words).
  - "title": (Optional) Descriptive tooltip (1-2 sentences).
  - "relationshipLabel": Short edge label to "${selectedNodeLabel}" (e.g., "explains", "clarifies", "is").
Example:
{
  "label": "Simpler Meaning of Topic",
  "title": "This is what '${selectedNodeLabel}' means in easier terms.",
  "relationshipLabel": "explains"
}
ONLY the JSON object, no surrounding text.`;
};

export const getExplainNodePromptSpecific = (selectedNodeLabel: string, currentMapThemes: string, explainType: SpecificExplanationType): string => {
  const contextInfo = currentMapThemes ? `The selected node ("${selectedNodeLabel}") is part of a mind map with themes: [${currentMapThemes}]. New explanation should complement these.` : `The selected node is "${selectedNodeLabel}".`;
  let questionFocus = "";
  let relationshipExample = `explains ${explainType}`;

  switch (explainType) {
    case 'what':
      questionFocus = `Explain WHAT "${selectedNodeLabel}" is or means. Focus on its definition, nature, or core identity.`;
      relationshipExample = "defines";
      break;
    case 'who':
      questionFocus = `Explain WHO is associated with, responsible for, or relevant to "${selectedNodeLabel}". This could be individuals, groups, or entities.`;
      relationshipExample = "involves";
      break;
    case 'when':
      questionFocus = `Explain WHEN "${selectedNodeLabel}" occurred, is relevant, or takes place. Focus on the timing or temporal context.`;
      relationshipExample = "timing of";
      break;
    case 'why':
      questionFocus = `Explain WHY "${selectedNodeLabel}" is important, occurs, or exists. Focus on reasons, purposes, or significance.`;
      relationshipExample = "reason for";
      break;
    case 'how':
      questionFocus = `Explain HOW "${selectedNodeLabel}" works, functions, or is achieved. Focus on the process, method, or mechanism.`;
      relationshipExample = "mechanism of";
      break;
  }

  return `You are an AI assistant tasked with clarifying a specific aspect of a mind map concept.
The node to explain is: "${selectedNodeLabel}".
${contextInfo}

Your specific task is to: ${questionFocus}
The explanation should be suitable as a new child node connected to "${selectedNodeLabel}".

The response MUST be a VALID JSON object (NOT an array). This object must contain the following keys:
  - "label": A concise text label for the new explanation node (max 7-10 words). This label should directly address the "${explainType}" aspect.
  - "title": (Optional) A slightly more descriptive text that can appear as a tooltip (1-2 sentences), further detailing the explanation.
  - "relationshipLabel": A very short label for the edge that will connect from "${selectedNodeLabel}" to this new explanation node (e.g., "${relationshipExample}", "details ${explainType}", "${explainType} aspect"). Max 1-3 words.

Example JSON structure (adapt the content based on the actual node and explainType):
{
  "label": "The ${explainType} of ${selectedNodeLabel}",
  "title": "This node explains the ${explainType} aspect of ${selectedNodeLabel}, focusing on [brief summary of explanation].",
  "relationshipLabel": "${relationshipExample}"
}

Provide ONLY the JSON object in your response, without any surrounding text or markdown fences.`;
};


export const getChatWithMapPrompt = (
    mapContext: string,
    chatHistory: ChatMessage[],
    userQuery: string,
    allowInternetAccess: boolean,
): string => {
    let historyString = "Conversation History (Recent):\n";
    if (chatHistory.length > 0) {
        chatHistory.slice(-6).forEach(msg => { historyString += `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}\n`; });
    } else {
        historyString += "No recent history.\n";
    }

    let internetAccessGuidance = "";
    if (allowInternetAccess) {
        internetAccessGuidance = `
You have internet access enabled.
If the user's query can be fully and accurately answered using ONLY the Mind Map Context provided, please prioritize that context.
However, if the query asks for information NOT explicitly present in the mind map, seeks broader definitions, requires deeper explanation of concepts mentioned, asks for related topics, or implies further research beyond the map's scope, you **SHOULD ACTIVELY USE your general knowledge and internet search capabilities** to provide a comprehensive and informative answer.
Do not just state that the information isn't in the map; try to find it externally if the query suggests this. Bold key terms in your response that are important named entities or concepts using double asterisks (e.g., **This is Bold**).`;
    } else {
        internetAccessGuidance = "You are in offline mode. Answer based ONLY on the provided Mind Map Context and Chat History. Do not use external knowledge or search the web. Bold key terms in your response using double asterisks (e.g., **This is Bold**).";
    }

    return `You are a helpful AI assistant for the "Chat with Your Map" feature. Your primary role is to answer questions about a mind map.
Be **concise and direct**. Use standard Markdown for emphasis: **bold important named entities or concepts** using double asterisks (e.g., **this is bold**). Avoid other complex Markdown.

Mind Map Context:
---
${mapContext}
---

${historyString}
${internetAccessGuidance}

Based on all the above, please answer the following user query:
User Query: "${userQuery}"
AI Response:
`;
};

export const getExpandMapNodePrompt = (
    parentNodeLabel: string,
    numSubNodes: number,
    currentMapContext: string,
    allowInternet: boolean
): string => {
    let internetGuidance = allowInternet
        ? "You can use your general knowledge and perform web searches if needed to find relevant and distinct sub-topics that are not explicitly in the current map context but are logically connected."
        : "Generate sub-topics based ONLY on the provided current map context and the parent node's theme. Do not use external knowledge.";

    return `You are an AI tasked with expanding a node in a mind map.
The parent node is labeled: "${parentNodeLabel}".
Current Mind Map Context:
---
${currentMapContext}
---

Your goal is to generate ${numSubNodes} distinct and relevant sub-nodes that further elaborate on or break down the concept of "${parentNodeLabel}". These sub-nodes should be suitable for adding as children to "${parentNodeLabel}".
${internetGuidance}

Avoid simple reformulations of the parent node label. Each sub-node should introduce a new aspect, detail, example, or related concept.
If suggesting research, prefix the label with "Research: ".

Provide your response as a VALID JSON array of objects. Each object represents a new sub-node and MUST have:
  - "label": A concise text label for the new sub-node (max 5-7 words). If it's a research idea, prefix with "Research: ".
  - "title": (Optional) A slightly more descriptive text for a tooltip (1-2 sentences).
  - "relationshipLabel": A short label (1-3 words) describing the relationship of this new sub-node to the parent node "${parentNodeLabel}" (e.g., "explores", "component of", "example", "leads to", "research idea").

Example for numSubNodes = 2:
[
  { "label": "Key Aspect of ${parentNodeLabel}", "title": "Details about a key aspect.", "relationshipLabel": "explores" },
  { "label": "Research: Future of ${parentNodeLabel}", "title": "Potential future developments related to ${parentNodeLabel}.", "relationshipLabel": "research idea" }
]

Provide ONLY the JSON array in your response, without any surrounding text or markdown fences.`;
};

export const getFindParentAndDefineEntityPrompt = (
    entityText: string,
    chatMessageContext: string,
    mindMapContext: string
): string => {
    return `You are an AI assistant helping to integrate information from a chat conversation into an existing mind map.
The user clicked on the term "**${entityText}**" from the following chat message context:
"${chatMessageContext}"

The current mind map contains the following nodes and relationships:
---
${mindMapContext}
---

Your tasks are:
1. Identify the **single most contextually relevant existing node label** from the mind map to serve as the parent for "**${entityText}**". If no existing node is a truly good parent, or if "${entityText}" seems like a root concept itself, return null for the parent label. Do not suggest creating new parent nodes.
2. Provide a concise definition or explanation for "**${entityText}**" itself. This definition will be used as the description for the new node.

Respond with a VALID JSON object with the following structure:
{
  "bestParentNodeLabel": "Label of the most relevant existing node OR null",
  "entityDefinition": "Concise definition/explanation of ${entityText}."
}

Example (if "${entityText}" is "Impressionism" and map has "Art Movements"):
{
  "bestParentNodeLabel": "Art Movements",
  "entityDefinition": "Impressionism is a 19th-century art movement characterized by relatively small, thin, yet visible brush strokes, open composition, emphasis on accurate depiction of light in its changing qualities."
}

Example (if "${entityText}" is "Existentialism" and it has no clear parent in the map):
{
  "bestParentNodeLabel": null,
  "entityDefinition": "Existentialism is a philosophical movement that emphasizes individual existence, freedom and choice."
}

Provide ONLY the JSON object. Do not include any markdown fences or other text.`;
};


export const getGiveExamplesPrompt = (selectedNodeLabel: string, currentMapThemes: string): string => {
  const contextInfo = currentMapThemes ? `The selected node ("${selectedNodeLabel}") is part of a mind map with themes: [${currentMapThemes}]. Examples should be relevant to these themes.` : `The selected node is "${selectedNodeLabel}".`;
  return `You are an AI assistant tasked with providing concrete examples for a mind map node.
Node: "${selectedNodeLabel}". ${contextInfo}
Generate 2-3 distinct, concrete examples that illustrate or clarify "${selectedNodeLabel}". These examples will become new child nodes.
Response MUST be a VALID JSON array of objects. Each object needs:
  - "label": Concise label for the example (max 5-7 words).
  - "title": (Optional) A slightly more descriptive tooltip (1-2 sentences) explaining the example.
  - "relationshipLabel": Short label for the edge from "${selectedNodeLabel}" to this example (e.g., "e.g.", "such as", "illustrates").
Example format:
[
  { "label": "Example A of ${selectedNodeLabel}", "title": "This is a concrete example of ${selectedNodeLabel}.", "relationshipLabel": "e.g." },
  { "label": "Example B", "relationshipLabel": "such as" }
]
Provide ONLY the JSON array in your response, without any surrounding text or markdown fences.`;
};

export const getElaborateProsPrompt = (selectedNodeLabel: string, currentMapThemes: string): string => {
  const contextInfo = currentMapThemes ? `The selected node ("${selectedNodeLabel}") is part of a mind map with themes: [${currentMapThemes}]. Pros should be relevant to this context.` : `The selected node is "${selectedNodeLabel}".`;
  return `You are an AI assistant tasked with elaborating on the positive aspects (pros) of a mind map node.
Node: "${selectedNodeLabel}". ${contextInfo}
Generate 2-3 distinct "pros" or advantages related to "${selectedNodeLabel}". These will become new child nodes.
Response MUST be a VALID JSON array of objects. Each object needs:
  - "label": Concise label for the pro (max 5-7 words, e.g., "Pro: Increased Efficiency").
  - "title": (Optional) A slightly more descriptive tooltip (1-2 sentences) explaining the advantage.
  - "relationshipLabel": Short label for the edge from "${selectedNodeLabel}" (e.g., "advantage", "benefit", "positive").
Example format:
[
  { "label": "Pro: Cost Savings", "title": "One advantage is potential cost savings.", "relationshipLabel": "pro" },
  { "label": "Benefit: Better User Experience", "relationshipLabel": "benefit" }
]
Provide ONLY the JSON array in your response, without any surrounding text or markdown fences.`;
};

export const getElaborateConsPrompt = (selectedNodeLabel: string, currentMapThemes: string): string => {
  const contextInfo = currentMapThemes ? `The selected node ("${selectedNodeLabel}") is part of a mind map with themes: [${currentMapThemes}]. Cons should be relevant to this context.` : `The selected node is "${selectedNodeLabel}".`;
  return `You are an AI assistant tasked with elaborating on the negative aspects (cons) of a mind map node.
Node: "${selectedNodeLabel}". ${contextInfo}
Generate 2-3 distinct "cons" or disadvantages related to "${selectedNodeLabel}". These will become new child nodes.
Response MUST be a VALID JSON array of objects. Each object needs:
  - "label": Concise label for the con (max 5-7 words, e.g., "Con: Higher Initial Cost").
  - "title": (Optional) A slightly more descriptive tooltip (1-2 sentences) explaining the disadvantage.
  - "relationshipLabel": Short label for the edge from "${selectedNodeLabel}" (e.g., "disadvantage", "drawback", "negative").
Example format:
[
  { "label": "Con: Complexity", "title": "A disadvantage is its inherent complexity.", "relationshipLabel": "con" },
  { "label": "Drawback: Steeper Learning Curve", "relationshipLabel": "drawback" }
]
Provide ONLY the JSON array in your response, without any surrounding text or markdown fences.`;
};

export const getAddNodeDescriptionPrompt = (nodeLabel: string, currentMapContext: string): string => {
  return `You are an AI assistant helping to enrich a mind map.
The task is to generate a concise description (tooltip) for the mind map node labeled: "${nodeLabel}".
This node exists within the following mind map context:
---
${currentMapContext}
---

The description should be a brief summary or definition of "${nodeLabel}", relevant to its context within the map. Aim for 1-2 clear sentences.

Respond with a VALID JSON object containing a single key "description".
Example:
{
  "description": "A concise and informative summary of ${nodeLabel} related to the map's themes."
}
Provide ONLY the JSON object, without any surrounding text or markdown fences.`;
};

export const getEnhanceNodeDescriptionPrompt = (originalDescription: string, nodeLabel: string): string => {
  return `You are an AI assistant tasked with enhancing the description of a mind map node.
The node is labeled: "${nodeLabel}".
The current description for this node is:
---
${originalDescription}
---

Your goal is to expand upon this existing description by adding concise, concrete details and removing any vague nuance.
Focus on providing supplementary information that adds specificity and depth.

The output should be ONLY the new, additional text that should be appended to the original description.
Do NOT repeat or include the original description in your response.
Aim for 1-3 sentences of purely supplementary, enhancing text.

For example, if the original description was "A type of fruit.", a good supplementary text might be "It is typically red or green, grows on trees, and is known for its crisp texture and sweet or tart taste. Common varieties include Gala and Granny Smith." (You would only output the second sentence part).

Provide ONLY the supplementary text to append. Do not use JSON or any other formatting. Just plain text.
`;
};

export const getParseContentForMergePrompt = (isObsidianStyle: boolean): string => {
  const obsidianValueNote = isObsidianStyle ? 'Include a "value" field (integer 1-5, default 2) for each node to suggest importance for Obsidian styling. ' : '';
  const obsidianArrowNote = isObsidianStyle ? 'Edges should generally not have arrows for Obsidian style. ' : 'Edges should have "arrows": "to". ';

  return `You are an AI tasked with parsing new content (text or from a YouTube URL) and structuring it as a set of nodes and edges for an existing mind map.
The goal is to generate a MindMapData structure representing the key topics and relationships from this new content.

Output MUST be a VALID JSON object: { "nodes": [], "edges": [] }.

"nodes": Array of objects. Each node MUST have:
  - "id": A unique STRING identifier (e.g., "merge_node_1", "new_topic_A"). Use a "merge_" prefix.
  - "label": Concise text label (max 5-7 words).
  - "title": (Optional) More descriptive tooltip (1-2 sentences).
  - "group": (This will be set by the application later, based on user choice, e.g., 'group_merged_default' or 'group_merged_alternate'. Do not set it here.)
  - "shape": (Optional) If Obsidian style, prefer "dot". Otherwise, "box" or "text".
  ${obsidianValueNote}

"edges": Array of objects. Each edge connects two nodes *within this newly parsed content*.
  - "from": The "id" of the source node (from this new content).
  - "to": The "id" of the target node (from this new content).
  - "label": (Optional) Short label for the relationship (e.g., "explains", "part of").
  ${obsidianArrowNote}

Identify key entities and their relationships within the new content. Ensure all node IDs are unique within this new set.
The application will handle integrating these into the existing map and connecting them based on a separate step.

Example JSON:
{
  "nodes": [
    { "id": "merge_concept_X", "label": "New Concept X", "title": "Explanation of New Concept X."${isObsidianStyle ? ', "value": 3, "shape": "dot"' : ', "shape": "box"'} },
    { "id": "merge_detail_Y", "label": "Detail Y of X", "title": "More info on Detail Y."${isObsidianStyle ? ', "value": 2, "shape": "dot"' : ', "shape": "text"'} }
  ],
  "edges": [
    { "from": "merge_concept_X", "to": "merge_detail_Y", "label": "includes"${isObsidianStyle ? '' : ', "arrows": "to"'} }
  ]
}

Provide ONLY the JSON object. Do not include any markdown fences or other text.
The content to parse will be appended to this prompt if it's text, or it's from a video URL provided externally.`;
};

export const getMergeConnectionsPrompt = (
  existingMapContext: string,
  newSubgraphNodes: Array<{ id: string; label: string; title?: string }>,
  newTopLevelNodeToConnect: { id: string; label: string; title?: string },
  existingRootNodeLabel: string | null
): string => {
  const newSubgraphContext = newSubgraphNodes.map(n => `- "${n.label}" (ID: ${n.id})${n.title ? `: ${n.title}` : ''}`).join('\n');
  const rootNodeHint = existingRootNodeLabel ? `The main root node of the existing map is labeled "${existingRootNodeLabel}". You can suggest connecting to this root by using "ROOT_NODE" as the target label.` : "There is no specific root node identified in the existing map, or it's not relevant for this new node.";

  return `You are an AI assistant determining how a new top-level node (from recently added content) should connect to an existing mind map.

Existing Mind Map Context:
---
${existingMapContext}
---

Newly Added Subgraph Content (this new node is part of this subgraph):
---
${newSubgraphContext}
---

The specific new top-level node to connect is:
- Label: "${newTopLevelNodeToConnect.label}"
- ID: "${newTopLevelNodeToConnect.id}"
- Description: "${newTopLevelNodeToConnect.title || 'No description provided.'}"

Your task:
1.  Analyze the new node ("${newTopLevelNodeToConnect.label}") in relation to the "Existing Mind Map Context".
2.  Determine the BEST connection point:
    a.  Connect to a specific existing node: Identify the label of the most relevant existing node.
    b.  Connect to the root node: If the new node is a broad, foundational topic related to the overall map, and ${existingRootNodeLabel ? `the root is "${existingRootNodeLabel}"` : `a root node exists`}.
    c.  No strong connection: If the new node doesn't clearly connect to any specific existing node or the root, and should remain as a top-level node within its own merged subgraph.
3.  Suggest a concise relationship label for this new connection (1-3 words, e.g., "related to", "expands on", "type of").

${rootNodeHint}

Respond with a VALID JSON object with the following structure:
{
  "connectToExistingNodeLabel": "Label of an existing node from the map OR 'ROOT_NODE' OR null",
  "relationshipLabel": "Concise relationship label for the new edge (e.g., 'expands on', 'type of')"
}

Examples:
If "${newTopLevelNodeToConnect.label}" should connect to an existing node "AI Applications":
{
  "connectToExistingNodeLabel": "AI Applications",
  "relationshipLabel": "example of"
}

If "${newTopLevelNodeToConnect.label}" is a broad topic and should connect to the root (e.g., root is "Technology Trends"):
{
  "connectToExistingNodeLabel": "ROOT_NODE",
  "relationshipLabel": "new trend"
}

If no clear connection:
{
  "connectToExistingNodeLabel": null,
  "relationshipLabel": "new section" // Or any generic label for a floating new top-level node
}

Provide ONLY the JSON object. No markdown fences or other text.`;
};

export const getMakeConnectionPrompt = (nodeLabels: string[]): string => {
  const labelsString = nodeLabels.map(label => `"${label}"`).join(', ');
  return `You are an AI assistant tasked with creating a conceptual link between multiple nodes in a mind map.
The user has selected the following nodes: ${labelsString}.

Your goal is to generate a concise and descriptive label for a NEW "connector" node that conceptually ties these selected topics together.
Also, provide a slightly more detailed title (tooltip) for this new connector node if appropriate.

The response MUST be a VALID JSON object with the following structure:
{
  "connectorNodeLabel": "A concise label (max 5-7 words) for the new connector node.",
  "connectorNodeTitle": "(Optional) A short description (1-2 sentences) for the new connector node's tooltip."
}

Examples:
If selected nodes are "Photosynthesis", "Cellular Respiration", "Krebs Cycle":
{
  "connectorNodeLabel": "Bioenergetic Processes",
  "connectorNodeTitle": "Key metabolic pathways involved in energy transformation in living organisms."
}

If selected nodes are "Machine Learning", "Big Data", "Cloud Computing":
{
  "connectorNodeLabel": "Modern Data Science Pillars",
  "connectorNodeTitle": "Core technologies and methodologies driving contemporary data science and AI."
}

If selected nodes are "Supply Chains", "Logistics", "Inventory Management":
{
  "connectorNodeLabel": "Operations Management Core",
  "connectorNodeTitle": "Fundamental components of managing business operations and product flow."
}

Provide ONLY the JSON object in your response. Do not include any surrounding text or markdown fences.`;
};
