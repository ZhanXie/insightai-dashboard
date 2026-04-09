## ADDED Requirements

### Requirement: Dashboard Overview
The system SHALL provide a main dashboard page that displays key metrics about the user's knowledge base and chat activity, including total documents, total chunks, total chat sessions, and recent activity summary.

#### Scenario: Dashboard with data
- **WHEN** an active user with uploaded documents and chat sessions visits the dashboard
- **THEN** the page displays summary cards showing document count, chunk count, session count, and a recent activity timeline

#### Scenario: Dashboard with no data
- **WHEN** a new user with no documents or chats visits the dashboard
- **THEN** the page displays zero counts and helpful prompts guiding the user to upload their first document

### Requirement: Document Statistics Chart
The system SHALL display a chart showing the number of documents uploaded over time using Recharts. The chart SHALL support daily, weekly, and monthly aggregation views.

#### Scenario: Viewing document upload trend
- **WHEN** user selects the "Documents Over Time" chart
- **THEN** a line or bar chart shows upload counts grouped by the selected time period (day/week/month)

#### Scenario: No document data for chart
- **WHEN** user has uploaded no documents
- **THEN** the chart area displays a placeholder message "Upload documents to see trends"

### Requirement: Chat Activity Chart
The system SHALL display a chart showing the number of chat messages sent per day over the past 30 days using Recharts. This SHALL help users visualize their AI usage patterns.

#### Scenario: Viewing chat activity trend
- **WHEN** user views the "Chat Activity" chart
- **THEN** a bar chart displays daily message counts for the past 30 days

#### Scenario: No chat data for chart
- **WHEN** user has no chat history
- **THEN** the chart area displays a placeholder message "Start chatting to see activity"

### Requirement: Document Size Distribution Chart
The system SHALL display a pie or donut chart showing the distribution of documents by file format (PDF, TXT, MD, DOCX) using Recharts.

#### Scenario: Viewing format distribution
- **WHEN** user has uploaded documents in multiple formats
- **THEN** a pie/donut chart shows the percentage breakdown by file type with a legend

#### Scenario: Single format uploads
- **WHEN** user has only uploaded one file format
- **THEN** the chart shows 100% for that format

### Requirement: Dashboard Responsiveness
The system SHALL ensure all dashboard charts and layout are responsive and render correctly on viewports from 768px (tablet) to 1920px+ (desktop). Charts SHALL resize appropriately and remain readable.

#### Scenario: Viewing on desktop
- **WHEN** user accesses the dashboard on a 1920px wide screen
- **THEN** charts are displayed in a multi-column grid layout with full detail

#### Scenario: Viewing on tablet
- **WHEN** user accesses the dashboard on a 768px wide screen
- **THEN** charts stack in a single or two-column layout and remain fully interactive

### Requirement: Data Refresh
The system SHALL refresh dashboard data when the user navigates to the page or triggers a manual refresh. Charts SHALL update with the latest data from the database.

#### Scenario: Automatic data refresh on navigation
- **WHEN** user navigates to the dashboard page
- **THEN** latest statistics and chart data are fetched from the server and displayed

#### Scenario: Manual refresh
- **WHEN** user clicks a refresh button on the dashboard
- **THEN** all data is re-fetched and charts are re-rendered with updated values
