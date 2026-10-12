# AgenticEnclave — Architecture

## 1. Purpose

This document describes the architectural principles, component boundaries, and security responsibilities of **AgenticEnclave**, an AI-powered application designed to demonstrate security engineering practices for AI agent systems.

The project combines Hexagonal Architecture, application use cases, AI agent execution, and application-level security controls.

Its central principle is:

> An AI agent may request an action. The application must decide whether that action is allowed.

The LLM is not a security boundary. Authorization and business rules must be enforced by application-controlled code, independently of model instructions or generated responses.

This document distinguishes the architecture currently implemented from capabilities planned for future development.

## 2. Architectural Principles

AgenticEnclave follows a pragmatic combination of:

- **Hexagonal Architecture (Ports and Adapters):** Isolate the application core from external technologies.
- **Dependency Inversion:** Make infrastructure implementations depend on abstractions owned by the application core.
- **Domain-Driven Design principles:** Represent business concepts and enforce domain invariants explicitly.
- **Application use cases:** Coordinate business operations and security-sensitive decisions.
- **Security by design:** Enforce authorization at application execution boundaries.
- **Testability:** Verify business behavior and security controls independently of the LLM wherever practical.

The architecture favors explicit boundaries over abstractions introduced solely for theoretical purity.

## 3. High-Level Architecture

The current backend separates HTTP entry points, application behavior, domain rules, and infrastructure integrations.

```text
                   PRIMARY ADAPTER
                ┌────────────────────┐
                │    FastAPI API     │
                │ Authentication     │
                │ HTTP Error Mapping │
                └─────────┬──────────┘
                          │
                          ▼
                APPLICATION CORE
                ┌────────────────────┐
                │ Application Context│
                │ Use Cases          │
                │ Authorization      │
                │ Tool Contracts     │
                │ Repository Ports   │
                └─────────┬──────────┘
                          │
                ┌─────────┴──────────┐
                ▼                    ▼
             DOMAIN           SECONDARY ADAPTERS
        ┌──────────────┐    ┌────────────────────┐
        │ Order        │    │ OpenAI Agent       │
        │ OrderStatus  │    │ Runtime / Tools    │
        │ Business     │    ├────────────────────┤
        │ Rules        │    │ Turso Repository   │
        └──────────────┘    └────────────────────┘
```

This is a conceptual view, not a complete representation of every class or dependency.

The actual implementation places the OpenAI-specific agent runtime and function-tool integration under `backend/app/adapters/llm/openai/`. The database integration is implemented under `backend/app/adapters/database/`.

The frontend and additional agent capabilities remain outside the current implementation scope.

## 4. Dependency Direction

The application core must not depend on concrete infrastructure implementations.

The intended dependency relationships are:

```text
FastAPI Adapter ──────────┐
                          ▼
                    Application
                          │
                          ▼
                        Domain

Turso Adapter ───────► Repository Port

OpenAI Adapter ──────► Application Tool Contract
```

The arrows represent dependencies on interfaces or components. They do not imply that every component calls every other component directly.

For example, `TursoOrderRepository` implements the `OrderRepository` port consumed by application use cases. The use case does not need to know how Turso stores or retrieves orders.

The following dependencies are prohibited by design:

```text
Domain → FastAPI
Domain → Turso
Domain → OpenAI Agents SDK
Domain → Provider-specific APIs
```

Infrastructure-specific code belongs in adapters. Application and domain code should remain independently testable.

## 5. Architectural Components

### 5.1 Domain

The Domain contains business concepts, state transitions, and business invariants.

The current order-cancellation scenario includes:

- `Order`
- `OrderStatus`
- Domain-level cancellation rules
- `BusinessRuleViolation`

For example, cancelling an order that has already been cancelled is a business-rule violation.

The Domain must not depend on HTTP requests, LLM output, database adapters, or agent execution.

Additional entities and business capabilities may be introduced as the application evolves.

### 5.2 Application

The Application layer coordinates use cases and enforces application-level policies.

Current responsibilities include:

- Executing use cases
- Evaluating authorization policies
- Defining permissions and actor context
- Defining application tool contracts
- Accessing persistence through repository ports

The implemented cancellation flow includes `CancelOrderUseCase`, `AuthorizationPolicy`, `Actor`, `Permission`, and `OrderRepository`.

