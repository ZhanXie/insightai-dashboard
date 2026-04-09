## ADDED Requirements

### Requirement: User Registration
The system SHALL allow new users to register with an email and password. Password MUST be hashed before storage using bcrypt or equivalent. Upon successful registration, the user SHALL be automatically logged in and redirected to the dashboard.

#### Scenario: Successful registration
- **WHEN** user submits valid email and password on the registration page
- **THEN** a new user record is created in the database with hashed password, and user is redirected to /dashboard

#### Scenario: Duplicate email registration
- **WHEN** user attempts to register with an email that already exists
- **THEN** system displays an error message "Email already registered" and no new user is created

#### Scenario: Invalid email format
- **WHEN** user submits registration form with malformed email
- **THEN** system displays client-side validation error "Invalid email format" and form is not submitted

### Requirement: User Login
The system SHALL allow registered users to log in with their email and password using Auth.js v5 Credentials provider. Upon successful authentication, a JWT session SHALL be created and stored.

#### Scenario: Successful login
- **WHEN** registered user submits correct email and password on the login page
- **THEN** user is authenticated, JWT session is created, and user is redirected to /dashboard

#### Scenario: Incorrect password
- **WHEN** user submits correct email but wrong password
- **THEN** system displays "Invalid email or password" without revealing which field is incorrect

#### Scenario: Unregistered email login
- **WHEN** user attempts to log in with an email not in the database
- **THEN** system displays "Invalid email or password" without revealing the email is unregistered

### Requirement: Session Management
The system SHALL maintain user sessions using Auth.js v5 JWT-based sessions. The session SHALL include the user's ID and email. Sessions SHALL be validated on protected server-side routes and server actions.

#### Scenario: Accessing protected route with valid session
- **WHEN** authenticated user navigates to /dashboard
- **THEN** page loads successfully with user's data

#### Scenario: Accessing protected route without session
- **WHEN** unauthenticated user navigates to /dashboard
- **THEN** user is redirected to /login with a callback URL to /dashboard

#### Scenario: Session expiration
- **WHEN** user's JWT session expires
- **THEN** user is redirected to /login and sees a message "Session expired, please log in again"

### Requirement: User Logout
The system SHALL allow authenticated users to log out, which SHALL invalidate the current session and redirect to the login page.

#### Scenario: Successful logout
- **WHEN** authenticated user clicks the logout button
- **THEN** session is destroyed and user is redirected to /login

### Requirement: User Data Isolation
The system SHALL ensure all data queries (documents, chunks, chat sessions, messages) are filtered by the authenticated user's ID. No user SHALL be able to access another user's data through any API endpoint or server action.

#### Scenario: User queries only own documents
- **WHEN** user accesses their document list via API
- **THEN** only documents belonging to that user are returned, verified by WHERE user_id = current_user_id

#### Scenario: User cannot access another user's document
- **WHEN** user attempts to access a document ID that belongs to another user
- **THEN** system returns 404 Not Found or empty result, never the other user's document
