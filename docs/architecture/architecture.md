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
- **Security by design:** Enforce security controls at application execution boundaries.
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

For example, `TursoOrderRepository` implements the `OrderRepository` port consumed by application use cases. The use cases do not need to know how Turso stores or retrieves orders.

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
- Evaluating authorization policies where required
- Defining permissions and actor context
- Defining application tool contracts
- Accessing persistence through repository ports
- Enforcing lab isolation in the vulnerable demonstration flow

The implemented cancellation flow includes `CancelOrderUseCase`, `VulnerableCancelOrderUseCase`, the relevant cancellation tools, `AuthorizationPolicy`, `Actor`, `Permission`, and `OrderRepository`.

The hardened and vulnerable use cases intentionally enforce different security rules. This difference is required to demonstrate BOLA and its mitigation.

Application-level authorization, lab isolation, and domain business rules serve different purposes and must remain separate.

### 5.3 Ports

Ports define the interfaces required by application logic.

The current order workflow uses `OrderRepository`, which abstracts order retrieval and persistence.

The repository port also exposes `belongs_to_lab(order_id, lab_owner_id)`, allowing application logic to verify that an order belongs to the authenticated user's lab without depending on the database implementation.

A port describes what the application needs rather than how an external system implements it.

Additional ports should be introduced when a real application requirement justifies them.

### 5.4 Primary Adapters

Primary adapters provide entry points into application behavior.

The current primary adapter is the FastAPI REST API, implemented through `backend/app/main.py` and the API authentication components.

Its responsibilities include:

- Receiving HTTP requests
- Establishing the authenticated user context
- Invoking the appropriate runtime or application flow
- Mapping application failures to HTTP responses
- Returning serialized results

HTTP handling should not become the sole enforcement point for resource-level authorization. Security-sensitive use cases must enforce the rules required for their operations.

### 5.5 Secondary Adapters

Secondary adapters connect application behavior to external technologies.

The current implementation includes:

- **Turso / libSQL:** Persistence through the database repository adapter.
- **OpenAI Agents SDK:** Agent execution and function-tool integration.

`TursoOrderRepository` implements the repository port, including the lab-membership query used to isolate demonstration environments.

Provider-specific SDK objects and database implementation details should remain outside the domain.

## 6. AI Agent Execution

Agents are application capabilities orchestrated through an external agent runtime. They are not domain entities and do not constitute a trusted authorization boundary.

The current Orders Agent can request an order-cancellation operation through a registered function tool.

The general execution flow is:

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
       Application Tool
            │
            ▼
        Use Case
            │
            ▼
      OrderRepository
            │
            ▼
       Turso Database
```

The exact use case and security checks depend on the endpoint being exercised.

The model interprets the request and may generate a tool call containing an `order_id`. The tool adapter passes the arguments to the application tool, which delegates to the appropriate use case.

The authenticated actor is derived from the application context established by the API, not from an order ID or identity claimed by the LLM.

The model can request an operation, but the application determines whether it may proceed.

## 7. Authorization and Lab Isolation

Authorization and lab isolation are distinct security controls.

### 7.1 Hardened Path: Customer Ownership

The hardened cancellation path uses the application's authorization policy to determine whether the authenticated actor is permitted to cancel the requested order.

The policy checks customer ownership using trusted application identity and resource data. A customer cannot cancel another customer's order merely by supplying its ID.

Conceptually:

```text
Authenticated Actor
        │
        ▼
    Order Lookup
        │
        ▼
 Authorization Policy
        │
        ├── Denied → AuthorizationDenied
        │
        ▼
   Domain Operation
        │
        ▼
   Persist Changes
```

A denied ownership check prevents the state-changing operation. The API maps the relevant authorization failure to an HTTP response.

### 7.2 Vulnerable Path: BOLA Within a Lab

The vulnerable cancellation path deliberately omits customer-ownership authorization so that Broken Object Level Authorization (BOLA) can be demonstrated.

However, the vulnerable path does **not** remove every security boundary. It verifies that the requested order belongs to the authenticated actor's lab before retrieving and modifying it.

Its execution flow is:

```text
Authenticated Actor
        │
        ▼
VulnerableCancelOrderTool
        │
        ▼
VulnerableCancelOrderUseCase
        │
        ▼
 belongs_to_lab(order_id, actor.user_id)
        │
        ├── False → EntityNotFound → HTTP 404
        │
        ▼
    Order Lookup
        │
        ▼
    Domain Cancel
        │
        ▼
   Persist Changes
