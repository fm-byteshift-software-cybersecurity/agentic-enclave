# AgenticEnclave — Architecture

## 1. Purpose

This document defines the software architecture of **AgenticEnclave**, an AI-powered customer support application designed to demonstrate secure engineering practices for AI agent systems.

The architecture combines:

- Hexagonal Architecture
- Ports and Adapters
- Domain-Driven Design principles
- Dependency Inversion
- Application-level authorization
- AI agent orchestration
- DevSec development practices

The architecture is intentionally designed to demonstrate that AI agents are **application components**, not the security boundary of the application.

The central architectural principle is:

> **An AI agent may request an action. The application must decide whether that action is allowed.**

---

# 2. Architectural Goals

The architecture has the following goals:

### Separation of Concerns

Business rules, application orchestration, security decisions and infrastructure integrations must have clearly defined responsibilities.

### Technology Independence

The core application must not depend directly on:

- FastAPI
- Turso
- SQLAlchemy
- OpenAI
- Gemini
- Groq
- React
- external APIs

Technology-specific implementations belong in adapters.

### Testability

Domain and application logic must be testable without requiring:

- a database
- an LLM provider
- an HTTP server
- external APIs

### Security by Design

Authorization must be enforced by deterministic application code rather than by:

- LLM responses
- prompts
- tool descriptions
- agent instructions
- frontend state

### Provider Flexibility

The application should be able to support multiple LLM providers without coupling the domain or application logic to a specific provider.

Initial providers:

```text
OpenAI
Google Gemini
Groq
```

### Controlled Agent Capabilities

Agents must receive only the tools and permissions required for their intended responsibilities.

This follows the principle of least privilege and OWASP's current guidance for agentic systems.

---

# 3. Architectural Style

AgenticEnclave uses a pragmatic implementation of:

```text
Hexagonal Architecture
+
Ports and Adapters
+
DDD Principles
+
Application Use Cases
```

Hexagonal Architecture isolates the application/domain core from infrastructure and external interfaces through ports and adapters. This allows databases, APIs and other external technologies to change without forcing changes to the core business logic.

The architecture also follows Dependency Inversion:

```text
Core defines abstractions.
Adapters implement abstractions.
```

The domain is therefore independent from infrastructure.

---

# 4. High-Level Architecture

```text
                         ┌──────────────────────┐
                         │       Frontend       │
                         │ React + TypeScript   │
                         └──────────┬───────────┘
                                    │
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │     FastAPI API      │
                         │   Primary Adapter     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │       Application Core       │
                    │                               │
                    │  Agents                       │
                    │  Use Cases                    │
                    │  Authorization / Policies     │
                    │  Tool Definitions             │
                    └──────────────┬────────────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
             ┌──────────────┐           ┌──────────────┐
             │    Domain    │           │     Ports    │
             │              │           │              │
             │ Entities     │           │ Repositories │
             │ Value Objects│           │ LLM Provider │
             │ Rules        │           │ External APIs│
             └──────┬───────┘           └──────┬───────┘
                    │                           │
                    │                           │
                    │                  ┌────────┴────────┐
                    │                  │                 │
                    │                  ▼                 ▼
                    │             ┌─────────┐      ┌────────────┐
                    │             │  Turso  │      │ LLM Adapters│
                    │             └─────────┘      │ OpenAI      │
                    │                              │ Gemini      │
                    │                              │ Groq        │
                    │                              └─────────────┘
                    │
                    ▼
             Domain Behavior
```

The application core remains independent of the technologies surrounding it.

---

# 5. Dependency Direction

The dependency direction is one of the most important architectural rules in the project.

```text
Entrypoints
    │
    ▼
Application
    │
    ▼
Domain
```

External implementations depend inward:

```text
Adapters
    │
    ▼
Ports
    │
    ▼
Application / Domain
```

The following dependency is prohibited:

```text
Domain → Turso
Domain → SQLAlchemy
Domain → FastAPI
Domain → OpenAI
Domain → Gemini
Domain → Groq
```

Instead:

```text
Domain / Application
        │
        ▼
       Port
        ▲
        │
     Adapter
```

This preserves the dependency inversion boundary.

AWS's current Hexagonal Architecture guidance similarly defines the domain as the core and recommends that infrastructure implement the ports required by the core.

---

# 6. Architectural Components

## 6.1 Domain

The Domain represents the business concepts and rules of the application.

It must remain independent from infrastructure and AI technologies.

Responsibilities include:

- entities
- value objects
- aggregates where appropriate
- domain services
- domain exceptions
- business invariants

Examples:

```text
Customer
Order
SupportTicket
OrderStatus
TicketStatus
```

Example business rule:

```text
A shipped order cannot be cancelled.
```

This rule belongs to the domain.

It must not depend on:

- an LLM
- an agent
- FastAPI
- SQLAlchemy
- Turso

