# SEC-01 — Broken Object Level Authorization (BOLA)

## 1. Overview

**ID:** SEC-01  
**Category:** Traditional Application Security  
**Status:** Implemented  
**OWASP API Security Top 10:** API1:2023 — Broken Object Level Authorization  
**OWASP Top 10:2025:** A01 — Broken Access Control  
**CWE:** CWE-639 — Authorization Bypass Through User-Controlled Key

This scenario demonstrates a Broken Object Level Authorization (BOLA) vulnerability in an AI-powered order management workflow.

BOLA occurs when an application allows an authenticated user to access or modify a resource without verifying whether that user is authorized to perform the requested operation on that specific resource.

The vulnerability exists at the object authorization level. Authentication may be functioning correctly, and the user may legitimately access the endpoint, while authorization for the targeted resource is missing.

OWASP recommends checking object-level authorization whenever an API operation accesses a resource using an identifier supplied by the client. <https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/>

## 2. Security Objective

Ensure that an authenticated customer can cancel only orders they are authorized to cancel.

The application must enforce resource-level authorization independently of the LLM's reasoning, instructions, and tool selection.

The security requirement is:

> An authenticated user must not be able to cancel another customer's order by supplying its identifier, even when the AI agent requests that operation.

## 3. System Context

The scenario uses two implementations of the same order cancellation capability.

| Component                        | Vulnerable path                      | Hardened path                  |
| -------------------------------- | ------------------------------------ | ------------------------------ |
| API endpoint                     | `POST /api/vulnerable/orders/cancel` | `POST /api/orders/cancel`      |
| Authentication                   | Required                             | Required                       |
| Order retrieval                  | Implemented                          | Implemented                    |
| Resource ownership authorization | Missing                              | Enforced                       |
| Domain cancellation rules        | Applied by the use case/domain       | Applied by the use case/domain |
| Expected cross-customer result   | Cancellation succeeds                | Request is denied              |

Both endpoints are intentionally available for controlled security testing. The vulnerable endpoint exists only to demonstrate the flaw and is not suitable for production use.

## 4. Assets and Security Boundaries

### Protected assets

- Order records and their status.
- The association between an order and its customer.
- The integrity of order cancellation operations.
- The authenticated user's identity and authorization context.

### Trust boundaries

The relevant boundaries are:

1. **Client to API:** Request data, including the order identifier, is untrusted.
2. **Agent to tool:** The model may request an operation but cannot authorize it.
3. **Application to domain and persistence:** Only operations permitted by trusted application logic may change state.

The order identifier identifies the requested resource. It does not establish that the caller owns that resource.

## 5. Threat Actor and Preconditions

### Threat actor

An authenticated customer attempting to cancel an order belonging to another customer.

### Preconditions

- Two distinct customer accounts exist.
- Each customer has an order.
- The attacker can authenticate as Customer A.
- The attacker knows or obtains Customer B's order identifier.
- The cancellation endpoint accepts an order identifier from the request.

The attacker does not need to compromise another account or bypass authentication. The attack targets missing authorization after authentication.

## 6. Attack Scenario

Assume the following data:

| Customer   | Order ID | Initial status |
| ---------- | -------: | -------------- |
| Customer A |     1842 | Pending        |
| Customer B |     1844 | Pending        |

The attacker authenticates as Customer A and submits a cancellation request for order `1844`, which belongs to Customer B.

### Vulnerable execution

```text
Customer A
    │
    │ Authenticated request: cancel order 1844
    ▼
Vulnerable API endpoint
    │
    ▼
Vulnerable cancellation use case
    │
    │ No ownership authorization check
    ▼
Order cancellation
    │
    ▼
Order 1844 becomes CANCELLED
```

The application recognizes the caller as authenticated but does not verify whether the caller is authorized to cancel the requested order.

### Hardened execution

```text
Customer A
    │
    │ Authenticated request: cancel order 1844
    ▼
Hardened API endpoint
    │
    ▼
Cancellation use case
    │
    ▼
Load order 1844
    │
    ▼
Authorization policy
    │
    │ Customer A is not the order owner
    ▼
Authorization denied
    │
    ▼
Order remains PENDING
```

The application retrieves the requested order and evaluates the authenticated actor's permission against the order's ownership before executing the cancellation.

## 7. Root Cause

The vulnerable implementation does not enforce resource-level authorization before performing the state-changing operation.

The underlying design error is treating successful authentication and access to the cancellation function as sufficient permission to cancel any order.

The order identifier is client-controlled input. Knowing a valid identifier must not grant access to the corresponding resource.

## 8. Impact

Successful exploitation may cause:

