import type { ExtractedAssignment } from "@/types";

/**
 * LLM-based extractor stub.
 *
 * CONTRACT — to implement, replace this function with:
 *   1. Read file text (reuse extractWithRules' text-reading logic)
 *   2. Call the LLM with a structured prompt:
 *
 *   PROMPT TEMPLATE:
 *   ```
 *   You are an academic assistant. Extract all assignments and deadlines from the
 *   following course document. Return a JSON array with this exact schema:
 *   [
 *     {
 *       "title": string,           // assignment name
 *       "dueDate": string,         // ISO 8601 date (YYYY-MM-DD)
 *       "description": string,     // optional, brief description
 *       "confidence": number,      // 0.0–1.0 how confident you are this is an assignment
 *       "tasks": [
 *         { "title": string, "estimatedMinutes": number, "orderIndex": number }
 *       ]
 *     }
 *   ]
 *   If there are no assignments, return [].
 *   Document text:
 *   ---
 *   {{TEXT}}
 *   ---
 *   ```
 *
 *   3. Parse the JSON response and return ExtractedAssignment[]
 *
 * INTEGRATION EXAMPLE (Anthropic SDK):
 *   import Anthropic from "@anthropic-ai/sdk";
 *   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 *   const msg = await client.messages.create({
 *     model: "claude-opus-4-6",
 *     max_tokens: 2048,
 *     messages: [{ role: "user", content: prompt }],
 *   });
 *   const json = JSON.parse((msg.content[0] as any).text);
 *   return json.map((item: any) => ({ ...item, dueDate: new Date(item.dueDate) }));
 */
export async function extractWithLLM(
  _storagePath: string,
  _filename: string
): Promise<ExtractedAssignment[]> {
  throw new Error(
    "LLM extraction not yet implemented. Set EXTRACTION_MODE=mock or EXTRACTION_MODE=rules."
  );
}
