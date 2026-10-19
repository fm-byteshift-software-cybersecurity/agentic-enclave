# SEC-01 — Broken Object Level Authorization (BOLA)

## 1. Overview

**ID:** SEC-01  
**Category:** Traditional Application Security  
**Status:** Implemented  
**OWASP API Security Top 10:2023:** API1 — Broken Object Level Authorization  
**OWASP Top 10:2025:** A01 — Broken Access Control  
**CWE:** CWE-639 — Authorization Bypass Through User-Controlled Key

This scenario demonstrates a Broken Object Level Authorization (BOLA) vulnerability in an AI-powered order management workflow.

BOLA occurs when an application allows an authenticated user to access or modify a resource without verifying whether that user is authorized to perform the requested operation on that specific resource.

The vulnerability exists at the object authorization level. Authentication may be functioning correctly, and the user may legitimately access the endpoint, while authorization for the targeted resource is missing.

AgenticEnclave demonstrates this weakness through paired vulnerable and hardened order cancellation paths. The vulnerable implementation intentionally omits customer ownership authorization but retains a separate lab-isolation control.

OWASP recommends checking object-level authorization whenever an API operation accesses a resource using an identifier supplied by the client.

Reference: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/

## 2. Security Objective

Demonstrate how missing resource ownership authorization can allow an authenticated customer to cancel another customer's order, while verifying that the hardened implementation enforces ownership and the vulnerable implementation still enforces lab isolation.

The application must enforce security controls independently of the LLM's reasoning, instructions, and tool selection.

The security requirements are:

- An authenticated user must not be able to cancel another customer's order through the hardened endpoint.
- The vulnerable endpoint must demonstrate cross-customer cancellation within the same lab.
- The vulnerable endpoint must not permit access to orders belonging to another lab.
- Rejected operations must leave the targeted order unchanged.

## 3. System Context

The scenario uses two implementations of the same order cancellation capability.

| Component                            | Vulnerable path                                  | Hardened path                     |
| ------------------------------------ | ------------------------------------------------ | --------------------------------- |
| API endpoint                         | `POST /api/vulnerable/orders/cancel`             | `POST /api/orders/cancel`         |
| Authentication                       | Required                                         | Required                          |
| Order retrieval                      | Implemented                                      | Implemented                       |
| Customer ownership authorization     | Intentionally omitted                            | Enforced                          |
| Lab isolation                        | Enforced                                         | Resource access controls enforced |
| Domain cancellation rules            | Applied                                          | Applied                           |
| Cross-customer order in the same lab | Cancellation succeeds when business rules permit | Request is denied                 |
| Order belonging to another lab       | Request is rejected                              | Request is rejected               |

Both endpoints are available for controlled security testing. The vulnerable endpoint exists exclusively to demonstrate the flaw and is not suitable for production use.

## 4. Assets and Security Boundaries

### Protected assets

- Order records and their status.
- The association between an order and its customer.
- The association between an order and its lab.
- The integrity of order cancellation operations.
- The authenticated user's identity and authorization context.

### Trust boundaries

The relevant boundaries are:

1. **Client to API:** Request data, including the order identifier, is untrusted.
2. **Agent to tool:** The model may request an operation but cannot authorize it.
3. **Application to domain and persistence:** Trusted application logic determines whether an operation may proceed.
4. **Lab to lab:** An order belonging to one lab must not be accessible through another lab's execution context.

The order identifier identifies the requested resource. It does not establish that the caller owns the resource or belongs to the lab that owns it.

## 5. Threat Actor and Preconditions

### Threat actor

An authenticated customer attempting to cancel an order belonging to another customer.

### Preconditions

- Two distinct customer accounts exist.
- Each lab has demo orders.
- The attacker can authenticate as a customer in one lab.
- The attacker knows or obtains an order identifier.
- The cancellation endpoint accepts an order identifier from the request.

The attacker does not need to compromise another account or bypass authentication. The BOLA attack targets missing resource ownership authorization after authentication.

## 6. Data Model and Isolation

Orders contain separate fields for customer ownership and lab ownership:

| Field          | Meaning                                      |
| -------------- | -------------------------------------------- |
| `id`           | Order identifier                             |
| `customer_id`  | Customer associated with the order           |
| `lab_owner_id` | Lab owner associated with the order          |
| `status`       | Current order state                          |
| `is_demo`      | Indicates whether the order is a demo record |