---

# 7. Application

The Application layer coordinates application behavior.

It contains the logic required to execute use cases while remaining independent from concrete infrastructure technologies.

Responsibilities include:

```text
Use Cases
Agents
Agent orchestration
Authorization
Permission policies
Tool definitions
Application services
Application ports
```

Examples:

```text
GetCustomerProfile
UpdateCustomerProfile
GetOrder
CancelOrder
CreateSupportTicket
UpdateSupportTicket
```

The Application layer is also responsible for coordinating the security boundary between agent requests and business operations.

---

# 8. Agents

Agents are application components.

They are **not domain entities**.

They are responsible for:

- interpreting user intent
- reasoning using an LLM
- selecting available tools
- requesting operations
- coordinating with other agents when explicitly allowed

Agents are not responsible for:

- authorization decisions
- direct database access
- enforcing domain invariants
- deciding resource ownership
- bypassing application policies

Conceptually:

```text
Agent
  │
  │ requests operation
  ▼
Tool
  │
  ▼
Authorization
  │
  ▼
Use Case
  │
  ▼
Domain
```

The agent therefore acts as an intelligent application component while remaining outside the trusted security boundary.

---

# 9. Agent Runtime

Agent execution will use the **OpenAI Agents SDK for Python**.

The SDK provides the runtime capabilities required for:

- agent execution
- tool calling
- agent orchestration
- handoffs
- model interaction
- tracing and related runtime functionality

However, the SDK is not considered an architectural boundary.

The architecture must not depend on the assumption that the LLM or agent runtime makes security decisions.

Conceptually:

```text
Application
    │
    ▼
Agent Runtime
    │
    ▼
LLM
```

The runtime is therefore replaceable infrastructure from the perspective of the broader application architecture.

---

# 10. LLM Provider Abstraction

The application will support multiple LLM providers.

Initial providers:

```text
OpenAI
Google Gemini
Groq
```

The application will define a provider abstraction rather than embedding provider-specific logic into agents or use cases.

Conceptually:

```text
                 ┌───────────────┐
                 │ LLM Provider  │
                 │     Port      │
                 └───────┬───────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          OpenAI      Gemini       Groq
          Adapter     Adapter      Adapter
```

The purpose is not to pretend that every provider exposes identical capabilities.

Provider-specific differences should remain inside their adapters.

---

# 11. Ports

Ports define technology-independent interfaces through which the application communicates with external systems.

Examples:

```text
CustomerRepository
OrderRepository
SupportTicketRepository
LLMProvider
```

A port defines **what the application needs**, not how the dependency works.

Example:

```text
OrderRepository
    ├── get_by_id()
    ├── save()
    └── list_for_customer()
```

The port must not contain Turso-specific or SQLAlchemy-specific concepts.

---

# 12. Primary Adapters

Primary adapters are entry points through which external actors interact with the application.

The initial primary adapter is:

```text
FastAPI REST API
```

Conceptually:

```text
HTTP Request
    ↓
FastAPI
    ↓
Application Use Case
```

The API adapter is responsible for concerns such as:

- HTTP routing
- request parsing
- response serialization
- HTTP-specific error handling
- authentication context extraction

Business rules must not be implemented in the HTTP layer.

---

# 13. Secondary Adapters

Secondary adapters implement ports and connect the application to external technologies.

Initial adapters include:

```text
Turso / libSQL
OpenAI
Google Gemini
Groq
```

Conceptually:

```text
Application Port
       ▲
       │
       │ implements
       │
Secondary Adapter
       │
       ▼
External System
```

Examples:

```text
OrderRepository
      ▲
      │
TursoOrderRepository
      │
      ▼
Turso
```

and:

```text
LLMProvider
      ▲
      │
OpenAIProvider
      │
      ▼
OpenAI API
```

---

# 14. Authorization Architecture

Authorization is a first-class application concern.

It is not modeled as a generic technical layer between the application and domain.

Instead, authorization is enforced at the appropriate application execution boundaries.

Typical flow:

```text
Agent
  │
  ▼
Tool Request
  │
  ▼
Authorization Policy
  │
  ├── User identity
  ├── Agent identity
  ├── Permission
  ├── Resource
  └── Operation
  │
  ▼
Use Case
  │
  ▼
Domain
```

The authorization mechanism must fail closed.

Unknown tools, missing permissions and invalid authorization context must not result in execution.

This follows OWASP guidance to enforce tool authorization outside the agent's context rather than relying on model output or agent instructions.

---

# 15. Tool Architecture

Tools represent capabilities exposed to agents.

A tool is not equivalent to direct infrastructure access.

The intended flow is:

```text
Agent
  ↓
Tool Request
  ↓
Tool Authorization
  ↓
Use Case
  ↓
Domain
  ↓
Repository Port
  ↓
Adapter
```

