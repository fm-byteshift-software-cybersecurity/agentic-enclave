# AgenticEnclave — Threat Model

## 1. Purpose

This document defines the security threat model for **AgenticEnclave**, an AI-powered customer support application designed to demonstrate secure engineering practices for AI agent systems.

The project focuses on a limited set of representative application security and AI agent risks. Each implemented scenario should demonstrate a complete security development cycle:

```text
Threat
  ↓
Security Requirement
  ↓
Attack Scenario
  ↓
Vulnerable Implementation
  ↓
Security Test
  ↓
Hardened Implementation
  ↓
Regression Test
```

The core security principle is:

> **An AI agent may request an action. Trusted application code must decide whether that action is allowed.**

Neither the LLM nor the agent runtime is an authorization boundary. Authentication, authorization, resource ownership, business invariants, and tool permissions must be enforced by trusted application components.

This document distinguishes the **current implementation** from **planned scenarios**. Listing a scenario does not imply that its functionality, mitigation, or security tests have already been implemented.

## 2. System Scope and Status

### 2.1 Current Implementation

The current backend includes:

- A FastAPI application with authenticated order cancellation endpoints.
- Integration with the OpenAI Agents SDK.
- Application use cases for order cancellation.
- An authorization policy that checks whether the authenticated actor may cancel the requested order on the hardened path.
- A repository port and a Turso/libSQL persistence adapter.
- A deliberately vulnerable order cancellation path that omits customer ownership authorization.
- A lab-isolation control that prevents the vulnerable path from accessing orders belonging to another lab.
- Automated tests covering the vulnerable and hardened cancellation behaviors.

The current security demonstration is **SEC-01 — Broken Object Level Authorization (BOLA)**, implemented for order cancellation.

The vulnerable path demonstrates unauthorized cross-customer cancellation within the same lab. It does not intentionally disable every security control.

### 2.2 Planned or Not Yet in Scope

The broader customer support architecture and the remaining scenarios in this document are design targets, not claims about current functionality.

A frontend, multiple cooperating agents, external content ingestion, support ticket workflows, and scenarios SEC-02 through SEC-10 must be considered planned until their implementations and security tests are verified.

### 2.3 Current Request Flow

```text
Authenticated Client
        |
        v
     FastAPI
        |
        v
 OpenAI Agent Runtime
        |
        v
   Tool Adapter
        |
        v
 Application Tool
        |
        v
 Cancellation Use Case
        |
        +---- Vulnerable path
        |       |
        |       +---- Lab-isolation check
        |       |
        |       +---- Customer ownership check omitted
        |
        +---- Hardened path
                |
                +---- Customer ownership authorization
        |
        v
 Order Repository Port
        |
        v
   Turso / libSQL
```

The vulnerable and hardened paths intentionally differ in their customer ownership authorization behavior. Lab isolation remains enforced on the vulnerable path.

The exact checks and their ordering depend on the selected use case. The security model must not imply that both paths enforce identical authorization policies.

## 3. Security Objectives

### Confidentiality

Users must not access customer or order information outside their authorization. Future scenarios may also cover support history, internal information, and sensitive agent context.

### Integrity

Users and agents must not cause unauthorized state changes, such as cancelling another customer's order through a protected endpoint or bypassing required business rules.

### Availability

Agent execution must not cause uncontrolled loops, excessive tool calls, or unreasonable provider and infrastructure costs. These risks are recognized but are not the focus of the current SEC-01 implementation.

### Authorization

Privileged operations must be authorized by trusted application code. Authorization must not depend solely on:

- LLM output or reasoning;
- system prompts or agent instructions;
- tool descriptions or tool selection;
- user-provided claims about identity, ownership, or permission;
- messages from another agent.

### Lab Isolation

Resources belonging to one lab must not be accessible through another lab's execution context.

Lab isolation is a separate security boundary from customer ownership authorization. A request may be within the correct lab and still be unauthorized because the requested order belongs to another customer.

## 4. Assets

The threat model considers the following assets. Not all of them are present in the current implementation.

