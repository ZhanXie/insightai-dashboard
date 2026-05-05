## ADDED Requirements

### Requirement: System records usage events
The system SHALL record usage events for billable actions.

#### Scenario: Record report generation
- **WHEN** user generates a report
- **THEN** system creates UsageLog with type="report", action="generate"
- **AND** system records tokensUsed count
- **AND** system includes reportId in metadata

#### Scenario: Record chat query
- **WHEN** user sends a chat message
- **THEN** system creates UsageLog with type="chat", action="query"
- **AND** system records tokensUsed for the conversation

#### Scenario: Record document upload
- **WHEN** user uploads a document
- **THEN** system creates UsageLog with type="document", action="upload"
- **AND** system records fileSize in metadata

### Requirement: System aggregates usage statistics
The system SHALL provide aggregated usage statistics for users.

#### Scenario: Get monthly usage summary
- **WHEN** user requests usage statistics
- **THEN** system returns totals for current billing period
- **AND** summary includes report count, chat query count, document count
- **AND** summary includes total tokens used

#### Scenario: Get usage breakdown by type
- **WHEN** user requests detailed usage
- **THEN** system returns breakdown by action type
- **AND** each type shows count and token usage

### Requirement: System shows usage history
The system SHALL provide historical usage data.

#### Scenario: View usage over time
- **WHEN** user views usage analytics
- **THEN** system shows daily/weekly usage chart
- **AND** chart includes all usage types

#### Scenario: Filter usage by date range
- **WHEN** user selects date range
- **THEN** system returns usage within that range
- **AND** system shows comparison to previous period

### Requirement: System enforces usage limits (production)
The system SHALL enforce usage limits based on subscription plan in production.

#### Scenario: Check report limit
- **WHEN** user on Free plan attempts to generate report
- **THEN** system checks report count for current period
- **AND** system allows if under limit (3 per month for Free)
- **AND** system blocks with upgrade prompt if at limit

#### Scenario: Check document limit
- **WHEN** user on Free plan uploads document
- **THEN** system checks document count for current project
- **AND** system allows if under limit (5 per project for Free)
- **AND** system blocks with upgrade prompt if at limit

#### Scenario: Pro plan has higher limits
- **WHEN** user on Pro plan uses features
- **THEN** system applies Pro plan limits (30 reports/month, unlimited documents)

#### Scenario: Team plan has unlimited usage
- **WHEN** user on Team plan uses features
- **THEN** system does not enforce limits
- **AND** system still records usage for tracking

### Requirement: System provides usage dashboard
The system SHALL display usage information in the dashboard.

#### Scenario: Show current period usage
- **WHEN** user views dashboard
- **THEN** system shows usage progress bars for each limit type
- **AND** system shows percentage of limit used

#### Scenario: Show billing period end date
- **WHEN** user views usage section
- **THEN** system shows when current billing period ends
- **AND** system shows when limits reset

### Requirement: Usage logs support auditing
The system SHALL retain usage logs for auditing purposes.

#### Scenario: Query usage by user
- **WHEN** admin queries usage for a specific user
- **THEN** system returns all usage logs for that user
- **AND** logs are ordered by timestamp

#### Scenario: Usage log retention
- **WHEN** usage log is created
- **THEN** system retains log for at least 90 days
- **AND** older logs may be archived or summarized
