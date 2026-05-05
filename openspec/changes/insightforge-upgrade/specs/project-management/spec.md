## ADDED Requirements

### Requirement: User can create a project
The system SHALL allow authenticated users to create a new project (knowledge base) with a name and optional description.

#### Scenario: Create project with name only
- **WHEN** user submits a project with name "市场研究报告集"
- **THEN** system creates a project with auto-generated ID and default color
- **AND** system returns the created project with status 201

#### Scenario: Create project with full details
- **WHEN** user submits a project with name, description, and color
- **THEN** system creates a project with all provided details
- **AND** system associates the project with the current user

### Requirement: User can list their projects
The system SHALL allow users to retrieve a paginated list of their projects.

#### Scenario: List all projects
- **WHEN** user requests project list
- **THEN** system returns all projects belonging to the user
- **AND** each project includes document count and report count

#### Scenario: Empty project list
- **WHEN** user with no projects requests project list
- **THEN** system returns an empty array with pagination metadata

### Requirement: User can update a project
The system SHALL allow users to update project name, description, and color.

#### Scenario: Update project name
- **WHEN** user updates project name to "竞品分析"
- **THEN** system updates the project and returns updated entity
- **AND** system updates the updatedAt timestamp

### Requirement: User can delete a project
The system SHALL allow users to delete a project.

#### Scenario: Delete project with no associated content
- **WHEN** user deletes a project with no documents or reports
- **THEN** system removes the project from database
- **AND** system returns status 204

#### Scenario: Delete project with associated documents
- **WHEN** user deletes a project that has documents
- **THEN** system removes the project
- **AND** system sets projectId to null for all associated documents (does NOT delete documents)

#### Scenario: Delete project with associated reports
- **WHEN** user deletes a project that has reports
- **THEN** system removes the project
- **AND** system sets projectId to null for all associated reports (does NOT delete reports)

### Requirement: User can assign documents to a project
The system SHALL allow users to assign existing documents to a project.

#### Scenario: Assign document to project
- **WHEN** user assigns a document to a project they own
- **THEN** system updates the document's projectId field

#### Scenario: Move document between projects
- **WHEN** user changes a document's project assignment
- **THEN** system updates the document's projectId to the new project

#### Scenario: Remove document from project
- **WHEN** user sets document's project to null
- **THEN** system sets document's projectId to null
- **AND** document remains in user's general document pool

### Requirement: Project shows aggregated statistics
The system SHALL display statistics for each project including document count, report count, and total chunk count.

#### Scenario: View project statistics
- **WHEN** user views project details
- **THEN** system shows total documents, reports, and chunks in the project
- **AND** system shows total file size of all documents
