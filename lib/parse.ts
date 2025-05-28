/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

export const parseJSON = (str: string): any => {
  let jsonStr = str.trim();
  // Regex to find ```json ... ``` or ``` ... ```
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);

  if (match && match[2]) {
    // If a fenced code block is found, use its content
    jsonStr = match[2].trim();
  }

  // Attempt to fix cases where a junk word appears after a string value 
  // and before the next object in an array, disrupting the structure.
  // e.g., "...some string value" JunkWord { ...next object...
  // This should become: "...some string value"}, { ...next object...
  // Regex breakdown:
  // (")                     : $1 - Matches and captures the closing quote of a string value.
  // \s*                     : Matches any whitespace.
  // ([A-Za-z][A-Za-z0-9]*)  : $2 - Matches and captures a "junk word" (starts with a letter,
  //                           followed by zero or more alphanumeric characters).
  // \s*                     : Matches any whitespace.
  // (\{)                    : $3 - Matches and captures the opening curly brace of the next object.
  const stringJunkObjectRegex = /(")\s*([A-Za-z][A-Za-z0-9]*)\s*(\{)/g;
  if (stringJunkObjectRegex.test(jsonStr)) {
    console.warn("Attempting to correct potential junk word between JSON elements.");
    jsonStr = jsonStr.replace(stringJunkObjectRegex, (originalMatch, p1_quote, p2_junk, p3_brace) => {
      console.warn(`Corrected junk: '${p2_junk.trim()}' found after a string value and before an opening brace. Replacing with '"}, {'`);
      // The replacement ensures the current object (ending with p1_quote) is properly closed with '}',
      // a comma is added for array separation, and the next object starts with p3_brace.
      return `${p1_quote}},\n${p3_brace}`;
    });
  }


  // Check if it's NOT a well-formed array AND NOT a well-formed object
  // before trying to extract a substring that assumes it's an object.
  // This prevents mutilating correctly formatted arrays.
  if ( !(jsonStr.startsWith('[') && jsonStr.endsWith(']')) && 
       !(jsonStr.startsWith('{') && jsonStr.endsWith('}')) ) {
    // This fallback is for cases where the AI might embed a JSON object
    // within other text that wasn't caught by fence stripping.
    // It primarily tries to rescue an object.
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}') + 1;
    if (start !== -1 && end !== 0 && end > start) {
      jsonStr = jsonStr.substring(start, end);
    }
    // If it wasn't an object structure found by the above, and not an array,
    // we will let JSON.parse attempt on the jsonStr as is and potentially throw.
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON string:", `>>>${jsonStr}<<<`, "Original string (input to parseJSON):", `>>>${str}<<<`, "Error:", e);
    // Provide a more informative error message for debugging.
    let preview = jsonStr.length > 200 ? jsonStr.substring(0, 200) + "..." : jsonStr;
    throw new Error(`Invalid JSON response from API after attempting to clean it. Content preview: ${preview}. Original error: ${e.message}`);
  }
};