Application-level authorization and domain business rules serve different purposes and must remain separate.

### 5.3 Ports

Ports define the interfaces required by application logic.

The current order workflow uses `OrderRepository`, which abstracts order retrieval and persistence.

A port describes what the application needs rather than how an external system implements it.

Additional ports should be introduced when a real application requirement justifies them.

### 5.4 Primary Adapters

Primary adapters provide entry points into application behavior.

The current primary adapter is the FastAPI REST API, implemented through `backend/app/main.py` and the API authentication components.

Its responsibilities include:

- Receiving HTTP requests
- Establishing the authenticated user context
- Invoking the appropriate runtime
- Mapping application failures to HTTP responses
- Returning serialized results

HTTP handling should not become the sole enforcement point for resource-level authorization. Security-sensitive use cases must enforce the rules required for their operations.

### 5.5 Secondary Adapters

Secondary adapters connect application behavior to external technologies.

The current implementation includes:

- **Turso / libSQL:** Persistence through the database repository adapter.
- **OpenAI Agents SDK:** Agent execution and function-tool integration.

Provider-specific SDK objects and database implementation details should remain outside the domain.

## 6. AI Agent Execution

Agents are application capabilities orchestrated through an external agent runtime. They are not domain entities and do not constitute a trusted authorization boundary.

The current Orders Agent can request an order-cancellation operation through a registered function tool.

Its execution flow is:

```text
Authenticated HTTP Request
            │
            ▼
        FastAPI API
            │
            ▼
     OpenAI Agent Runtime
            │
            ▼
      Function Tool Adapter
            │
            ▼
      CancelOrderTool
            │
            ▼
     CancelOrderUseCase
            │
            ├── Retrieve Order
            │
            ├── Check Authorization
            │
            ├── Apply Domain Rules
            │
            ▼
      OrderRepository
            │
            ▼
      Turso Database
```

The model interprets the request and may generate a tool call containing an `order_id`. The tool adapter passes the arguments to the application tool, which delegates to the use case.

The authenticated actor is derived from the application context established by the API, not from an order ID or identity claimed by the LLM.

The model can request an operation, but the application determines whether it may proceed.

## 7. Authorization Architecture

Authorization is an application-level security responsibility.

The current implementation defines:

- `Actor`: Represents the identity and execution context of the actor.
- `Permission`: Identifies the requested capability.
- `AuthorizationPolicy`: Evaluates whether an operation is allowed.
- `AuthorizationDenied`: Represents a denied authorization decision.

For order cancellation, the use case retrieves the order and checks whether the actor is permitted to cancel an order belonging to the associated customer before modifying its state.

Conceptually:

```text
Authenticated Actor
        │
        ▼
  Requested Operation
        │
        ▼
    Order Lookup
        │
        ▼
 Authorization Policy
        │
        ├── Denied → Reject
        │
        ▼
   Domain Operation
        │
        ▼
   Persist Changes
```

The lookup occurs before the ownership check because the policy needs the order's owner. The state-changing operation and persistence occur only after authorization succeeds.

Authentication establishes identity; it does not automatically grant access to every resource.

Authorization decisions must use trusted application context and resource attributes rather than model-generated claims. Missing or invalid authorization context must not result in permission being granted.

## 8. Tool Architecture

Tools expose specific application capabilities to agents.

A tool is not equivalent to direct access to a database or an unrestricted application service.

The current cancellation tool delegates to `CancelOrderUseCase`, keeping the operation's authorization and business rules in the application layer.

The intended boundary is:

```text
Agent
  ↓
Tool Adapter
  ↓
Application Tool
  ↓
Use Case
  ↓
Repository Port
  ↓
Database Adapter
```

Tools must not bypass the use cases responsible for the relevant operation.

Three concepts must remain distinct:

- **Tool availability:** The capability is exposed to an agent.
- **Authorization:** The current actor may perform the operation on the requested resource.
- **Business validity:** The operation satisfies domain rules.

Availability does not imply authorization, and authorization does not imply that a business operation is valid.

## 9. Business Rules and Authorization

Authorization and domain rules answer different questions.

**Authorization:** Is this actor permitted to perform this operation on this resource?

Example: Is the authenticated customer allowed to cancel this order?

**Domain rule:** Is this operation valid under the business rules?

Example: Is the order in a state that permits cancellation?

The intended sequence is:

