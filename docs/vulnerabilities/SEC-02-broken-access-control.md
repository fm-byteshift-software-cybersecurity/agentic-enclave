# SEC-02 — Broken Access Control / Excessive Privileges

## 1. Overview

**ID:** SEC-02  
**Category:** Application and Agent Security  
**Status:** Implemented  
**OWASP Top 10:2025:** A01 — Broken Access Control  
**CWE:** CWE-862 — Missing Authorization

This scenario demonstrates a Broken Access Control vulnerability in an AI-powered order management workflow, specifically focusing on excessive privileges at the agent capability level.

Broken Access Control occurs when an application allows an actor (in this case, a specific AI agent acting on behalf of a user) to invoke a capability or perform an operation that exceeds the permissions intended for that identity or role.

AgenticEnclave demonstrates this weakness through paired vulnerable and hardened order cancellation paths, explicitly testing the `customer_agent` role. The vulnerable implementation intentionally omits agent capability authorization but retains a separate lab-isolation control.

OWASP recommends explicitly defining permitted capabilities and enforcing authorization in trusted application code, rather than inferring authorization from the fact that a tool is registered or available to an agent.

Reference: [https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)

## 2. Security Objective

Demonstrate how missing capability-level authorization can allow an agent (e.g., `customer_agent`) to execute a privileged operation (e.g., order cancellation) that is outside its designated role, while verifying that the hardened implementation enforces capability checks and the vulnerable implementation still enforces lab isolation.

The application must enforce security controls independently of the LLM's reasoning, instructions, and tool selection.

The security requirements are:

- An agent without the `CANCEL_ORDER` permission must not be able to cancel an order through the hardened endpoint.
- The vulnerable endpoint must demonstrate the execution of the unauthorized capability by the restricted agent within the same lab.
- The vulnerable endpoint must not permit access to orders belonging to another lab.
- Rejected operations must leave the targeted order unchanged.

## 3. System Context

The scenario uses two implementations of the same order cancellation capability, explicitly invoked with the `customer_agent` context.

| Component                            | Vulnerable path                                  | Hardened path                          |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------- |
| API endpoint                         | `POST /api/vulnerable/customer/cancel`           | `POST /api/customer/cancel`            |
| Authentication                       | Required                                         | Required                               |
| Agent context                        | `agent_id="customer_agent"`                      | `agent_id="customer_agent"`            |
| Order retrieval                      | Implemented                                      | Implemented                            |
| Agent capability authorization       | Intentionally omitted                            | Enforced via `AuthorizationPolicy`     |
| Lab isolation                        | Enforced                                         | Enforced                               |
| Domain cancellation rules            | Applied                                          | Applied                                |
| `customer_agent` cancelling an order | Cancellation succeeds when lab isolation permits | Request is denied with `403 Forbidden` |
| Order belonging to another lab       | Request is rejected with `404 Not Found`         | Request is rejected                    |

Both endpoints are available for controlled security testing. The vulnerable endpoint exists exclusively to demonstrate the flaw and is not suitable for production use.

## 4. Assets and Security Boundaries

**Protected assets**

- Agent permission mappings and role definitions.
- Order records and their status.
- The association between an order and its lab.
- The integrity of order cancellation operations.
- The authenticated user's identity and agent execution context.

**Trust boundaries**
The relevant boundaries are:

- **Client to API:** Request data is untrusted. The API must derive the authenticated identity and agent context from trusted mechanisms.
- **Agent to tool:** The model may request an operation or select a tool, but it cannot authorize it. Tool availability does not imply execution permission.
- **Application to domain and persistence:** Trusted application logic determines whether the specific agent role is permitted to perform the operation.
- **Lab to lab:** An order belonging to one lab must not be accessible through another lab's execution context, regardless of the agent's permissions.

## 5. Threat Actor and Preconditions

**Threat actor**
An authenticated user interacting with a restricted agent (e.g., `customer_agent`), or a manipulated agent attempting to exceed its granted permissions by invoking a tool it should not be allowed to use.

**Preconditions**

- The application defines distinct agent roles with specific permissions (e.g., `orders_agent` has `CANCEL_ORDER`, `customer_agent` does not).
- The tool for order cancellation is registered or accessible in the execution environment.
- The attacker can authenticate and prompt the agent to attempt the restricted operation.
- The attacker targets an order within their own lab to bypass the baseline lab-isolation control.

## 6. Data Model and Isolation