| Asset                                             | Security concern                        | Current status                       |
| ------------------------------------------------- | --------------------------------------- | ------------------------------------ |
| Customer identity and account data                | Unauthorized access or modification     | Partially represented                |
| Order identifiers, status, and customer ownership | Unauthorized access or state changes    | Implemented                          |
| Lab ownership and resource isolation              | Cross-lab access                        | Implemented for SEC-01 cancellation  |
| Tool definitions and capabilities                 | Misuse or excessive privileges          | Order cancellation tool implemented  |
| Authentication and authorization context          | Spoofing, substitution, or misuse       | Implemented for the current API flow |
| LLM provider credentials                          | Secret disclosure or unauthorized use   | Configuration and deployment concern |
| Agent instructions and context                    | Manipulation or disclosure              | Relevant to planned scenarios        |
| Support tickets and history                       | Unauthorized disclosure or modification | Planned                              |
| Inter-agent messages and privileges               | Forgery or privilege escalation         | Planned                              |

Provider credentials must remain in server-side configuration or an appropriate secret management mechanism. They must not be exposed as user-facing application data or unnecessarily included in prompts.

## 5. Actors

### Customer

An authenticated user who interacts with the application and requests permitted operations.

### Malicious Customer

An authenticated user attempting to access another customer's resources, trigger unauthorized operations, manipulate agent behavior, or bypass business rules.

### AI Agent

A model-driven component capable of requesting application tools. It is not trusted to make final authorization decisions.

### Manipulated or Malfunctioning Agent

An agent whose behavior has been influenced by prompt injection, misleading context, model error, or potentially malicious agent messages. Multi-agent compromise is a planned threat area, not part of the current SEC-01 flow.

### LLM Provider

An external inference service. Its output is treated as untrusted input to the application, and the provider is not an authorization boundary.

### External Content Source

Potentially malicious content, such as documents, emails, web pages, or support messages. Ingestion of these sources is a planned threat area.

## 6. Trust Boundaries

### Boundary 1 — Client to API

Client-supplied data is untrusted. The API must validate requests and derive the authenticated identity from trusted authentication mechanisms, not arbitrary request fields.

### Boundary 2 — User Input to Agent

User prompts can influence model behavior but do not grant permission. The model may interpret a request incorrectly or follow malicious instructions.

### Boundary 3 — Agent to Tool and Application Use Case

The agent's tool call is a request, not an authorization decision. The application must independently enforce the relevant security controls before performing a privileged operation.

```text
Agent Tool Request
        ↓
Trusted Application Checks
        ↓
Use Case and Domain Rules
        ↓
State Change Only If Permitted
```

### Boundary 4 — Application to LLM Provider

Provider responses may be incorrect, manipulated, or malformed. Validate output that influences application behavior, and do not delegate authorization or protected state changes to the model.

### Boundary 5 — Lab to Lab

An order must not be accessible through a cancellation request originating from a different lab.

For SEC-01, the vulnerable cancellation use case checks whether the requested order belongs to the authenticated actor's lab before retrieving and modifying the order. A failed check raises `EntityNotFound`, resulting in a `404 Not Found` response.

This response is intended to avoid disclosing whether an order exists outside the caller's lab.

### Boundary 6 — External Content to Agent (Planned)

External content may contain instructions intended to manipulate the agent. Treat it as data, not as trusted application instructions.

### Boundary 7 — Agent to Agent (Planned)

A message from one agent must not automatically grant privileges to another. The receiving component must operate with explicit, trusted identity and authorization context.

## 7. Security Scenario Catalogue

The catalogue includes the current SEC-01 implementation and candidate scenarios for future iterations.