```text
Resource Retrieval
        ↓
Authorization
        ↓
Domain Rule Validation
        ↓
State Mutation
        ↓
Persistence
```

Both authorization and domain validation are necessary. Passing one does not replace the other.

## 10. Vulnerable and Hardened Implementations

AgenticEnclave uses paired implementations to demonstrate individual security weaknesses and their corresponding mitigations.

The vulnerable implementation intentionally omits a specific control. The hardened implementation enforces that control within the appropriate application boundary.

The current example is **SEC-01: Broken Object Level Authorization (BOLA)**.

The vulnerable cancellation use case retrieves an order and attempts to cancel it without checking whether the actor is authorized to access that order. The hardened use case evaluates the authorization policy before changing the order's state.

The two implementations share the relevant domain model and persistence infrastructure, allowing the security difference to be demonstrated without maintaining two independent applications.

The vulnerable endpoint is intended only for controlled demonstrations and must not be exposed as a production capability.

## 11. Testing Strategy

Security verification is part of the development process rather than a final activity.

The project uses multiple testing levels as appropriate to each component:

- **Unit tests:** Domain behavior, use cases, and authorization policies.
- **Integration tests:** Interactions among application components, repositories, and API entry points.
- **Security tests:** Deliberately constructed attacks against vulnerable and hardened paths.
- **End-to-end tests:** Complete application workflows where required.

Deterministic test doubles can verify application security behavior without relying on nondeterministic LLM responses. Manual API validation can separately exercise the real agent runtime.

A successful model response is not proof of security. Tests must establish whether the application enforced the required controls and whether unauthorized state changes were prevented.

## 12. Technology Stack

The current backend uses:

| Component         | Technology                 |
| ----------------- | -------------------------- |
| Language          | Python                     |
| API framework     | FastAPI                    |
| Data validation   | Pydantic                   |
| Agent runtime     | OpenAI Agents SDK          |
| Database          | Turso / libSQL             |
| Authentication    | JWT                        |
| Automated testing | pytest, FastAPI TestClient |

**Planned:** React and TypeScript frontend.

Support for additional LLM providers, including Google Gemini and Groq, may be introduced later. The current OpenAI-specific adapter should not be interpreted as evidence that interchangeable provider adapters are already implemented.

## 13. Architectural Invariants

The following rules guide implementation and code review:

1. **The domain remains independent of infrastructure and agent frameworks.**
2. **LLM output cannot authorize an operation.**
3. **Security-sensitive tools delegate to application use cases rather than bypassing them.**
4. **Resource-level authorization is enforced using trusted identity and resource data.**
5. **Domain invariants remain enforced independently of the agent runtime.**
6. **External content and model-generated instructions are treated as untrusted input.**
7. **Authorization fails closed when the required context or permission is missing or invalid.**
8. **Security controls must be testable independently of the LLM wherever practical.**
9. **Vulnerable implementations remain isolated to controlled demonstrations.**

These invariants are architectural requirements. Their compliance must be verified against the implementation as the project evolves.

## 14. Architectural Trade-offs

Hexagonal Architecture introduces additional interfaces, adapters, and indirection compared with a simple CRUD application.

That complexity is justified when it protects meaningful boundaries, such as persistence, LLM integration, authorization, and application use cases.

However, abstractions should not be introduced solely for theoretical completeness. Each abstraction should have a clear responsibility and a practical benefit for testability, change isolation, or security enforcement.

The architecture is intentionally pragmatic and may evolve as new requirements are implemented.

## 15. Evolution

The architecture document will evolve when meaningful implementation decisions change.

Future work may include:

- A frontend for interactive security demonstrations.
- Additional vulnerable and hardened scenarios.
- Further agent capabilities and tool boundaries.
- Additional LLM provider adapters.
- Broader security and end-to-end verification.

These are potential extensions, not claims that the corresponding capabilities are already implemented.

---

**Core principle:** AgenticEnclave is designed so that an incorrect or manipulated agent request does not automatically become an authorized application action. Security decisions remain the responsibility of application-controlled code.

## Author

**Fernando Magalhães**  
CEO – FM ByteShift Software

🌐 [fmbyteshiftsoftware.com](https://fmbyteshiftsoftware.com/)  
🔐 [Cybersecurity Pain Intelligence](https://cybersecuritypainintelligence.com/)