- Unauthorized cancellation of another customer's order.
- Loss of order integrity.
- Operational disruption and customer dissatisfaction.
- Potential financial or contractual consequences, depending on the business workflow.

This scenario demonstrates unauthorized state modification. It does not, by itself, demonstrate disclosure of order contents or other customer data.

## 9. Security Classification

### OWASP API Security Top 10:2023

**API1 — Broken Object Level Authorization.**

This classification directly addresses APIs that use client-supplied object identifiers without verifying the caller's authorization for the requested object. <https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/>

### OWASP Top 10:2025

**A01 — Broken Access Control.**

This is the broader application security category covering authorization failures.

### CWE-639

**Authorization Bypass Through User-Controlled Key.**

This mapping applies when a user-controlled identifier is used to bypass authorization and access another user's record. CWE-639 is appropriate for this demonstration because the attacker changes the requested order identifier to target another customer's order.

## 10. Hardened Design

The hardened implementation must enforce authorization in trusted application code.

The decision must account for:

- **Actor:** The authenticated customer, derived from trusted authentication context.
- **Resource:** The order retrieved from the repository.
- **Operation:** Cancellation of that specific order.
- **Policy:** Whether the actor is authorized to perform that operation on that resource.

Conceptually:

```text
Authenticated Actor
        +
Requested Order
        +
Requested Operation
        │
        ▼
Authorization Policy
        │
        ├── Denied → Reject request
        │
        └── Allowed
                │
                ▼
          Domain cancellation
                │
                ▼
          Persist new state
```

### Required properties

1. The actor's identity must come from trusted authentication context, not from an LLM-generated claim.
2. The application must load the requested order and evaluate authorization against its actual ownership information.
3. Authorization must be checked before any state-changing operation.
4. A denied operation must leave the order unchanged.
5. Domain business rules must still be enforced after authorization succeeds.
6. Tool registration, model instructions, and the model's decision to call a tool must not replace application authorization.

Using unpredictable identifiers can make enumeration harder, but it is not a substitute for object-level authorization.

## 11. Verification Strategy

The vulnerability must be demonstrated with the same cross-customer attack against both implementations.

### Test A — Vulnerable implementation

**Given:**

- Customer A is authenticated.
- Order `1844` belongs to Customer B.
- Order `1844` is pending.

**When:**

Customer A requests cancellation of order `1844` through the vulnerable endpoint.

**Then:**

- The cancellation succeeds.
- The response indicates that the order was cancelled.
- The persisted status of order `1844` becomes `cancelled`.

This test confirms the intended vulnerable behavior.

### Test B — Hardened implementation

**Given:**

- Customer A is authenticated.
- Order `1844` belongs to Customer B.
- Order `1844` is pending.

**When:**

Customer A requests cancellation of order `1844` through the hardened endpoint.

**Then:**

- The API returns `403 Forbidden`.
- The application denies the operation.
- The persisted status of order `1844` remains `pending`.

This test confirms that resource-level authorization prevents the attack.

### Test C — Authorized cancellation

**Given:**

- Customer A is authenticated.
- The target order belongs to Customer A.
- The order is in a state that permits cancellation.

**When:**

Customer A requests cancellation of their own order through the hardened endpoint.

**Then:**

- Authorization succeeds.
- The domain cancellation rules are evaluated.
- The order is cancelled if all applicable business rules permit it.

This test guards against an implementation that blocks all cancellation requests rather than enforcing ownership correctly.

### Regression requirements

Automated tests should verify response codes and persisted state, not just the returned message. The security test must remain in the suite so future changes cannot silently remove the authorization check.

## 12. Evidence and Limitations

The current implementation demonstrates a cross-customer order cancellation through a vulnerable path and its rejection through a hardened path.

The demonstration is intentionally limited to object-level authorization for order cancellation. It does not claim to demonstrate every form of BOLA, such as unauthorized read access, access to other resource types, or authorization failures across multiple services.

The scenario also does not establish that all possible authorization paths in the application have been reviewed. Each additional endpoint that accesses a resource by identifier requires its own authorization analysis and appropriate tests.

## 13. References

- [OWASP API Security Top 10:2023 — API1: Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API Security Top 10:2023 — Overview](https://api-security.owasp.org/editions/2023/en/0x11-t10/)
- [CWE-639 — Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)
- [OWASP Top 10:2025 — A01 Broken Access Control](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)

## Author

**Fernando Magalhães**  
CEO – FM ByteShift Software

🌐 [fmbyteshiftsoftware.com](https://fmbyteshiftsoftware.com/)  
🔐 [Cybersecurity Pain Intelligence](https://cybersecuritypainintelligence.com/)