| ID     | Category                       | Scenario                                     | Primary mapping                                                                     | Status      |
| ------ | ------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------- | ----------- |
| SEC-01 | Application Security           | BOLA / IDOR in order cancellation            | OWASP API Security Top 10:2023 API1; OWASP Top 10:2025 A01; CWE-639                 | Implemented |
| SEC-02 | Application and Agent Security | Broken Access Control / Excessive Privileges | OWASP Top 10:2025 A01; CWE-862 or CWE-863 when supported by the root cause          | Planned     |
| SEC-03 | AI and Application Security    | Sensitive Information Disclosure             | OWASP GenAI LLM Top 10:2025 LLM02; verify edition before implementation             | Planned     |
| SEC-04 | Application Security           | Business Logic Violation                     | OWASP Top 10:2025 A06; CWE-841 where workflow enforcement is the cause              | Planned     |
| SEC-05 | AI Security                    | Direct Prompt Injection                      | OWASP GenAI LLM Top 10:2025 LLM01; agentic mappings depend on the attack            | Planned     |
| SEC-06 | AI Security                    | Indirect Prompt Injection                    | OWASP GenAI LLM Top 10:2025 LLM01; agentic mappings depend on the attack            | Planned     |
| SEC-07 | Agentic Security               | Excessive Agency                             | Verify the relevant OWASP GenAI and agentic taxonomy editions before implementation | Planned     |
| SEC-08 | Agentic Security               | Tool Misuse / Unauthorized Tool Invocation   | Verify the relevant OWASP agentic taxonomy edition before implementation            | Planned     |
| SEC-09 | Multi-Agent Security           | Agent-to-Agent Privilege Escalation          | Verify the relevant OWASP agentic taxonomy edition before implementation            | Planned     |
| SEC-10 | AI and Application Security    | Improper Output Handling                     | Verify the relevant OWASP GenAI taxonomy edition before implementation              | Planned     |

### Taxonomy Notes

Traditional application security mappings use the relevant OWASP Top 10 and API Security editions. AI-related mappings must be checked against the specific edition cited when a scenario is implemented.

Do not carry category identifiers forward from an older edition without verification. A CWE mapping should identify a specific weakness only when it fits the scenario's root cause.

The catalogue does not imply that AgenticEnclave currently implements all these risks.