Orders contain separate fields for customer ownership and lab ownership:

| Field          | Meaning                                      |
| -------------- | -------------------------------------------- |
| `id`           | Order identifier                             |
| `customer_id`  | Customer associated with the order           |
| `lab_owner_id` | Lab owner associated with the order          |
| `status`       | Current order state                          |
| `is_demo`      | Indicates whether the order is a demo record |

In this scenario, the critical trust variable is the `agent_id` within the `Actor` context, combined with the `lab_owner_id`.

The lab-isolation check is an additional security boundary. It does not replace agent capability authorization in the hardened implementation. Passing the lab-isolation check does not imply that the agent has the right to perform the requested action.

## 7. Attack Scenario

Consider a lab containing orders belonging to different customers, and an authenticated user interacting with the `customer_agent`.

**Vulnerable execution: same lab**
The user prompts the `customer_agent` to cancel order 1844, which belongs to another customer but remains within the user's lab (lab 1).

```text
User Request (via customer_agent)
     |
     | Authenticated request: cancel order 1844
     v
 Vulnerable API endpoint (/api/vulnerable/customer/cancel)
     |
     v
 Vulnerable cancellation tool
     |
     v
 Vulnerable cancellation use case
     |
     | Lab-isolation check succeeds (order 1844 is in lab 1)
     | Agent capability check is omitted
     v
 Order cancellation
     |
     v
 Order 1844 becomes CANCELLED
```

This is the intended excessive privileges demonstration: the application accepts the operation because it only verifies lab membership, ignoring that the `customer_agent` lacks the `CANCEL_ORDER` permission.

**Vulnerable execution: different lab**
The user prompts the `customer_agent` to cancel order 1845, which belongs to lab 2.

```text
User Request (via customer_agent)
     |
     | Authenticated request: cancel order 1845
     v
 Vulnerable API endpoint (/api/vulnerable/customer/cancel)
     |
     v
 Vulnerable cancellation tool
     |
     v
 Vulnerable cancellation use case
     |
     v
 Lab-isolation check
     |
     | Order does not belong to lab 1
     v
 EntityNotFound
     |
     v
 HTTP 404 Not Found
```

The operation is rejected before the order is modified. The response does not disclose whether the order exists in another lab.

**Hardened execution: unauthorized agent capability**
The user prompts the `customer_agent` to cancel order 1842 (which belongs to the user) through the hardened endpoint.

```text
User Request (via customer_agent)
     |
     | Authenticated request: cancel order 1842
     v
 Hardened API endpoint (/api/customer/cancel)
     |
     v
 Hardened cancellation use case
     |
     v
 Capability Authorization Check
     |
     | agent_id="customer_agent" lacks Permission.CANCEL_ORDER
     v
 Authorization denied
     |
     v
 HTTP 403 Forbidden
     |
     v
 Order remains unchanged
```

The hardened path enforces capability authorization before allowing the cancellation, regardless of lab membership or customer ownership.

## 8. Root Cause

The vulnerable implementation does not enforce agent capability authorization before performing the state-changing operation.

The underlying design error is treating the successful resolution of a tool call or the agent's role context as sufficient permission to execute the action, without consulting the centralized `AuthorizationPolicy`.

Tool registration establishes availability to the agent, not permission for every execution context to invoke it.

## 9. Impact

Successful exploitation of the vulnerable path may cause:

- Unauthorized state changes triggered by agents operating outside their designated scope.
- Violation of the principle of least privilege.
- Operational disruption if restricted agents are manipulated into performing administrative or destructive actions.
- Escalation of impact in the event of prompt injection or agent malfunction.

This scenario demonstrates unauthorized capability execution. It does not, by itself, demonstrate unauthorized read access or cross-lab data leakage.

## 10. Security Classification

**OWASP Top 10:2025**  
**A01 — Broken Access Control**  
This classification covers failures to enforce restrictions on what authenticated users or agents are allowed to do.  
Reference: [https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)