```

The repository check uses the order's `lab_owner_id`, not its `customer_id`.

This creates the intended demonstration boundary:

- **Same lab, different customer:** The vulnerable path permits cancellation if the order can otherwise be cancelled.
- **Different lab:** The vulnerable path rejects the request and returns the same not-found application error used for a nonexistent order.
- **Hardened path, different customer:** The hardened path denies cancellation even when the order belongs to the same lab.

Returning `EntityNotFound` for an order outside the actor's lab avoids exposing whether that order exists in another lab.

### 7.3 Trusted Context

The lab owner identifier is derived from the authenticated actor's application context. It must not be accepted as an arbitrary identity supplied by the LLM.

Authentication establishes identity; it does not automatically grant access to every resource.

Missing or invalid authorization context must not result in permission being granted.

## 8. Tool Architecture

Tools expose specific application capabilities to agents.

A tool is not equivalent to direct access to a database or an unrestricted application service.

The cancellation tools delegate to their respective application use cases, keeping the security decisions and business behavior within the application layer.

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
- **Authorization and isolation:** The current actor is permitted to access the resource within the relevant security boundary.
- **Business validity:** The operation satisfies domain rules.

Availability does not imply authorization, and authorization does not imply that a business operation is valid.

## 9. Business Rules and Security Controls

Security checks and domain rules answer different questions.

**Lab isolation:** Does the requested order belong to the authenticated actor's lab?

**Authorization:** Is this actor permitted to perform this operation on this resource?

**Domain rule:** Is this operation valid under the business rules?

For the vulnerable path, the intended sequence is:

```text
Lab Isolation Check
        ↓
Resource Retrieval
        ↓
Domain Rule Validation
        ↓
State Mutation
        ↓
Persistence
```

For the hardened path, the intended sequence is:

```text
Resource Retrieval
        ↓
Customer Ownership Authorization
        ↓
Domain Rule Validation
        ↓
State Mutation
        ↓
Persistence
```

These checks are not interchangeable. The vulnerable demonstration intentionally omits customer-ownership authorization, but retains lab isolation and domain-level cancellation rules.

## 10. Vulnerable and Hardened Implementations

AgenticEnclave uses paired implementations to demonstrate individual security weaknesses and their corresponding mitigations.

The vulnerable implementation intentionally omits a specific control. The hardened implementation enforces that control within the appropriate application boundary.

The current example is **SEC-01: Broken Object Level Authorization (BOLA)**.

The vulnerable implementation omits customer-ownership authorization while enforcing lab isolation through `OrderRepository.belongs_to_lab`. The hardened implementation checks customer ownership through the authorization policy before changing the order's state.

Both implementations share the relevant domain model and persistence infrastructure, allowing the security difference to be demonstrated without maintaining two independent applications.

The relevant API endpoints are:

- `POST /api/vulnerable/orders/cancel`
- `POST /api/orders/cancel`

The vulnerable endpoint is intended only for controlled demonstrations and must not be exposed as a production capability.

## 11. Testing Strategy

Security verification is part of the development process rather than a final activity.

The project uses multiple testing levels as appropriate to each component:

- **Unit tests:** Domain behavior, use cases, and authorization policies.
- **Integration tests:** Interactions among application components, repositories, and API entry points.
- **Security tests:** Deliberately constructed attacks against vulnerable and hardened paths.
- **End-to-end tests:** Complete application workflows where required.

For SEC-01, verification covers the intended differences between the paths:

- Same-lab, cross-customer cancellation is permitted by the vulnerable path when domain rules allow it.
- Cross-lab cancellation is rejected by the vulnerable path without modifying the order.
- Cross-customer cancellation is rejected by the hardened path without modifying the order.
- Domain rules continue to apply independently of the selected path.

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
4. **Resource-level authorization is enforced using trusted identity and resource data in the hardened path.**
5. **The vulnerable demonstration retains lab isolation even while omitting customer-ownership authorization.**
6. **Domain invariants remain enforced independently of the agent runtime.**
7. **External content and model-generated instructions are treated as untrusted input.**
8. **Security controls fail closed when required context or permission is missing or invalid.**
9. **Security controls must be testable independently of the LLM wherever practical.**
10. **Vulnerable implementations remain isolated to controlled demonstrations.**

These invariants are architectural requirements. Their compliance must be verified against the implementation as the project evolves.

## 14. Architectural Trade-offs

Hexagonal Architecture introduces additional interfaces, adapters, and indirection compared with a simple CRUD application.

That complexity is justified when it protects meaningful boundaries, such as persistence, LLM integration, authorization, and application use cases.

The lab-isolation check is expressed through the repository port so the application use case can enforce this boundary without depending on Turso-specific implementation details.

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
CEO — FM ByteShift Software

[fmbyteshiftsoftware.com](https://fmbyteshiftsoftware.com/)

[Cybersecurity Pain Intelligence](https://cybersecuritypainintelligence.com/)