The following pattern is prohibited:

```text
Agent
  ↓
Tool
  ↓
Database
```

Tools must not bypass use cases and domain rules.

Tool availability is also not equivalent to authorization:

```text
Tool exists
    ≠
Agent may use tool
    ≠
User is authorized for operation
```

OWASP recommends per-tool permission scoping and explicit authorization for sensitive operations.

---

# 16. Agent-to-Agent Communication

Agent-to-agent communication is treated as an explicit security boundary.

Example:

```text
Customer Agent
      │
      │ request
      ▼
Orders Agent
```

The Orders Agent must not assume that a request is authorized simply because it came from another trusted agent.

The authorization context must remain explicit.

Conceptually:

```text
User Identity
+
Source Agent
+
Target Agent
+
Requested Capability
+
Resource
+
Operation
```

The receiving agent or application boundary must validate the request before execution.

An agent message must never become an implicit privilege grant.

---

# 17. Business Rules vs Authorization

The architecture deliberately distinguishes:

### Authorization

Determines:

> "Is this actor allowed to perform this operation on this resource?"

Example:

```text
Can Customer A cancel Order 1842?
```

This belongs to application authorization.

### Domain Rule

Determines:

> "Is this operation valid according to the business?"

Example:

```text
An order that has already shipped cannot be cancelled.
```

This belongs to the domain.

Therefore:

```text
Authorization
      ↓
Domain Rule
      ↓
State Mutation
```

Both controls are required.

Passing authorization does not automatically make an operation valid.

---

# 18. Security Boundary

The most important security boundary is the transition from an agent-generated request to application execution.

```text
                 UNTRUSTED
                     │
                     ▼
             ┌──────────────┐
             │     Agent    │
             │              │
             │ LLM output   │
             │ Tool request │
             └──────┬───────┘
                    │
                    │ security boundary
                    ▼
          ┌─────────────────────┐
          │ Authorization       │
          │ Policy Enforcement  │
          └──────────┬──────────┘
                     │
                     ▼
                Application
                     │
                     ▼
                  Domain
```

The model may produce an incorrect, malicious or manipulated tool request.

The architecture must remain safe even when that happens.

---

# 19. Data Access

Agents must never access the database directly.

The database flow is:

```text
Agent
  ↓
Tool
  ↓
Authorization
  ↓
Use Case
  ↓
Repository Port
  ↓
Turso Adapter
  ↓
Turso
```

This provides multiple enforcement points:

```text
Authorization
    +
Use Case
    +
Domain Rules
```

A compromised or manipulated agent therefore cannot simply bypass the application and query the database.

---

# 20. Database

The initial persistence layer is:

```text
Turso / libSQL
```

Turso is an infrastructure concern.

The domain must not know that Turso exists.

The application communicates with a repository port:

```text
OrderRepository
```

and the secondary adapter provides the implementation:

```text
TursoOrderRepository
```

This allows the persistence technology to change without changing the domain model.

---

# 21. Project Structure

The initial project structure follows the architectural boundaries described above.

```text
agentic-enclave/
│
├── backend/
│   ├── app/
│   │   ├── domain/
│   │   │   ├── model/
│   │   │   ├── services/
│   │   │   └── exceptions/
│   │   │
│   │   ├── application/
│   │   │   ├── agents/
│   │   │   ├── use_cases/
│   │   │   ├── authorization/
│   │   │   ├── tools/
│   │   │   └── ports/
│   │   │
│   │   ├── entrypoints/
│   │   │   └── api/
│   │   │
│   │   ├── adapters/
│   │   │   ├── database/
│   │   │   └── llm/
│   │   │
│   │   └── main.py
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── security/
│       │   ├── vulnerable/
│       │   └── hardened/
│       └── e2e/
│
├── frontend/
│
├── docs/
│   ├── architecture/
│   │   └── architecture.md
│   └── security/
│       └── threat-model.md
│
└── README.md
```

This structure is intentionally pragmatic.

AWS's current guidance similarly recommends mapping `entrypoints`, `domain`, and `adapters` to the primary architectural boundaries of a hexagonal application.

The structure may evolve during implementation if concrete requirements demonstrate that a different organization provides clearer boundaries.

---

# 22. Testing Architecture

Testing is part of the architecture rather than a final development stage.

The project will use multiple levels of testing.

## Unit Tests

Focused on:

- domain behavior
- application services
- authorization policies
- individual components

These tests should not require external services.

## Integration Tests

Focused on:

- repository adapters
- LLM adapters
- database integration
- application component integration

## Security Tests

Focused specifically on attack scenarios defined in the threat model.

Examples:

```text
BOLA
Prompt Injection
Tool Misuse
Privilege Escalation
Sensitive Information Disclosure
Business Logic Abuse
```

## End-to-End Tests

