/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import JSZip from 'jszip';

export interface ObsidianNodeData {
  id: string;
  originalTitle: string; // Full title before sanitization, used for [[wikilinks]]
  description: string;
  tags?: string[];       // Will be empty for now
  aliases?: string[];    // Will be empty for now
  outgoingLinks: { targetOriginalTitle: string }[]; // Links to original titles of target nodes
}

export function sanitizeFilename(title: string): string {
  if (!title) {
    return 'Untitled_Note';
  }
  // Remove or replace invalid filesystem characters: / \ : * ? " < > |
  // Replace with an underscore.
  let sanitized = title.replace(/[\/\\:*?"<>|]/g, '_');
  // Remove leading/trailing whitespace
  sanitized = sanitized.trim();
  // Reduce multiple consecutive underscores to a single one
  sanitized = sanitized.replace(/__+/g, '_');
  // Ensure filename is not empty after sanitization
  if (!sanitized) {
    return 'Untitled_Note';
  }
  // Limit length (optional, but good practice)
  // const maxLength = 100;
  // if (sanitized.length > maxLength) {
  //   sanitized = sanitized.substring(0, maxLength);
  // }
  return sanitized;
}

export function generateMarkdownContent(nodeData: ObsidianNodeData): string {
  const frontmatterParts: string[] = [];
  frontmatterParts.push(`title: ${nodeData.originalTitle}`);

  if (nodeData.tags && nodeData.tags.length > 0) {
    frontmatterParts.push('tags:');
    nodeData.tags.forEach(tag => frontmatterParts.push(`  - ${tag}`));
  }

  if (nodeData.aliases && nodeData.aliases.length > 0) {
    frontmatterParts.push('aliases:');
    nodeData.aliases.forEach(alias => frontmatterParts.push(`  - ${alias}`));
  }

  const frontmatter = `---
${frontmatterParts.join('\n')}
---`;

  let body = nodeData.description || ''; // Use description or empty string

  if (nodeData.outgoingLinks && nodeData.outgoingLinks.length > 0) {
    if (body.length > 0) {
        body += '\n\n'; // Add blank line only if description exists
    } else {
        // If description is empty, we might not need two newlines before links,
        // but for consistency and clear separation, one blank line is good.
        body += '\n';
    }
    const linksMarkdown = nodeData.outgoingLinks
      .map(link => `- [[${link.targetOriginalTitle}]]`)
      .join('\n');
    body += linksMarkdown;
  }

  return `${frontmatter}\n${body}`;
}

export async function createObsidianZip(nodesData: ObsidianNodeData[]): Promise<Blob> {
  const zip = new JSZip();

  nodesData.forEach(node => {
    const filename = `${sanitizeFilename(node.originalTitle)}.md`;
    const markdownContent = generateMarkdownContent(node);
    zip.file(filename, markdownContent);
  });

  return zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
