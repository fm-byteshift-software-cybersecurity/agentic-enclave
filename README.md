# AgenticEnclave

**Security Engineering for AI Agent Systems**

AgenticEnclave is a security-focused AI application that demonstrates how vulnerabilities emerge in AI agent systems and how application-level controls can prevent them.

It combines software engineering, AI agent architecture, and application security in a realistic application, using paired vulnerable and hardened implementations to demonstrate attack paths, root causes, mitigations, and verification.

> An AI agent may request an action. The application must decide whether that action is allowed.

The LLM is not a security boundary. Authentication, authorization, resource isolation, and business rules must be enforced by the application independently of model instructions.

## Project Status

**Early development.**

The backend foundation and the first security scenario, Broken Object Level Authorization (BOLA), are implemented. The project includes authenticated API endpoints, vulnerable and hardened order cancellation paths, application-level security controls, lab isolation, and automated verification.

The first scenario demonstrates how omitting resource ownership authorization can allow an authenticated customer to cancel another customer's order within the same lab, while a separate isolation control prevents access to orders belonging to other labs.

The frontend and additional security scenarios remain under development.

## Architecture

AgenticEnclave follows **Hexagonal Architecture (Ports and Adapters)**, applying practical principles from Clean Architecture and Domain-Driven Design.

The architecture separates business rules from infrastructure and external services.

- **Domain:** Business entities, state transitions, and domain rules.
- **Application:** Use cases, authorization policies, permissions, and tool definitions.
- **Ports:** Interfaces that isolate application logic from external implementations.
- **Primary adapters:** API endpoints that receive external requests.
- **Secondary adapters:** Database and LLM integrations.

The backend uses Python, FastAPI, the OpenAI Agents SDK, and Turso/libSQL. LLM integration is implemented through an adapter to keep provider-specific code outside the core business logic.

### Agent Execution and Security Boundaries

An agent interprets a user request and may invoke a tool. The tool delegates the operation to an application use case, where the relevant security controls and business rules are enforced before the resource is modified.

```text
User Request
     |
     v
Orders Agent
     |
     v
Tool Invocation
     |
     v
Application Use Case
     |
     +---- Authorization / Isolation Checks
     |                 |
     |                 +---- Denied ----> Reject Operation
     |
     v
Domain Rules
     |
     v
Repository Port
     |
     v
Database Adapter
```

The exact checks depend on the implementation being exercised. The hardened path enforces resource ownership authorization. The vulnerable path intentionally omits that ownership check for the security demonstration, while retaining the lab-isolation control.

The model may select an operation and supply its arguments, but it cannot grant itself permission to execute that operation. Security enforcement remains in application-controlled code.

## Vulnerable and Hardened Implementations

Security scenarios are implemented as paired paths within the same application architecture.

- **Vulnerable path:** Reproduces a specific security weakness in a controlled environment.
- **Hardened path:** Implements the corresponding security control.
- **Verification:** Uses automated tests and API-level validation to demonstrate the difference in behavior.

The goal is to make the vulnerability, root cause, mitigation, and security boundary explicit without duplicating the entire application.

## Implemented Security Scenario

### SEC-01: Broken Object Level Authorization (BOLA)

BOLA occurs when an application allows a user to access or modify a resource without properly verifying that the user is authorized to perform the requested operation on that specific resource.

In AgenticEnclave, SEC-01 demonstrates the consequences of omitting resource ownership authorization from an order cancellation operation.

The vulnerable cancellation path allows an authenticated customer to cancel another customer's order **within the same lab**. This reproduces the BOLA condition in a controlled environment.

The hardened path enforces customer ownership authorization before allowing cancellation.

A separate lab-isolation control applies to the vulnerable path as well. An order belonging to another lab is rejected, even when the request targets an otherwise valid order ID. This keeps the demonstration scoped to the intended security boundary.

#### Security Controls

| Component                        | Responsibility                                                              |
| -------------------------------- | --------------------------------------------------------------------------- |
| Vulnerable cancellation use case | Demonstrates cancellation without customer ownership authorization          |
| Hardened cancellation use case   | Enforces authorization against the order owner                              |
| Lab-isolation check              | Prevents the vulnerable path from accessing orders belonging to another lab |
| Repository port                  | Defines the persistence operations and lab-membership contract              |
| Database adapter                 | Implements order retrieval, persistence, and lab-membership checks          |
| Integration tests                | Verify the observable API behavior and security boundaries                  |

