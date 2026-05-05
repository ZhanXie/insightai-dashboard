## ADDED Requirements

### Requirement: System can search the web
The system SHALL provide a tool for searching the web using DuckDuckGo.

#### Scenario: Perform web search
- **WHEN** agent calls webSearch tool with query "AI chip market size 2024"
- **THEN** system returns a list of search results
- **AND** each result includes title, URL, and snippet
- **AND** results are limited to top 10 entries

#### Scenario: Search with no results
- **WHEN** web search returns no results
- **THEN** system returns empty array
- **AND** system does not throw error

#### Scenario: Search service unavailable
- **WHEN** DuckDuckGo search fails or times out
- **THEN** system returns empty array with warning
- **AND** system logs the error for monitoring

### Requirement: System can scrape web pages
The system SHALL provide a tool for extracting content from web pages.

#### Scenario: Scrape accessible webpage
- **WHEN** agent calls scrapeUrl tool with a valid URL
- **THEN** system fetches the webpage HTML
- **AND** system extracts main text content using Cheerio
- **AND** system returns title, content, and metadata

#### Scenario: Scrape webpage with rate limiting
- **WHEN** webpage returns 429 rate limit response
- **THEN** system retries with exponential backoff (max 3 retries)
- **AND** system returns partial result if available

#### Scenario: Scrape blocked webpage
- **WHEN** webpage blocks scraping or returns error
- **THEN** system returns null content
- **AND** system logs warning about blocked URL

#### Scenario: Scrape non-HTML content
- **WHEN** URL points to PDF or other binary content
- **THEN** system skips content extraction
- **AND** system returns metadata only if available

### Requirement: System respects robots.txt
The system SHOULD check robots.txt before scraping major websites.

#### Scenario: Check robots.txt
- **WHEN** scraping a URL from a major domain
- **THEN** system checks if scraping is allowed
- **AND** system respects disallow directives for the path

#### Scenario: Robots.txt disallows scraping
- **WHEN** robots.txt disallows the target path
- **THEN** system skips scraping that URL
- **AND** system returns null with reason "robots.txt disallowed"

### Requirement: System sanitizes scraped content
The system SHALL clean and normalize scraped content.

#### Scenario: Remove HTML tags and scripts
- **WHEN** extracting content from webpage
- **THEN** system removes all HTML tags, scripts, and styles
- **AND** system returns plain text content

#### Scenario: Truncate long content
- **WHEN** scraped content exceeds 10000 characters
- **THEN** system truncates to 10000 characters
- **AND** system appends "... [truncated]" indicator

### Requirement: System caches search results
The system SHALL cache web search results to reduce API calls.

#### Scenario: Cache search results
- **WHEN** identical search query is made within 1 hour
- **THEN** system returns cached results
- **AND** system does not make new web request

#### Scenario: Cache miss
- **WHEN** search query is not in cache or cache expired
- **THEN** system performs fresh web search
- **AND** system stores results in cache with 1 hour TTL
