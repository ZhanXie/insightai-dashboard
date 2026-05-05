## MODIFIED Requirements

### Requirement: Document can be assigned to a project
The system SHALL allow documents to be optionally associated with a project for organization.

#### Scenario: Create document without project
- **WHEN** user uploads a document without specifying project
- **THEN** system creates document with projectId set to null
- **AND** document appears in user's general document pool

#### Scenario: Create document with project
- **WHEN** user uploads a document and specifies a project
- **THEN** system creates document with projectId set to the project
- **AND** document appears in both project documents and general list

#### Scenario: Document inherits project's access
- **WHEN** document is assigned to a project
- **THEN** document is accessible when filtering by project
- **AND** document remains accessible in user's general document list

### Requirement: Document list supports project filtering
The system SHALL allow filtering documents by project.

#### Scenario: Filter documents by project
- **WHEN** user requests documents for a specific project
- **THEN** system returns only documents with matching projectId
- **AND** pagination works within the filtered results

#### Scenario: Show documents without project
- **WHEN** user requests unassigned documents
- **THEN** system returns documents where projectId is null

### Requirement: Document deletion updates project statistics
The system SHALL update project statistics when a document is deleted.

#### Scenario: Delete document from project
- **WHEN** user deletes a document that belongs to a project
- **THEN** system removes the document
- **AND** system decrements document count for the project
- **AND** system decrements chunk count for the project

### Requirement: RAG search can be scoped to project
The system SHALL allow scoping RAG search to a specific project's documents.

#### Scenario: Search within project documents
- **WHEN** search is performed with projectId filter
- **THEN** system only searches chunks from documents in that project
- **AND** search results include only matching project documents

#### Scenario: Search across all user documents
- **WHEN** search is performed without project filter
- **THEN** system searches all documents owned by user
- **AND** results may include documents from any project or no project
