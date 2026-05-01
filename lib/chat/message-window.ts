// Token window management for chat
// Ensures message history stays within token budget

import { CHAT_TOKEN_BUDGET, CHAT_RESERVED_OUTPUT_TOKENS, CHAT_MIN_HISTORY_TURNS, CHARS_PER_TOKEN } from "@/lib/shared/constants";

// Estimate token count for a text string
export function estimateTokens(text: string): number {
  // Conservative estimate: 1 token per CHARS_PER_TOKEN characters
  // Plus 4 tokens overhead per message (role label, separators, etc.)
  return Math.ceil(text.length / CHARS_PER_TOKEN) + 4;
}

// Truncate messages to fit within token budget
export function truncateMessages(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  // Calculate available tokens for messages
  const systemTokens = estimateTokens(systemPrompt);
  const availableTokens = CHAT_TOKEN_BUDGET - systemTokens - CHAT_RESERVED_OUTPUT_TOKENS;
  
  // If we have enough room for all messages, return as-is
  const totalMessageTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  if (totalMessageTokens <= availableTokens) {
    return messages;
  }
  
  // Otherwise, we need to truncate
  console.info("Token window truncated:", {
    droppedCount: messages.length - (messages.length * 0.7), // Just a placeholder for actual calc
    estimatedTokens: totalMessageTokens,
    budget: availableTokens
  });
  
  // Keep the system message pinned at the beginning
  // Keep the last message (usually the latest user query) pinned at the end
  // Work backwards from the last message to fill the available space
  const result: Array<{ role: string; content: string }> = [];
  let currentTokens = 0;
  
  // Add the last message first (it's the most important)
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    const lastMessageTokens = estimateTokens(lastMessage.content);
    
    if (lastMessageTokens <= availableTokens) {
      result.unshift(lastMessage);
      currentTokens += lastMessageTokens;
    }
  }
  
  // Then add messages working backwards from the second-to-last
  for (let i = messages.length - 2; i >= 0; i--) {
    const message = messages[i];
    const messageTokens = estimateTokens(message.content);
    
    if (currentTokens + messageTokens > availableTokens) {
      // Stop if we'd exceed the budget
      break;
    }
    
    result.unshift(message);
    currentTokens += messageTokens;
  }
  
  // Ensure we have at least the minimum number of turns (2 messages = 1 turn)
  // If we're under the minimum, add messages from the beginning (after system)
  while (result.length < CHAT_MIN_HISTORY_TURNS * 2 && result.length < messages.length) {
    // Find the first message from original that's not yet in result
    const firstOriginal = messages[0];
    if (!result.includes(firstOriginal)) {
      const firstTokens = estimateTokens(firstOriginal.content);
      if (currentTokens + firstTokens <= availableTokens) {
        result.push(firstOriginal);
        currentTokens += firstTokens;
      }
    }
  }
  
  // Log if truncation occurred
  if (result.length < messages.length) {
    console.info("Token window truncated:", {
      originalCount: messages.length,
      truncatedCount: result.length,
      estimatedTokens: currentTokens,
      budget: availableTokens
    });
  }
  
  return result;
}