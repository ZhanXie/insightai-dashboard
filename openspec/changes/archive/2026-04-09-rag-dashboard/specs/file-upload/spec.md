## ADDED Requirements

### Requirement: Document Upload
The system SHALL allow authenticated users to upload document files in PDF, TXT, MD, and DOCX formats. The maximum file size SHALL be 50MB. Each uploaded file SHALL be stored with metadata including filename, file size, MIME type, upload timestamp, and owner user ID.

#### Scenario: Successful document upload
- **WHEN** authenticated user uploads a valid 5MB PDF file
- **THEN** file metadata is saved to the documents table with status "processing" and the user sees upload confirmation

#### Scenario: File size exceeds limit
- **WHEN** user attempts to upload a file larger than 50MB
- **THEN** system rejects the upload with error message "File size exceeds 50MB limit" and no data is stored

#### Scenario: Unsupported file format
- **WHEN** user attempts to upload an unsupported format (e.g., .exe, .jpg)
- **THEN** system rejects the upload with error message "Unsupported file format. Supported: PDF, TXT, MD, DOCX"

#### Scenario: Upload without authentication
- **WHEN** unauthenticated user attempts to access the upload endpoint
- **THEN** system returns 401 Unauthorized and no file is processed

### Requirement: Document Text Extraction
The system SHALL extract raw text content from uploaded documents using format-appropriate parsers: pdf-parse for PDF, plain text reading for TXT/MD, and mammoth.js for DOCX. Extracted text SHALL be stored in the database.

#### Scenario: PDF text extraction
- **WHEN** a PDF document is uploaded
- **THEN** system uses pdf-parse to extract text content and stores the extracted text

#### Scenario: DOCX text extraction
- **WHEN** a DOCX document is uploaded
- **THEN** system uses mammoth.js to extract text content and stores the extracted text

#### Scenario: Empty document upload
- **WHEN** user uploads a document with no extractable text (e.g., image-only PDF)
- **THEN** system marks the document with status "error" and displays "No text content found in document"

### Requirement: Text Chunking
The system SHALL split extracted document text into overlapping chunks of 500-1000 tokens each, with 100 tokens of overlap between consecutive chunks. Each chunk SHALL be assigned a sequential position number within the document.

#### Scenario: Chunking a short document
- **WHEN** a document with 800 tokens of text is processed
- **THEN** system creates 1 chunk containing the full text (within the 500-1000 token range)

#### Scenario: Chunking a long document
- **WHEN** a document with 3000 tokens of text is processed
- **THEN** system creates approximately 4-5 chunks with proper overlap, each with sequential position numbers

### Requirement: Embedding Generation
The system SHALL generate vector embeddings for each text chunk by calling the Tencent Hunyuan Embedding API at `/v1/embeddings`. The embedding model, dimensions, and response SHALL be handled via the Vercel AI SDK with OpenAI-compatible configuration.

#### Scenario: Successful embedding generation
- **WHEN** a chunk of text is sent to the Hunyuan Embedding API
- **THEN** the system receives a numeric vector array and stores it in the chunks table's pgvector column

#### Scenario: Embedding API failure
- **WHEN** the Hunyuan Embedding API returns an error or times out
- **THEN** the document status is set to "error", and the user sees "Failed to process document, please try again"

### Requirement: Vector Storage
The system SHALL store each chunk's embedding vector in the PostgreSQL `chunks` table using the pgvector extension. The embedding SHALL be stored as a vector type with dimensions matching the Hunyuan Embedding model output. Each chunk record SHALL reference its parent document and include the chunk's text content and position.

#### Scenario: Storing embeddings for a new document
- **WHEN** a document is fully processed with all chunk embeddings generated
- **THEN** all chunk records are inserted into the chunks table with their respective vector embeddings

#### Scenario: Document status update after processing
- **WHEN** all chunks of a document have been embedded and stored
- **THEN** the document status is updated from "processing" to "ready"

### Requirement: Document Listing
The system SHALL provide an authenticated endpoint that returns a paginated list of documents belonging to the current user, including filename, upload date, status (ready/processing/error), and chunk count.

#### Scenario: Viewing document list
- **WHEN** authenticated user visits their documents page
- **THEN** system returns a paginated list of their documents sorted by upload date (newest first)

#### Scenario: Empty document list
- **WHEN** authenticated user has not uploaded any documents
- **THEN** system returns an empty list with a message encouraging the user to upload their first document

### Requirement: Document Deletion
The system SHALL allow users to delete their own documents. Deletion SHALL cascade to all associated chunks and their embeddings. Only the document owner SHALL be able to delete it.

#### Scenario: Successful document deletion
- **WHEN** user deletes one of their documents
- **THEN** the document and all its associated chunks and embeddings are removed from the database

#### Scenario: Attempting to delete another user's document
- **WHEN** user attempts to delete a document they do not own
- **THEN** system returns 404 Not Found and no data is deleted