The distinction between `customer_id` and `lab_owner_id` is essential.

A customer can encounter another customer's order within the same lab in the vulnerable scenario. However, the lab-isolation control must prevent the same execution context from accessing orders belonging to another lab.

The lab-isolation check is an additional security boundary. It does not replace customer ownership authorization in the hardened implementation.

## 7. Attack Scenario

Consider two labs, each containing orders belonging to different customers.

For example:

| Lab owner | Order ID | Customer ID | Initial status |
| --------: | -------: | ----------: | -------------- |
|         8 |        1 |           8 | `pending`      |
|         8 |        2 |  2147483646 | `pending`      |
|         9 |        4 |           9 | `pending`      |
|         9 |        5 |  2147483646 | `pending`      |

These example records illustrate the relationship between customer ownership and lab ownership. The synthetic customer IDs do not represent authenticated users.

### Vulnerable execution: same lab

Customer 8 authenticates and requests cancellation of order 2. The order belongs to another customer but remains within lab 8.

```text
Customer 8
    |
    | Authenticated request: cancel order 2
    v
Vulnerable API endpoint
    |
    v
Vulnerable cancellation tool
    |
    v
Vulnerable cancellation use case
    |
    | Lab-isolation check succeeds
    | Customer ownership check is omitted
    v
Order cancellation
    |
    v
Order 2 becomes CANCELLED
```

This is the intended BOLA demonstration: the application accepts the operation without enforcing customer ownership authorization.

### Vulnerable execution: different lab

Customer 8 requests cancellation of order 5, which belongs to lab 9.

```text
Customer 8
    |
    | Authenticated request: cancel order 5
    v
Vulnerable API endpoint
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
    | Order does not belong to lab 8
    v
EntityNotFound
    |
    v
HTTP 404 Not Found
```

The operation is rejected before the order is modified. The response does not disclose whether the order exists in another lab.

### Hardened execution: another customer's order

Customer 8 requests cancellation of order 2 through the hardened endpoint.

```text
Customer 8
    |
    | Authenticated request: cancel order 2
    v
Hardened API endpoint
    |
    v
Hardened cancellation use case
    |
    v
Ownership authorization
    |
    | Customer 8 is not the order owner
    v
Authorization denied
    |
    v
HTTP 403 Forbidden
    |
    v
Order remains unchanged
```

The hardened path enforces ownership authorization before allowing the cancellation.

## 8. Root Cause

The vulnerable implementation does not enforce customer ownership authorization before performing the state-changing operation.

The underlying design error is treating successful authentication and access to the cancellation function as sufficient permission to cancel any order within the accessible lab.

The order identifier is client-controlled input. Knowing a valid identifier must not grant permission to modify the corresponding resource.

Lab isolation and customer ownership are distinct checks:

- **Lab isolation** determines whether the order belongs to the caller's lab.
- **Customer ownership authorization** determines whether the caller is allowed to cancel that specific customer's order.

Passing the first check does not imply passing the second.

## 9. Impact

Successful exploitation of the vulnerable path may cause:

- Unauthorized cancellation of another customer's order within the same lab.
- Loss of order integrity.
- Operational disruption and customer dissatisfaction.
- Potential financial or contractual consequences, depending on the business workflow.

This scenario demonstrates unauthorized state modification. It does not, by itself, demonstrate disclosure of order contents or other customer data.

The lab-isolation control limits the scope of this specific demonstration. It does not eliminate the BOLA vulnerability within a lab.

## 10. Security Classification

### OWASP API Security Top 10:2023

**API1 — Broken Object Level Authorization**

This classification addresses APIs that use client-supplied object identifiers without verifying the caller's authorization for the requested object.

Reference: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/

### OWASP Top 10:2025

**A01 — Broken Access Control**

This is the broader application security category covering authorization failures.

Reference: https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/

### CWE-639

**Authorization Bypass Through User-Controlled Key**

This mapping applies when a user-controlled identifier is used to bypass authorization and access or modify another user's record.

Reference: https://cwe.mitre.org/data/definitions/639.html

## 11. Hardened Design

The hardened implementation enforces authorization in trusted application code.

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
        |
        v
