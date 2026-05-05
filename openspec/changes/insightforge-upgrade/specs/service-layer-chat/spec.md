## MODIFIED Requirements

### Requirement: RAG search can be invoked by Agent workflow
The system SHALL expose RAG search functionality for use by the Retrieval Agent.

#### Scenario: Agent invokes RAG search
- **WHEN** Retrieval Agent calls RAG search with query and options
- **THEN** system performs hybrid search as defined in existing implementation
- **AND** system returns chunks with relevance scores

#### Scenario: Agent scopes search to project
- **WHEN** Agent specifies projectIds in search options
- **THEN** system filters results to documents in specified projects
- **AND** existing documentIds filter continues to work

### Requirement: Chat session can reference project context
The system SHALL allow chat sessions to optionally reference a project for context.

#### Scenario: Create chat session with project context
- **WHEN** user starts chat from within a project
- **THEN** system creates session with projectId reference
- **AND** RAG search defaults to project documents

#### Scenario: Chat without project context
- **WHEN** user starts chat from general interface
- **THEN** system creates session without project reference
- **AND** RAG search uses all user documents
