## ADDED Requirements

### Requirement: User can create a report draft
The system SHALL allow users to create a report draft with a topic, template selection, and optional project association.

#### Scenario: Create report draft
- **WHEN** user submits topic "AI 芯片市场分析" and selects template "market-research"
- **THEN** system creates a report with status "draft"
- **AND** system stores the topic and template selection
- **AND** system generates a unique report ID

#### Scenario: Create report linked to project
- **WHEN** user creates a report with a project association
- **THEN** system links the report to the specified project
- **AND** report generation will search within project documents by default

### Requirement: User can trigger report generation
The system SHALL execute a Multi-Agent workflow to generate the report content.

#### Scenario: Start report generation
- **WHEN** user triggers generation for a draft report
- **THEN** system changes report status to "generating"
- **AND** system initiates the four-stage workflow

### Requirement: System executes Research Agent stage
The system SHALL execute the Research Agent to search and collect web information.

#### Scenario: Research Agent searches web
- **WHEN** Research Agent starts with topic "AI 芯片市场分析"
- **THEN** system performs web search using DuckDuckGo
- **AND** system scrapes relevant URLs for content
- **AND** system stores collected web sources in workflow context
- **AND** system streams progress update "researching"

#### Scenario: Research Agent finds no results
- **WHEN** web search returns no relevant results
- **THEN** system continues to next stage with empty web sources
- **AND** system logs warning about limited external data

### Requirement: System executes Retrieval Agent stage
The system SHALL execute the Retrieval Agent to search user documents.

#### Scenario: Retrieval Agent searches project documents
- **WHEN** Retrieval Agent starts for a report linked to a project
- **THEN** system performs hybrid search on documents in the project
- **AND** system applies MMR reranking for diversity
- **AND** system stores retrieved chunks in workflow context
- **AND** system streams progress update "retrieving"

#### Scenario: Retrieval Agent searches all user documents
- **WHEN** Retrieval Agent starts for a report without project association
- **THEN** system performs hybrid search on all user documents
- **AND** system applies MMR reranking for diversity

#### Scenario: Retrieval Agent finds no documents
- **WHEN** user has no documents or project is empty
- **THEN** system continues to next stage with empty document context
- **AND** system relies more heavily on web research data

### Requirement: System executes Analysis Agent stage
The system SHALL execute the Analysis Agent to extract insights and generate chart data.

#### Scenario: Analysis Agent extracts insights
- **WHEN** Analysis Agent starts with collected data
- **THEN** system uses LLM to identify key themes and insights
- **AND** system extracts data suitable for visualization (charts, tables)
- **AND** system stores insights and chart data in workflow context
- **AND** system streams progress update "analyzing"

#### Scenario: Analysis Agent generates chart data
- **WHEN** Analysis Agent identifies numerical trends
- **THEN** system generates structured chart data (JSON format)
- **AND** chart data includes labels, values, and chart type recommendation

### Requirement: System executes Writing Agent stage
The system SHALL execute the Writing Agent to generate structured report content.

#### Scenario: Writing Agent generates report
- **WHEN** Writing Agent starts with all collected data
- **THEN** system uses template structure to organize content
- **AND** system generates content for each section defined in template
- **AND** system creates citations for all used sources
- **AND** system stores structured output in report.content
- **AND** system streams progress update "writing"

#### Scenario: Writing Agent produces structured output
- **WHEN** report generation completes
- **THEN** system produces JSON output matching Zod schema
- **AND** output includes title, summary, sections array, and citations array
- **AND** each section includes id, title, content, and citation references

### Requirement: System records citations
The system SHALL create Citation records for all sources used in the report.

#### Scenario: Create web citations
- **WHEN** report uses information from web sources
- **THEN** system creates Citation records with type "web"
- **AND** each citation includes URL, title, and snippet

#### Scenario: Create document citations
- **WHEN** report uses information from user documents
- **THEN** system creates Citation records with type "document"
- **AND** each citation includes document ID and snippet

### Requirement: System tracks generation status
The system SHALL stream real-time status updates during report generation.

#### Scenario: Stream progress updates
- **WHEN** report generation is in progress
- **THEN** system streams status updates via SSE or data stream
- **AND** each update includes current stage and progress message
- **AND** updates include partial content as it becomes available

### Requirement: System handles generation errors
The system SHALL gracefully handle errors during report generation.

#### Scenario: Generation fails at any stage
- **WHEN** an error occurs during any agent stage
- **THEN** system sets report status to "error"
- **AND** system stores error message in report record
- **AND** system preserves any partially generated content

#### Scenario: Generation timeout
- **WHEN** report generation exceeds maximum time limit (5 minutes)
- **THEN** system cancels the generation
- **AND** system sets report status to "error" with timeout message

### Requirement: User can view generated report
The system SHALL display the generated report with proper formatting.

#### Scenario: View completed report
- **WHEN** user opens a completed report
- **THEN** system displays title, summary, and all sections
- **AND** system renders markdown content with proper formatting
- **AND** system shows citations with clickable links

### Requirement: System tracks token usage
The system SHALL record total tokens used during report generation.

#### Scenario: Record token usage
- **WHEN** report generation completes
- **THEN** system calculates total tokens across all LLM calls
- **AND** system stores tokensUsed in report record
- **AND** system creates UsageLog entries for the generation
