## ADDED Requirements

### Requirement: System provides predefined report templates
The system SHALL include a set of predefined report templates covering common use cases.

#### Scenario: List available templates
- **WHEN** user requests template list
- **THEN** system returns all templates with name, slug, category, and description
- **AND** templates are grouped by category (business, academic, technical, general)

#### Scenario: Template includes structure definition
- **WHEN** template is used for report generation
- **THEN** system uses the template's section structure
- **AND** each section has id, title, and required flag

### Requirement: Templates define section structure
The system SHALL use template structure to organize report content.

#### Scenario: Market research template structure
- **WHEN** user selects "market-research" template
- **THEN** report will have sections: executive_summary, market_overview, market_size, key_players, trends, challenges, conclusion, references

#### Scenario: Literature review template structure
- **WHEN** user selects "literature-review" template
- **THEN** report will have sections: introduction, methodology, findings, discussion, conclusion, references

#### Scenario: Technical review template structure
- **WHEN** user selects "technical-review" template
- **THEN** report will have sections: overview, architecture, implementation, performance, security, recommendations, references

### Requirement: Templates include stage-specific prompts
The system SHALL use template prompts to guide each agent stage.

#### Scenario: Use research prompts
- **WHEN** Research Agent executes
- **THEN** system uses template's research prompt with topic substitution
- **AND** prompt guides what types of information to search for

#### Scenario: Use analysis prompts
- **WHEN** Analysis Agent executes
- **THEN** system uses template's analysis prompt
- **AND** prompt guides what insights to extract

#### Scenario: Use writing prompts
- **WHEN** Writing Agent executes
- **THEN** system uses template's writing prompt
- **AND** prompt specifies tone, style, and formatting requirements

### Requirement: System tracks template usage
The system SHALL increment usage count when a template is used.

#### Scenario: Track template usage
- **WHEN** report is generated using a template
- **THEN** system increments template's usageCount field
- **AND** popular templates can be identified

### Requirement: Template categories are filterable
The system SHALL allow filtering templates by category.

#### Scenario: Filter by business category
- **WHEN** user requests templates with category="business"
- **THEN** system returns only templates in business category
- **AND** results include market-research, competitive-analysis, business-proposal, industry-analysis

#### Scenario: Filter by academic category
- **WHEN** user requests templates with category="academic"
- **THEN** system returns only templates in academic category
- **AND** results include literature-review, research-summary, thesis-outline

### Requirement: Predefined templates are seeded on deployment
The system SHALL seed predefined templates during database initialization.

#### Scenario: Seed templates on fresh database
- **WHEN** database is initialized
- **THEN** system creates template records for all predefined templates
- **AND** all predefined templates have isPublic=true

### Requirement: Template structure is extensible
The system SHALL support adding new templates without code changes.

#### Scenario: Add new template via database
- **WHEN** new template record is inserted
- **THEN** template becomes immediately available for selection
- **AND** template follows same JSON schema for structure and prompts
