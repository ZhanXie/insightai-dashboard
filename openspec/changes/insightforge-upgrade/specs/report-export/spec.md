## ADDED Requirements

### Requirement: User can export report as Markdown
The system SHALL allow exporting completed reports in Markdown format.

#### Scenario: Export to Markdown
- **WHEN** user clicks "Export as Markdown" for a completed report
- **THEN** system generates a .md file with proper formatting
- **AND** file includes all sections with proper heading hierarchy
- **AND** citations are formatted as reference links

#### Scenario: Markdown includes frontmatter
- **WHEN** exporting to Markdown
- **THEN** file includes YAML frontmatter with title, date, and template

### Requirement: User can export report as PDF
The system SHALL allow exporting completed reports in PDF format.

#### Scenario: Export to PDF
- **WHEN** user clicks "Export as PDF" for a completed report
- **THEN** system generates a formatted PDF file
- **AND** PDF includes title page, table of contents, and page numbers
- **AND** sections have proper formatting and page breaks

#### Scenario: PDF includes charts
- **WHEN** report contains chart data
- **THEN** PDF renders charts as images
- **AND** charts are positioned near relevant text

#### Scenario: PDF includes citations
- **WHEN** PDF is generated
- **THEN** citations appear as numbered references
- **AND** clickable links work in PDF viewers

### Requirement: User can export report as Word
The system SHALL allow exporting completed reports in Word (.docx) format.

#### Scenario: Export to Word
- **WHEN** user clicks "Export as Word" for a completed report
- **THEN** system generates a .docx file
- **AND** document uses proper heading styles
- **AND** document is editable in Microsoft Word and Google Docs

#### Scenario: Word includes styling
- **WHEN** Word export completes
- **THEN** document has consistent font and spacing
- **AND** headings use Word built-in styles (Heading 1, Heading 2, etc.)
- **AND** document includes a title page

### Requirement: Export handles special content types
The system SHALL properly format special content during export.

#### Scenario: Export code blocks
- **WHEN** report contains code blocks
- **THEN** code is formatted with monospace font
- **AND** code blocks have syntax highlighting where supported

#### Scenario: Export tables
- **WHEN** report contains table data
- **THEN** tables are rendered with borders and proper alignment
- **AND** table headers are styled distinctly

#### Scenario: Export images and charts
- **WHEN** report contains image references or chart data
- **THEN** images/charts are embedded in the exported file
- **AND** alt text is preserved for accessibility

### Requirement: Export respects user permissions
The system SHALL only allow export for reports the user owns.

#### Scenario: Export own report
- **WHEN** authenticated user requests export of their own report
- **THEN** system processes the export request

#### Scenario: Export forbidden for non-owner
- **WHEN** user attempts to export a report they don't own
- **THEN** system returns 403 Forbidden
- **AND** export is not processed

### Requirement: Export generates unique filenames
The system SHALL generate descriptive filenames for exported files.

#### Scenario: Filename format
- **WHEN** report is exported
- **THEN** filename follows format: "{report-title}-{date}.{extension}"
- **AND** filename is sanitized to remove special characters
- **AND** date is in YYYY-MM-DD format

### Requirement: Large reports export successfully
The system SHALL handle export of large reports without timeout.

#### Scenario: Export long report
- **WHEN** report contains more than 50 pages of content
- **THEN** export completes within 60 seconds
- **AND** all content is included in exported file

#### Scenario: Export with many images
- **WHEN** report contains more than 20 images/charts
- **THEN** export completes successfully
- **AND** all images are properly embedded
