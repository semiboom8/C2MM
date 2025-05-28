/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import {
  Content,
  FinishReason,
  GenerateContentConfig,
  GenerateContentParameters,
  GenerateContentResponse,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Part,
  SafetySetting,
  Tool,
} from '@google/genai';

// API_KEY is expected to be set in the environment by the MakerSuite proxy
const GEMINI_API_KEY = process.env.API_KEY;

interface GenerateTextOptions {
  prompt: string;
  videoUrl?: string;
  temperature?: number;
  safetySettings?: SafetySetting[];
  responseMimeType?: "text/plain" | "application/json";
  tools?: Tool[]; // Added for tools like Google Search
}

export interface GenerateTextApiOutput {
    text: string;
    groundingSources?: { uri: string; title: string; }[];
}


/**
 * Generate content using the Gemini API, optionally including video data.
 *
 * @param options - Configuration options for the generation request.
 * @returns The response text from the Gemini API.
 */
export async function generateText(
  options: GenerateTextOptions,
): Promise<GenerateTextApiOutput> {
  const {
    prompt,
    videoUrl,
    temperature = 0.7,
    responseMimeType = "text/plain",
    tools,
  } = options;

  if (!GEMINI_API_KEY) {
    console.error('Gemini API key is missing. Make sure it is set in the environment variables.');
    throw new Error('Gemini API key is missing or empty. Please set API_KEY environment variable.');
  }

  const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
  const modelName = 'gemini-2.5-flash-preview-04-17';

  const parts: Part[] = [{text: prompt}];

  if (videoUrl) {
    try {
      parts.push({
        fileData: {
          fileUri: videoUrl,
        },
      });
    } catch (error) {
      console.error('Error processing video input:', error);
      throw new Error(`Failed to process video input from URL: ${videoUrl}`);
    }
  }

  const isGoogleSearchEnabled = tools?.some(tool => tool.googleSearch);

  const generationConfig: GenerateContentConfig = {
    temperature,
    // IMPORTANT: Do not set responseMimeType to "application/json" if Google Search is enabled.
    ...(responseMimeType === "application/json" && !isGoogleSearchEnabled && { responseMimeType }),
  };
  

  const request: GenerateContentParameters = {
    model: modelName,
    contents: [{role: 'user', parts}],
    config: generationConfig,
    ...(tools && { tools }), // Add tools if provided
  };

  try {
    const genAiResponse: GenerateContentResponse = await ai.models.generateContent(request);

    if (genAiResponse.promptFeedback?.blockReason) {
      throw new Error(
        `Content generation failed: Prompt blocked (reason: ${genAiResponse.promptFeedback.blockReason})`,
      );
    }

    if (!genAiResponse.candidates || genAiResponse.candidates.length === 0) {
      const blockReason = genAiResponse.promptFeedback?.blockReason;
      const safetyRatings = genAiResponse.promptFeedback?.safetyRatings;
      console.error('Content generation failed: No candidates. Prompt Feedback:', genAiResponse.promptFeedback);
      let errorMsg = 'Content generation failed: No candidates returned.';
      if (blockReason) {
        errorMsg += ` Block Reason: ${blockReason}.`;
      }
      if (safetyRatings && safetyRatings.length > 0) {
        errorMsg += ` Safety Ratings: ${safetyRatings.map(r => `${r.category}: ${r.probability}`).join(', ')}.`;
      }
      throw new Error(errorMsg);
    }

    const firstCandidate = genAiResponse.candidates[0];

    if (
      firstCandidate.finishReason &&
      firstCandidate.finishReason !== FinishReason.STOP &&
      firstCandidate.finishReason !== FinishReason.MAX_TOKENS
    ) {
      if (firstCandidate.finishReason === FinishReason.SAFETY) {
         const safetyRatings = firstCandidate.safetyRatings;
         let safetyMessage = 'Response blocked due to safety settings.';
         if (safetyRatings && safetyRatings.length > 0) {
            safetyMessage += ` Details: ${safetyRatings.map(r => `${r.category} was ${r.probability}`).join(', ')}`;
         }
        throw new Error(
          `Content generation failed: ${safetyMessage}`,
        );
      } else {
        throw new Error(
          `Content generation failed: Stopped due to ${firstCandidate.finishReason}.`,
        );
      }
    }
    
    const responseText = genAiResponse.text;
    if (typeof responseText !== 'string') {
        console.error('Unexpected API response format. Expected text field to be a string.', genAiResponse);
        throw new Error('API returned an unexpected response format.');
    }

    let groundingSourcesData: { uri: string; title: string; }[] | undefined = undefined;
    if (isGoogleSearchEnabled && firstCandidate.groundingMetadata?.groundingChunks) {
        groundingSourcesData = firstCandidate.groundingMetadata.groundingChunks
            .map(chunk => chunk.web)
            .filter(webChunk => webChunk && webChunk.uri) // Ensure webChunk and uri exist
            .map(webChunk => ({
                uri: webChunk!.uri!, // Assert non-null as we filtered
                title: webChunk!.title || webChunk!.uri! // Use title or URI if title is missing
            }));
    }

    return {
        text: responseText,
        groundingSources: groundingSourcesData,
    };

  } catch (error) {
    console.error(
      'An error occurred during Gemini API call or response processing:',
      error,
    );
    if (error instanceof Error) {
        if (error.message.includes("Proxying failed") || ((error as any).cause)?.message?.includes("ReadableStream")) {
            throw new Error(`Proxying video content failed. This can sometimes happen on certain networks or mobile devices. Details: ${error.message}`);
        }
        throw error;
    }
    throw new Error('An unexpected error occurred while generating content.');
  }
}