Validate complete application flows through primary adapters.

---

# 23. DevSec Development Model

Security is integrated into feature development.

For a security-sensitive capability, the development flow is:

```text
Threat Model
      ↓
Security Requirement
      ↓
Domain / Application Design
      ↓
Implementation
      ↓
Unit Tests
      ↓
Security Test
      ↓
Hardening
      ↓
Regression Test
```

Security testing is therefore performed continuously rather than postponed until the end of development.

AWS recommends testing from the beginning of development and integrating automated testing into the development lifecycle.

---

# 24. Vulnerable and Hardened Implementations

AgenticEnclave intentionally includes controlled vulnerable implementations.

These implementations exist only to demonstrate security failures in a controlled environment.

The application is not duplicated into two independent architectures.

Instead, individual security scenarios may provide:

```text
Vulnerable implementation
        +
Hardened implementation
        +
Attack test
        +
Regression test
```

The purpose is to demonstrate:

```text
Vulnerability
      ↓
Attack
      ↓
Impact
      ↓
Root Cause
      ↓
Mitigation
      ↓
Verification
```

The vulnerable path must never become an accidental production path.

---

# 25. Architectural Security Invariants

The following invariants must remain true throughout development.

### Invariant 1

**Agents cannot directly access infrastructure.**

```text
Agent → Database
```

is prohibited.

### Invariant 2

**LLM output cannot authorize an operation.**

```text
LLM says "allowed"
```

is never sufficient authorization.

### Invariant 3

**Tools cannot bypass application use cases.**

```text
Tool → Database
```

is prohibited.

### Invariant 4

**Domain rules cannot depend on agents.**

The domain must remain valid even if agents are removed from the system.

### Invariant 5

**Agent-to-agent communication does not automatically grant privileges.**

### Invariant 6

**External content is untrusted.**

Documents, messages, API responses and other external content must not be treated as trusted instructions.

### Invariant 7

**Authorization fails closed.**

Unknown or incomplete authorization context results in rejection.

### Invariant 8

**Security controls must be testable independently from the LLM.**

A security test must be able to demonstrate that authorization remains effective even when the agent produces an adversarial request.

---

# 26. Architectural Trade-offs

Hexagonal Architecture introduces additional abstractions and components.

Examples include:

```text
Ports
Adapters
Use Cases
Authorization Policies
Tool Definitions
```

This increases the amount of code compared with a simple layered CRUD application.

The additional structure is intentional because AgenticEnclave has multiple external dependencies and security boundaries:

```text
LLM providers
Database
HTTP API
AI agents
Agent tools
External content
```

The architecture therefore benefits from explicit boundaries and replaceable adapters.

However, abstractions should not be introduced merely for theoretical purity.

If an abstraction does not protect a meaningful architectural boundary, it should be reconsidered.

AWS explicitly notes that Ports and Adapters can introduce maintenance complexity and should be used where the resulting decoupling provides meaningful value.

---

# 27. Architectural Decision Summary

| Decision                | Choice                                   | Reason                                       |
| ----------------------- | ---------------------------------------- | -------------------------------------------- |
| Architectural style     | Hexagonal / Ports and Adapters           | Decoupling and testability                   |
| Domain approach         | Pragmatic DDD                            | Explicit business rules and invariants       |
| API                     | FastAPI                                  | Python application entrypoint                |
| Agent runtime           | OpenAI Agents SDK                        | Agent execution and orchestration            |
| LLM abstraction         | Application-defined provider abstraction | Avoid provider lock-in                       |
| Initial providers       | OpenAI, Gemini, Groq                     | Provider flexibility                         |
| Database                | Turso / libSQL                           | Cloud database with simple operational model |
| Persistence abstraction | Repository ports                         | Infrastructure isolation                     |
| Authorization           | Application-level policies               | Trusted security boundary                    |
| Tools                   | Application capabilities                 | Controlled agent actions                     |
| Frontend                | React + TypeScript                       | Application UI                               |
| Security methodology    | DevSec                                   | Security integrated into development         |
| Security testing        | Dedicated security scenarios             | Repeatable attack verification               |
| Deployment model        | Deferred                                 | Avoid premature infrastructure complexity    |

---

# 28. Core Architectural Principle

AgenticEnclave is built around a simple separation of responsibilities:

```text
LLM
  ↓
Reasons

Agent
  ↓
Requests

Tool
  ↓
Describes Capability

Authorization
  ↓
Decides Permission

Use Case
  ↓
Coordinates Operation

Domain
  ↓
Enforces Business Rules

Port
  ↓
Defines External Dependency

Adapter
  ↓
Implements Technology Integration

Infrastructure
  ↓
Executes
```

The system is therefore designed so that an incorrect or malicious agent decision does not automatically become an authorized application action.

That separation is the central architectural and security property of AgenticEnclave.