**CWE-862**  
**Missing Authorization**  
This mapping applies when the software does not perform an authorization check when an actor attempts to access a resource or perform an action.  
Reference: [https://cwe.mitre.org/data/definitions/862.html](https://cwe.mitre.org/data/definitions/862.html)

## 11. Hardened Design

The hardened implementation enforces capability authorization in trusted application code before any state change.

The decision must account for:

- **Actor:** The authenticated user and the specific `agent_id` executing the request.
- **Operation:** The specific capability being requested (e.g., `Permission.CANCEL_ORDER`).
- **Policy:** Whether the `agent_id` is explicitly granted this permission in the trusted configuration.

Conceptually:

```text
Authenticated Actor (with agent_id)
         +
 Requested Operation
         |
         v
 Capability Authorization Check
         |
         +---- Denied ----> Reject Request (403 Forbidden)
         |
         v
 Resource Retrieval & Lab Isolation
         |
         v
 Domain Rules
         |
         v
 Persist New State
```

**Required properties**

- The agent's identity (`agent_id`) must come from trusted application context, not from an LLM-generated claim.
- Authorization must be checked against the explicit permission map before executing the use case.
- A denied operation must leave the order unchanged.
- Domain business rules must still be enforced after capability authorization succeeds.
- Tool registration must not be conflated with execution permission.

## 12. Verification Strategy

Verification covers both the intended vulnerability and the security controls that remain enforced.

**Test A — Vulnerable cancellation by restricted agent within the same lab**  
_Given:_

- User 1 is authenticated.
- Order 1844 belongs to another customer but is in User 1's lab.
- The request is routed with `agent_id="customer_agent"`.  
  _When:_
- The request is sent to `/api/vulnerable/customer/cancel`.  
  _Then:_
- The API returns `200 OK`.
- The cancellation succeeds, and the persisted status becomes `cancelled`.  
  _(This confirms the intended vulnerable behavior.)_

**Test B — Vulnerable cancellation by restricted agent across labs**  
_Given:_

- User 1 is authenticated.
- Order 1845 belongs to lab 2.
- The request is routed with `agent_id="customer_agent"`.  
  _When:_
- The request is sent to `/api/vulnerable/customer/cancel`.  
  _Then:_
- The API returns `404 Not Found`.
- The persisted status remains unchanged.  
  _(This confirms that lab isolation remains enforced even in the vulnerable path.)_

**Test C — Hardened cancellation by restricted agent**  
_Given:_

- User 1 is authenticated.
- Order 1842 belongs to User 1 in lab 1.
- The request is routed with `agent_id="customer_agent"`.  
  _When:_
- The request is sent to `/api/customer/cancel`.  
  _Then:_
- The API returns `403 Forbidden`.
- The persisted status remains `pending`.  
  _(This confirms that capability authorization prevents the attack.)_

**Test D — Authorized cancellation by privileged agent (Regression)**  
_Given:_

- User 1 is authenticated.
- Order 1842 belongs to User 1.
- The request is routed with `agent_id="orders_agent"` (which has `CANCEL_ORDER`).  
  _When:_
- The request is sent to `/api/orders/cancel`.  
  _Then:_
- Authorization succeeds.
- The order is cancelled if business rules permit it.  
  _(This guards against an implementation that blocks all cancellation requests rather than enforcing role-based permissions correctly.)_

**Regression requirements**  
Automated tests must verify response codes and persisted state, not just response messages. The suite must retain coverage for restricted agent execution, cross-lab isolation, hardened capability enforcement, and privileged agent regression.

## 13. Evidence and Limitations

The current implementation includes:

- A vulnerable order cancellation path (`/api/vulnerable/customer/cancel`) that demonstrates excessive privileges by a restricted agent within the same lab.
- A lab-isolation check in the vulnerable cancellation use case.
- A hardened cancellation path (`/api/customer/cancel`) that enforces agent capability authorization via `AuthorizationPolicy`.
- Automated integration tests verifying API behavior and security boundaries for the `customer_agent` context.

The scenario is intentionally limited to capability-level authorization for order cancellation. It does not claim to demonstrate every form of broken access control, such as horizontal privilege escalation between users of the same role, or vertical escalation involving external content ingestion.

Passing these tests does not establish that every authorization path in the application has been reviewed. Each additional tool or endpoint requires its own capability authorization analysis and appropriate tests.

## 14. References

- [OWASP Top 10:2025 — A01 Broken Access Control](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)
- [CWE-862 — Missing Authorization](https://cwe.mitre.org/data/definitions/862.html)
- [OWASP Agentic AI Security Considerations](https://genai.owasp.org/)

---

**Author**  
Fernando Magalhães  
CEO — FM ByteShift Software  
[FM ByteShift Software](https://fmbyteshiftsoftware.com/)  
[Cybersecurity Pain Intelligence](https://cybersecuritypainintelligence.com/)
