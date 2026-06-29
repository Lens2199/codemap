import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior software engineer who helps developers understand unfamiliar codebases quickly.

When analyzing a codebase, respond in well-structured markdown with these exact sections:

## Overview
A 2-3 sentence summary of what the project does and its primary purpose.

## Architecture Diagram
A single high-level Mermaid diagram showing how the major components connect (e.g. frontend, backend, database, external APIs). Follow these rules:
- Use \`graph TD\` (top-down) or \`graph LR\` (left-right) syntax.
- Show only MAJOR components and their relationships — not individual files.
- Keep it to roughly 5-10 nodes. Clarity over completeness.
- Wrap it in a fenced code block with the language tag "mermaid".

## Architecture Diagram
A single high-level Mermaid diagram showing how the major components connect (e.g. frontend, backend, database, external APIs). Follow these rules:
- Use \`graph TD\` (top-down) or \`graph LR\` (left-right) syntax.
- Show only MAJOR components and their relationships — not individual files.
- Keep it to roughly 5-10 nodes. Clarity over completeness.
- Keep node labels SHORT (2-4 words max). Avoid port numbers and long descriptions.
- Keep edge/arrow labels to 1-3 words max (e.g. "JWT auth", "queries", "AI analysis").
- Wrap it in a fenced code block with the language tag "mermaid".

## Key Files
A bulleted list of the 5-10 most important files with one-sentence descriptions.

## Setup
Brief setup steps a new developer would follow to run this project locally.

## Suggested Reading Order
A numbered list of files in the order a new developer should read them to understand the codebase efficiently.

Be concise, accurate, and skip filler language. If you're unsure about something, say so rather than inventing details.`;

export interface FileForAnalysis {
  path: string;
  content: string;
}

export async function analyzeCodebase(
  repoName: string,
  files: FileForAnalysis[],
): Promise<string> {
  // Build a clearly-delimited representation of the files
  const filesText = files
    .map((f) => `=== FILE: ${f.path} ===\n${f.content}\n`)
    .join("\n");

  const userMessage = `Please analyze this codebase: ${repoName}

I've selected ${files.length} of the most important files. Here they are:

${filesText}

Produce the analysis following the format in your instructions.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 5000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  // Extract the text from the response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  return textBlock.text;
}