#### Endpoints

- Hardened: `POST /api/orders/cancel`
- Vulnerable: `POST /api/vulnerable/orders/cancel`

Both endpoints require authentication. Authentication establishes the caller's identity; it does not automatically authorize access to every resource.

The vulnerable endpoint intentionally omits customer ownership authorization, but it is not completely unrestricted: lab isolation remains enforced. This distinction is essential to understanding the scope of the demonstration.

The vulnerable endpoint exists exclusively for controlled security demonstrations. It is not intended for production use.

#### Expected Behavior

| Scenario                                                | Vulnerable endpoint                                  | Hardened endpoint                                    |
| ------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Cancel an order belonging to the authenticated customer | Allowed, subject to lab isolation and business rules | Allowed, subject to authorization and business rules |
| Cancel another customer's order in the same lab         | Allowed to demonstrate BOLA                          | Rejected with `403 Forbidden`                        |
| Cancel an order belonging to another lab                | Rejected with `404 Not Found`                        | Rejected by resource access controls                 |

The `404 Not Found` response for an order outside the caller's lab avoids disclosing whether that order exists in another lab.

#### Verification

The scenario is verified through automated tests and manual API testing.

The test suite checks the vulnerable same-lab cancellation behavior, rejection of cross-lab access, and the hardened ownership control. The API-level checks also verify that rejected operations do not change the order's status.

The security demonstration therefore distinguishes two separate controls:

1. **Resource ownership authorization:** Prevents one customer from modifying another customer's order.
2. **Lab isolation:** Prevents access to resources outside the caller's lab.

These controls address different boundaries and must not be treated as interchangeable.

## Security Engineering Approach

Each security scenario follows a consistent process:

1. Identify the vulnerability and relevant trust boundary.
2. Reproduce the attack in the vulnerable implementation.
3. Establish the resulting impact.
4. Identify the root cause.
5. Implement the mitigation in the hardened path.
6. Verify the expected behavior through automated tests and, where appropriate, API-level testing.

The threat model evolves alongside the implementation and records relevant assets, actors, entry points, trust boundaries, attack paths, and security controls.

Planned areas of investigation include additional authorization weaknesses, excessive agency, prompt injection, tool abuse, sensitive information disclosure, and unsafe interactions between agents. These areas are not claimed as implemented security scenarios.

## Testing

Automated tests verify application behavior and security controls independently of the LLM wherever practical.

Testing covers application logic, API behavior, authorization decisions, repository contracts, and security scenarios. Deterministic test doubles are used where appropriate, while manual API validation can exercise the running application and its configured database.

The SEC-01 tests cover:

- BOLA reproduction through the vulnerable cancellation endpoint.
- Rejection of cross-lab order access.
- Ownership enforcement through the hardened endpoint.
- Preservation of order state when a cancellation request is rejected.

A successful model response alone is not considered evidence that an operation is secure. Verification must establish whether the application actually enforced the required security controls.

## Technology Stack

| Component       | Technology                    |
| --------------- | ----------------------------- |
| Backend API     | Python, FastAPI, Pydantic     |
| Agent framework | OpenAI Agents SDK             |
| Persistence     | Turso / libSQL                |
| Authentication  | JWT                           |
| Testing         | pytest, FastAPI TestClient    |
| Frontend        | Planned: React and TypeScript |

The frontend stack may evolve as implementation progresses.

## Responsible Use

AgenticEnclave is intended for security education, application security engineering, and authorized testing in controlled environments.

The vulnerable implementations are deliberately insecure and must not be deployed as production services or exposed to untrusted users.

## Development Roadmap

- **Backend foundation:** Domain model, application use cases, authentication, authorization, persistence, and agent execution.
- **Security scenarios:** Implement paired vulnerable and hardened paths with automated verification.
- **Frontend:** Build an interface for demonstrating attacks and mitigations.
- **Documentation:** Maintain architecture decisions, threat modeling, and technical records for implemented scenarios.

---

## Author

**Fernando Magalhães**  
CEO – FM ByteShift Software

🌐 [fmbyteshiftsoftware.com](https://fmbyteshiftsoftware.com/)  
🔐 [Cybersecurity Pain Intelligence](https://cybersecuritypainintelligence.com/)