Ownership Authorization
        |
        +---- Denied ----> Reject Request
        |
        v
Domain Cancellation Rules
        |
        v
Persist New State
```

### Required properties

1. The actor's identity must come from trusted authentication context, not from an LLM-generated claim.
2. The application must evaluate authorization against the actual ownership information of the requested order.
3. Authorization must be checked before any state-changing operation.
4. A denied operation must leave the order unchanged.
5. Domain business rules must still be enforced after authorization succeeds.
6. Tool registration, model instructions, and the model's decision to call a tool must not replace application authorization.
7. Lab isolation must remain independent of customer ownership authorization.

Using unpredictable identifiers can make enumeration harder, but it is not a substitute for object-level authorization.

## 12. Verification Strategy

Verification covers both the intended vulnerability and the security controls that remain enforced.

### Test A — Vulnerable cancellation within the same lab

**Given:**

- Customer 8 is authenticated.
- Order 2 belongs to a different customer.
- Order 2 belongs to lab 8.
- Order 2 is `pending`.

**When:**

Customer 8 requests cancellation of order 2 through the vulnerable endpoint.

**Then:**

- The API returns `200 OK`.
- The cancellation succeeds.
- The persisted status of order 2 becomes `cancelled`.

This confirms the intended vulnerable behavior.

### Test B — Vulnerable cancellation across labs

**Given:**

- Customer 8 is authenticated.
- Order 5 belongs to lab 9.
- Order 5 is `pending`.

**When:**

Customer 8 requests cancellation of order 5 through the vulnerable endpoint.

**Then:**

- The API returns `404 Not Found`.
- The operation is rejected.
- The persisted status of order 5 remains `pending`.

This confirms that lab isolation remains enforced even in the vulnerable path.

### Test C — Hardened cancellation of another customer's order

**Given:**

- Customer 8 is authenticated.
- Order 2 belongs to another customer in lab 8.
- Order 2 is `pending`.

**When:**

Customer 8 requests cancellation of order 2 through the hardened endpoint.

**Then:**

- The API returns `403 Forbidden`.
- The application denies the operation.
- The persisted status of order 2 remains `pending`.

This confirms that resource ownership authorization prevents the attack.

### Test D — Authorized cancellation

**Given:**

- Customer 8 is authenticated.
- The target order belongs to customer 8.
- The order is in a state that permits cancellation.

**When:**

Customer 8 requests cancellation of their own order through the hardened endpoint.

**Then:**

- Authorization succeeds.
- Domain cancellation rules are evaluated.
- The order is cancelled if all applicable business rules permit it.

This guards against an implementation that blocks all cancellation requests rather than enforcing ownership correctly.

### Regression requirements

Automated tests must verify response codes and persisted state, not just response messages.

The suite should retain coverage for same-lab BOLA, cross-lab isolation, hardened ownership enforcement, and authorized cancellation. Rejected operations must not modify the targeted order.

## 13. Evidence and Limitations

The current implementation includes:

- A vulnerable order cancellation path that demonstrates cross-customer cancellation within the same lab.
- A lab-isolation check in the vulnerable cancellation use case.
- A hardened cancellation path that enforces customer ownership authorization.
- Automated tests for API behavior and security boundaries.
- Manual API validation through Swagger.

The full automated test suite passed with **46 tests** at the time of this documentation update.

This test count is a snapshot of the current implementation and may change as the project evolves.

The scenario is intentionally limited to object-level authorization for order cancellation. It does not claim to demonstrate every form of BOLA, such as unauthorized read access, access to other resource types, or authorization failures across multiple services.

Passing these tests does not establish that every authorization path in the application has been reviewed. Each additional endpoint that accesses a resource by identifier requires its own authorization analysis and appropriate tests.

## 14. References

- [OWASP API Security Top 10:2023 — API1: Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP Top 10:2025 — A01 Broken Access Control](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)
- [CWE-639 — Authorization Bypass Through User-Controlled Key](https://cwe.mitre.org/data/definitions/639.html)

## Author

**Fernando Magalhães**  
CEO — FM ByteShift Software

[fmbyteshiftsoftware.com](https://fmbyteshiftsoftware.com/)  
[Cybersecurity Pain Intelligence](https://cybersecuritypainintelligence.com/)
