## ADDED Requirements

### Requirement: User can view available subscription plans
The system SHALL display available subscription plans with features and pricing.

#### Scenario: Display plan options
- **WHEN** user visits subscription page
- **THEN** system shows Free, Pro, and Team plans
- **AND** each plan shows monthly price and key features
- **AND** current plan is highlighted if user has subscription

### Requirement: User can start Stripe checkout
The system SHALL create a Stripe Checkout session for subscription purchase.

#### Scenario: Start checkout for Pro plan
- **WHEN** authenticated user clicks "Subscribe to Pro"
- **THEN** system creates Stripe Checkout session
- **AND** system returns Checkout Session URL
- **AND** session includes success_url and cancel_url

#### Scenario: Checkout requires authentication
- **WHEN** unauthenticated user attempts to subscribe
- **THEN** system redirects to login page
- **AND** system preserves intended plan selection

### Requirement: System creates Stripe customer on first checkout
The system SHALL create a Stripe customer record for users without one.

#### Scenario: Create customer for new subscriber
- **WHEN** user starts checkout without existing Stripe customer ID
- **THEN** system creates Stripe customer with email
- **AND** system stores stripeCustomerId in user's subscription record

### Requirement: System handles Stripe webhooks
The system SHALL process Stripe webhook events to update subscription status.

#### Scenario: Handle checkout.session.completed
- **WHEN** Stripe sends checkout.session.completed webhook
- **THEN** system updates user's subscription status to "active"
- **AND** system stores stripeSubscriptionId and stripePriceId
- **AND** system sets currentPeriodEnd from subscription data

#### Scenario: Handle customer.subscription.updated
- **WHEN** Stripe sends subscription update webhook
- **THEN** system updates plan if price changed
- **AND** system updates currentPeriodEnd
- **AND** system updates status if changed

#### Scenario: Handle customer.subscription.deleted
- **WHEN** Stripe sends subscription deleted webhook
- **THEN** system updates subscription status to "canceled"
- **AND** system preserves subscription record for history

#### Scenario: Handle invoice.payment_failed
- **WHEN** payment fails webhook is received
- **THEN** system updates subscription status to "past_due"
- **AND** system could trigger notification to user

### Requirement: System validates webhook signatures
The system SHALL verify Stripe webhook signatures for security.

#### Scenario: Valid webhook signature
- **WHEN** webhook request has valid Stripe signature
- **THEN** system processes the webhook event normally

#### Scenario: Invalid webhook signature
- **WHEN** webhook request has invalid or missing signature
- **THEN** system returns 400 Bad Request
- **AND** system does not process the event
- **AND** system logs security warning

### Requirement: User can cancel subscription
The system SHALL allow users to cancel their subscription.

#### Scenario: Cancel at period end
- **WHEN** user cancels subscription
- **THEN** system sets cancelAtPeriodEnd to true
- **AND** subscription remains active until currentPeriodEnd
- **AND** system could schedule Stripe cancellation

#### Scenario: Reactivate canceled subscription
- **WHEN** user reactivates before period end
- **THEN** system sets cancelAtPeriodEnd to false
- **AND** subscription continues normally

### Requirement: System provides subscription status
The system SHALL provide an API to check current subscription status.

#### Scenario: Get subscription status
- **WHEN** user requests their subscription status
- **THEN** system returns plan, status, currentPeriodEnd
- **AND** system returns usage information if relevant

#### Scenario: No subscription record
- **WHEN** user has no subscription record
- **THEN** system returns default "free" plan with active status

### Requirement: Development mode bypasses Stripe
The system SHALL allow full feature access in development mode regardless of subscription.

#### Scenario: Development mode access
- **WHEN** NODE_ENV is "development"
- **THEN** all features are accessible without subscription check
- **AND** subscription checks return mock "pro" status

### Requirement: System syncs with Stripe on user login
The system SHOULD verify subscription status with Stripe when user accesses protected features.

#### Scenario: Sync subscription on access
- **WHEN** user accesses subscription-gated feature
- **THEN** system may query Stripe API for current status
- **AND** system updates local database if status differs
