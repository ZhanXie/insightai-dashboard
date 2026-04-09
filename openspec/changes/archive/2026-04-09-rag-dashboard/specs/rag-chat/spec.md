## ADDED Requirements

### Requirement: RAG Chat Endpoint
The system SHALL provide a streaming chat endpoint that implements Retrieval-Augmented Generation. The endpoint SHALL accept a user message, generate an embedding for the query, retrieve relevant document chunks via vector similarity search, construct an augmented prompt, and stream the AI response using the Tencent Hunyuan Lite model via the Vercel AI SDK.

#### Scenario: RAG chat with available documents
- **WHEN** user sends a message and has "ready" documents in their knowledge base
- **THEN** system retrieves relevant chunks, constructs an augmented prompt, and streams the AI response based on the retrieved context

#### Scenario: RAG chat with no documents
- **WHEN** user sends a message but has no documents in their knowledge base
- **THEN** system responds with a message informing the user to upload documents first for knowledge-based answers

#### Scenario: Streaming response
- **WHEN** the AI model generates a response
- **THEN** the response is streamed to the client using Server-Sent Events (SSE) for real-time display

### Requirement: Vector Similarity Retrieval
The system SHALL retrieve the top-5 most relevant document chunks by performing a cosine similarity search using pgvector's `<->` operator. The search SHALL be scoped to only the current user's documents to enforce data isolation.

#### Scenario: Retrieving relevant chunks
- **WHEN** a user query embedding is generated
- **THEN** system queries the chunks table filtering by user's documents, orders by cosine distance, and returns the top 5 closest chunks

#### Scenario: Similarity search with no user documents
- **WHEN** user has no documents or all documents are still processing
- **THEN** system returns zero chunks and proceeds with a fallback response

### Requirement: Augmented Prompt Construction
The system SHALL construct a prompt that includes a system message instructing the AI to answer based on the provided document context, the retrieved chunk contents clearly labeled with their source document name, and the user's original question. If retrieved chunks are irrelevant to the query, the AI SHALL indicate that it cannot find relevant information in the documents.

#### Scenario: Prompt with relevant context
- **WHEN** 5 relevant chunks are retrieved
- **THEN** system constructs a prompt containing: system instruction, all 5 chunks with document source labels, and the user's question

#### Scenario: Prompt with irrelevant context
- **WHEN** retrieved chunks are unrelated to the user's question
- **THEN** the AI response (guided by system prompt) states that the documents don't contain relevant information about the query

### Requirement: useChat Integration
The system SHALL use the Vercel AI SDK `useChat` hook on the client side to manage chat messages, handle streaming responses, and provide real-time UI updates. The hook SHALL be configured to call the RAG chat API endpoint.

#### Scenario: Sending a message via useChat
- **WHEN** user types a message and presses Enter or clicks Send
- **THEN** message appears immediately in the chat UI, a loading indicator shows, and the AI response streams in as it arrives

#### Scenario: Chat input disabled during streaming
- **WHEN** the AI response is still streaming
- **THEN** the chat input is disabled to prevent sending multiple messages simultaneously

#### Scenario: Error during chat streaming
- **WHEN** the API call fails or streaming encounters an error
- **THEN** an error message is displayed in the chat and the input is re-enabled

### Requirement: Chat Session Management
The system SHALL organize conversations into sessions. Each session SHALL have a unique ID, belong to a specific user, and have an auto-generated title based on the first message. All messages (both user and assistant) within a session SHALL be stored in the database.

#### Scenario: Creating a new chat session
- **WHEN** user sends their first message in a new chat
- **THEN** a new chat session is created with a title derived from the first message, and the message is stored

#### Scenario: Continuing an existing chat session
- **WHEN** user sends a follow-up message in an existing session
- **THEN** the new message and AI response are appended to the session's message history

#### Scenario: Loading chat session history
- **WHEN** user selects a previous chat session
- **THEN** all messages in that session are loaded and displayed in chronological order

### Requirement: Chat Session Listing
The system SHALL provide a list of the user's chat sessions, sorted by most recently updated. Each entry SHALL display the session title and last activity timestamp.

#### Scenario: Viewing chat session list
- **WHEN** user navigates to the chat sidebar or session list
- **THEN** system returns the user's sessions sorted by last updated time, showing title and timestamp

#### Scenario: Creating a new session from the list
- **WHEN** user clicks "New Chat" in the session list
- **THEN** a fresh chat session is created and the user is taken to the chat interface

### Requirement: Chat Session Deletion
The system SHALL allow users to delete their own chat sessions. Deletion SHALL cascade to all messages within the session. Only the session owner SHALL be able to delete it.

#### Scenario: Successful session deletion
- **WHEN** user deletes one of their chat sessions
- **THEN** the session and all its messages are removed from the database

#### Scenario: Attempting to delete another user's session
- **WHEN** user attempts to delete a chat session they do not own
- **THEN** system returns 404 Not Found and no data is deleted

### Requirement: Context-Aware Multi-Turn Conversation
The system SHALL include the previous messages in the current session as conversation context when making API calls. This enables the AI to maintain context across multiple turns within the same chat session while still performing fresh RAG retrieval for each new user message.

#### Scenario: Follow-up question referencing prior context
- **WHEN** user asks "Can you explain more about that?" as a follow-up
- **THEN** the API call includes the conversation history as context, allowing the AI to understand the reference and provide a relevant answer

#### Scenario: Fresh RAG retrieval each turn
- **WHEN** user sends a new question in an existing session
- **THEN** system performs a new vector similarity search for the latest question, independent of previous retrieval results