References:

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP GenAI Security Project](https://genai.owasp.org/)
- [OWASP API Security Project](https://owasp.org/www-project-api-security/)

## 8. SEC-01 — BOLA / IDOR

**Status: Implemented**

### Vulnerability

Broken Object Level Authorization (BOLA), also commonly discussed as Insecure Direct Object Reference (IDOR), occurs when an application accepts a resource identifier but fails to verify that the authenticated actor is permitted to perform the requested operation on that specific resource.

Authentication alone does not establish ownership or permission to modify an order.

### Attack Scenario

An authenticated customer submits an order identifier belonging to another customer to the order cancellation operation.

The current demonstration uses:

```text
POST /api/vulnerable/orders/cancel
POST /api/orders/cancel
```

The vulnerable endpoint intentionally omits customer ownership authorization. The hardened endpoint enforces that authorization before changing the order state.

The vulnerable endpoint also enforces lab isolation. This prevents the demonstration from turning into unrestricted cross-lab access.

### Root Cause

The vulnerable use case performs the requested operation without checking whether the authenticated actor is authorized to cancel the specific order.

The order identifier is client-controlled input. Supplying a valid identifier must not, by itself, grant permission to modify the corresponding resource.

### Impact

An attacker may cancel another customer's order within the same lab, violating order integrity and potentially causing operational or financial consequences.

The current scenario demonstrates unauthorized state modification. It does not claim to demonstrate unauthorized read access or every form of BOLA.

### Security Mapping

- **OWASP API Security Top 10:2023:** API1 — Broken Object Level Authorization.
- **OWASP Top 10:2025:** A01 — Broken Access Control.
- **CWE-639:** Authorization Bypass Through User-Controlled Key.

These mappings describe the underlying authorization weakness rather than merely the presence of an order identifier in a request.

### Vulnerable and Hardened Behavior

| Scenario                                            | Vulnerable endpoint                | Hardened endpoint                                    |
| --------------------------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| Cancel own order within the same lab                | Allowed when business rules permit | Allowed when authorization and business rules permit |
| Cancel another customer's order within the same lab | Allowed to demonstrate BOLA        | Denied with `403 Forbidden`                          |
| Cancel an order belonging to another lab            | Denied with `404 Not Found`        | Denied by resource access controls                   |

### Lab-Isolation Control

The vulnerable cancellation use case calls the repository's `belongs_to_lab` operation before retrieving and modifying the order.

The repository checks the order ID and lab owner ID against the persisted order record.

If the order does not belong to the actor's lab, the use case raises `EntityNotFound`. The order is not modified.

This control is deliberately separate from customer ownership authorization. It limits the vulnerable demonstration to a single lab without fixing the intended same-lab BOLA condition.

### Hardened Design

The application evaluates the authenticated actor, the requested order, and the requested operation before changing state.

```text
Authenticated Actor
        +
Requested Order
        +
Requested Operation
        ↓
Ownership Authorization
        ↓
Allow or Deny
        ↓
Domain Operation Only If Allowed
```

The authorization check belongs in trusted application code. The model's tool selection or assertions about the user must not determine resource ownership.

### Verification

Automated tests and manual API validation verify the following behaviors:

1. A customer can cancel another customer's order through the vulnerable path when both belong to the same lab.
2. The vulnerable path rejects an order belonging to another lab.
3. The hardened path rejects cancellation of another customer's order.
4. Rejected operations leave the order's persisted status unchanged.
5. Authorized cancellation remains possible when domain rules permit it.

The automated test suite passed with **46 tests** at the time of this documentation update.

The test count is a snapshot and may change as the project evolves.

## 9. Guidance for Future Scenarios

The following sections define intended outcomes for future scenarios. They are security requirements, not statements that the corresponding functionality or defenses have already been implemented.

### SEC-02 — Broken Access Control / Excessive Privileges

**Threat:** A user or agent can invoke a capability beyond the permissions intended for that identity or role.

**Required control:** Define permitted capabilities explicitly and enforce authorization in trusted application code. Do not infer authorization from the fact that a tool is registered or available to an agent.

**Verification goal:** An actor without the required permission cannot execute the capability, even when the agent requests it.

### SEC-03 — Sensitive Information Disclosure

**Threat:** The application returns data to a user who is not authorized to receive it, whether disclosure is triggered by a prompt or by a traditional access control flaw.

**Required control:** Enforce access control before sensitive data enters model context and before a response is returned. Prompt instructions alone are not an adequate confidentiality control.

**Verification goal:** Unauthorized data is not retrieved or disclosed. Classify the root cause separately when the issue is resource authorization, excessive agency, prompt injection, or output handling.

### SEC-04 — Business Logic Violation

**Threat:** An operation is allowed even though the current domain state violates a required business workflow.

**Example:** Cancelling an order after shipment when the business rules prohibit cancellation at that stage.

**Required control:** Enforce valid state transitions and business invariants in domain/application logic, independently of the agent's recommendation.

**Verification goal:** An invalid transition is rejected and the persisted state remains unchanged.

### SEC-05 — Direct Prompt Injection

**Threat:** A user supplies instructions intended to override the agent's intended task or influence its tool use.

**Required control:** Treat prompt-level safeguards as defense in depth. All resulting tool requests must still be constrained by application authorization, validation, and least privilege.

**Verification goal:** A manipulated agent cannot use the prompt alone to bypass application controls.

### SEC-06 — Indirect Prompt Injection

**Threat:** Malicious instructions embedded in external content influence the agent after that content is ingested.

**Required control:** Treat external content as untrusted data, separate data from trusted instructions where possible, limit agent capabilities, and enforce authorization outside the model.

**Verification goal:** Malicious content cannot independently grant access or authorize a protected operation.

### SEC-07 — Excessive Agency

**Threat:** An agent is given more tools, permissions, or autonomy than its task requires, increasing the impact of model errors or manipulation.

**Required control:** Apply least privilege to tools and permissions. Constrain autonomy and resource consumption to the intended workflow.

**Verification goal:** Unnecessary capabilities are unavailable or denied, and execution has appropriate limits.

### SEC-08 — Tool Misuse / Unauthorized Tool Invocation

**Threat:** The agent requests a legitimate tool in an unauthorized context or with parameters that would cause an impermissible action.

**Required control:** Validate tool arguments and authorize the actor, capability, resource, and operation in trusted application code before executing the use case.

**Verification goal:** A tool request cannot bypass authorization merely because the tool is registered with the agent.

### SEC-09 — Agent-to-Agent Privilege Escalation

**Threat:** A receiving agent trusts a message or claim from another agent as proof of permission.

**Required control:** Preserve explicit, trusted identity and authorization context across agent boundaries. A message must not itself grant privileges.

**Verification goal:** A lower-privileged agent cannot obtain a higher-privileged capability by claiming that another agent approved the request.

### SEC-10 — Improper Output Handling

**Threat:** Model-generated output is used by a downstream component without validation, contextual encoding, or controls appropriate to the destination.

**Required control:** Treat model output as untrusted input. Validate schemas and values, use parameterized database operations, apply contextual output encoding, and avoid passing model output directly to shell commands, SQL, file paths, or other sensitive sinks.

**Verification goal:** Crafted model output cannot trigger an unsafe downstream operation.

## 10. Security Control Model

The following controls guide implementation across scenarios. They must be applied where relevant and verified rather than assumed to exist everywhere.

### Least Privilege

Expose only the tools and permissions required for the agent's task.

### Deny by Default

Reject operations when authorization cannot be established. Missing or invalid authorization context must not result in access being granted.

### Server-Side Authorization

Enforce access decisions in trusted application code, not in client-side checks, prompts, or model-generated explanations.

### Resource-Level Authorization

Evaluate the actor, the specific resource, and the requested operation. A valid identity does not imply access to every resource.

### Lab Isolation

Constrain resource access to the authorized lab context. Lab isolation is not a replacement for resource ownership authorization.

### Tool-Level Authorization

Tool registration establishes availability to the agent, not permission for every user or execution context to invoke it.

### Domain Invariants

Enforce valid business state transitions independently of model output.

### Input and Output Validation

Validate external inputs and model-generated values according to their use. Validation does not replace authorization.

### Explicit Execution Context

Pass authenticated identity and required authorization context through application-controlled mechanisms. Do not accept identity or privilege claims supplied only by the model or user.

### Agent Isolation

Do not implicitly inherit privileges between agents. Any future inter-agent workflow must define its identity, capability, and authorization model explicitly.

## 11. Verification Strategy

Each implemented scenario should have tests for the vulnerable behavior and the hardened behavior.

Where practical, tests should verify:

- the response or raised error;
- whether the requested operation was executed;
- the resulting persisted state;
- that unauthorized data was not returned;
- that the hardened behavior remains enforced after later changes.

Use unit tests for domain and application rules, integration tests for API and persistence behavior, and adversarial tests for the specific attack path. Manual testing can supplement automated coverage but should not replace repeatable regression tests.

The vulnerable implementation exists only to demonstrate the security flaw in a controlled environment. It must remain clearly separated from the hardened path and must not be presented as suitable for production use.

## 12. Secure Development Cycle

For each scenario, follow this cycle:

```text
Threat Modeling
      ↓
Security Requirement
      ↓
Vulnerable Implementation
      ↓
Reproducible Security Test
      ↓
Hardened Design
      ↓
Regression Test
      ↓
Documentation of Evidence and Limitations
```

Security tests should remain part of the project test suite so that later changes do not silently reintroduce a fixed vulnerability.

## 13. Scope Boundaries

The project prioritizes depth over breadth. Potential future topics include:

- agentic supply chain attacks;
- memory and context poisoning;
- cascading agent failures;
- rogue agents;
- unexpected code execution;
- unbounded consumption and cost abuse;
- model or training data poisoning;
- vector and embedding weaknesses;
- AI-specific denial-of-service scenarios.

These topics are not considered implemented merely because they appear in this list. Their inclusion depends on whether a clear threat scenario, controlled demonstration, mitigation, and repeatable tests can be developed.

## 14. Core Security Principle

```text
AI / Agent Layer
       |
       | Requests an Action
       v
Trusted Application
       |
       +---- Validates Input
       +---- Authenticates the Actor
       +---- Enforces Applicable Authorization
       +---- Enforces Resource Isolation
       +---- Invokes the Use Case
                    |
                    v
               Domain Rules
                    |
                    v
                Persistence
```

The model reasons and proposes.

The agent requests.

The application authenticates, authorizes, and enforces resource isolation.

The domain enforces business invariants.

The infrastructure persists the permitted result.

This separation is the fundamental security principle of AgenticEnclave.

## Author

**Fernando Magalhães**  
CEO — FM ByteShift Software

[fmbyteshiftsoftware.com](https://fmbyteshiftsoftware.com/)  
[Cybersecurity Pain Intelligence](https://cybersecuritypainintelligence.com/)
