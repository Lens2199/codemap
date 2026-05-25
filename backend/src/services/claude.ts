import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior software engineer who helps developers understand unfamiliar codebases quickly.

When analyzing a codebase, respond in well-structured markdown with these exact sections:

## Overview
A 2-3 sentence summary of what the project does and its primary purpose.

## Architecture
A short description of how the code is organized, including:
- Major folders and their roles
- Key files that tie things together
- Overall design patterns used

## Key Files
A bulleted list of the 5-10 most important files with one-sentence descriptions.

## Setup
Brief setup steps a new developer would follow to run this project locally.

## Suggested Reading Order
A numbered list of files in the order a new developer should read them to understand the codebase efficiently.

Be concise, accurate, and skip filler language. If you're unsure about something, say so rather than inventing details.`;

export interface FileForAnalysis{
    path: string;
    content: string;
}

export async function analyzeCodebase(
  repoName: string,
  files: FileForAnalysis[]
): Promise<string> {
  // Build a clearly-delimited representation of the files
  const filesText = files
    .map((f) => `=== FILE: ${f.path} ===\n${f.content}\n`)
    .join('\n');

  const userMessage = `Please analyze this codebase: ${repoName}

I've selected ${files.length} of the most important files. Here they are:

${filesText}

Produce the analysis following the format in your instructions.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  // Extract the text from the response
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content');
  }

  return textBlock.text;
}