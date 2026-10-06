# AgenticEnclave

**Security Engineering for AI Agent Systems**

AgenticEnclave is a security-focused AI agent platform designed to demonstrate, analyze, and mitigate security risks introduced by autonomous and tool-using AI agents.

The project combines **software engineering, AI agent architecture, and application security** in a realistic application rather than a collection of isolated security demonstrations.

A fundamental principle of the project is:

> **An AI agent may request an action. The application must decide whether that action is allowed.**

The LLM is therefore not treated as a security boundary. Authorization, business rules, least privilege, and security policies remain application-level responsibilities.

---

## Project Overview

AgenticEnclave simulates an AI-powered customer support platform composed of multiple specialized agents that interact with application capabilities and business data.

The platform will include:

- Customer management
- Order management
- Support tickets
- Multiple specialized AI agents
- Tool-based agent interactions
- Agent-specific permissions
- Centralized authorization and policy enforcement
- Controlled vulnerable scenarios
- Hardened implementations
- Automated security verification
- Multiple LLM provider support

The application is designed to demonstrate both **professional software architecture** and **security engineering practices for agentic systems**.

---

# Architecture

AgenticEnclave follows a **Hexagonal Architecture (Ports and Adapters)** approach, applying practical principles from Clean Architecture and Domain-Driven Design.

The objective is to keep business logic independent from infrastructure and external technologies while allowing the application to evolve without coupling its core to a specific database, LLM provider, API framework, or other external service.

The architecture is organized around:

- Domain
- Application logic
- Ports
- Primary adapters
- Secondary adapters

External technologies communicate with the application through these boundaries rather than becoming dependencies of the core business logic.

### High-Level Architecture

```text
                         PRIMARY ADAPTERS
                    ┌────────────────────────┐
                    │     FastAPI API        │
                    │     Agent Gateway      │
                    └───────────┬────────────┘
                                │
                                ▼
              ┌──────────────────────────────────┐
              │           APPLICATION             │
              │                                  │
              │  Agents                          │
              │  Use Cases                       │
              │  Authorization Policies          │
              │  Tool Definitions                │
              │                                  │
              └───────────────┬──────────────────┘
                              │
                              ▼
              ┌──────────────────────────────────┐
              │             DOMAIN               │
              │                                  │
              │  Customer                        │
              │  Order                           │
              │  Ticket                          │
              │  Business Rules                  │
              │                                  │
              └───────────────┬──────────────────┘
                              │
                         PORTS / INTERFACES
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
      ┌──────────────────┐          ┌──────────────────┐
      │ DATABASE ADAPTERS │          │   LLM ADAPTERS  │
      │                  │          │                  │
      │ Turso            │          │ OpenAI           │
      │ SQLAlchemy       │          │ Gemini           │
      │ Repositories     │          │ Groq             │
      └──────────────────┘          └──────────────────┘
               SECONDARY ADAPTERS
```

The arrows above represent application interaction and dependency boundaries. The architectural dependency direction is toward abstractions owned by the core, while external adapters implement those abstractions.

The Domain does not depend on Turso, SQLAlchemy, FastAPI, OpenAI, Gemini, Groq, or other infrastructure technologies.

This separation makes components easier to replace and test independently.

---

# Architectural Boundaries

## Domain

The Domain contains the business concepts and rules of the application.

Initial domain concepts include:

- Customer
- Order
- Ticket
- Order cancellation rules
- Customer data rules
- Ticket rules

The Domain should not know how data is stored, how an HTTP request arrived, or which LLM provider is being used.

---

## Application

The Application layer coordinates the execution of business operations.

It contains:

- Use cases
- Agents
- Agent orchestration
- Authorization policies
- Permission definitions
- Tool contracts and definitions
- Application-level security decisions

The Application layer is responsible for coordinating actions while the Domain remains responsible for core business rules.

---

## Ports

Ports define technology-independent interfaces between the application core and external components.

Examples include:

- Customer repository
- Order repository
- Ticket repository
- LLM provider
- Authorization service
- Other external services required by the application

Ports allow the application to communicate with external systems without knowing their implementation details.

---

## Primary Adapters

Primary adapters are entry points through which external actors interact with the application.

Initial primary adapters include:

- FastAPI REST API
- Agent Gateway

They translate external requests into application-level operations.

---

## Secondary Adapters

Secondary adapters implement ports and connect the application to external systems.

Initial secondary adapters include:

- Turso database adapter
- SQLAlchemy persistence implementation
- OpenAI adapter
- Google Gemini adapter
- Groq adapter

Changing an external provider should not require redesigning the Domain.

---

# AI Agents

An agent is treated as an **Application component**, not as the application's security boundary.

The initial platform will contain three logical agents.

## Customer Agent

Responsible for customer-related operations such as:

- Retrieving customer information
- Viewing customer profiles
- Updating permitted customer information

## Orders Agent

Responsible for order-related operations such as:

- Retrieving orders
- Checking order status
- Performing permitted order operations
- Requesting order cancellation where authorized

## Support Agent

Responsible for support-related operations such as:

- Viewing support history
- Creating support tickets
- Updating support tickets
- Retrieving relevant customer and order context

The agents may share the same underlying LLM provider.

The architecture will keep the agent layer independent from the model provider so that providers can be changed without redesigning the application.

---

# Agent Execution Model

An agent may interpret a user's request and determine that an application capability should be invoked.

The request then passes through application-level authorization and business logic before execution.

For example:

```text
User
  │
  ▼
Orders Agent
  │
  │  cancel_order(order_id=1842)
  ▼
Tool Request
  │
  ▼
Authorization / Policy
  │
  ├── Is the agent allowed?
  ├── Is the user allowed?
  ├── Is the resource accessible?
  └── Is the operation permitted?
  │
  ▼
CancelOrderUseCase
  │
  ▼
Order Repository Port
  │
  ▼
Turso Adapter
```

The LLM can **request** an operation.

It cannot authorize that operation.

Authorization must be enforced by the application and execution components rather than relying on model instructions or system prompts. Current OWASP guidance for AI agents explicitly recommends least-privilege tool access and authorization enforcement outside the agent's context.

---

# Security Model

AgenticEnclave uses a least-privilege model.

Each agent receives only the capabilities required for its intended responsibilities.

An initial permission model may resemble:

```text
Customer Agent
  ├── Customer: READ
  ├── Customer: LIMITED WRITE
  └── Orders: READ

Orders Agent
  ├── Customer: LIMITED READ
  ├── Orders: READ
  └── Orders: LIMITED WRITE

Support Agent
  ├── Customer: LIMITED READ
  ├── Orders: READ
  └── Tickets: READ / WRITE
```

The exact permission matrix will be defined during threat modeling and implementation.

Security decisions remain enforced by the application rather than by system prompts or model instructions.

---

# Vulnerable and Hardened Paths

A central feature of AgenticEnclave is the separation between **controlled vulnerable implementations** and their corresponding **hardened implementations**.

The project will not maintain two unrelated applications.

Instead, the same application architecture will contain explicit vulnerable and hardened implementations for the security scenarios being demonstrated.

```text
                    AgenticEnclave
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
        Vulnerable                Hardened
             │                       │
       Demonstrate              Enforce
       the failure              the defense
             │                       │
             └───────────┬───────────┘
                         ▼
                    Verification
```

## Vulnerable Path

The vulnerable path contains deliberately insecure implementations designed to reproduce realistic security failures in a controlled environment.

Its purpose is to demonstrate:

- How the vulnerability occurs
- How an attacker can reach it
- What the resulting impact is
- Which architectural or implementation decision caused the weakness

These implementations are intentionally isolated and are never intended for production use.

## Hardened Path

The hardened path implements the corresponding security controls.

Its purpose is to demonstrate:

- The security boundary
- The mitigation
- The correct authorization behavior
- The architectural change required
- Automated verification that the attack no longer succeeds

This allows every security scenario to tell a complete engineering story:

```text
Vulnerability
      ↓
Attack
      ↓
Impact
      ↓
Root Cause
      ↓
Hardened Design
      ↓
Verification
```

The vulnerable and hardened implementations share the same domain and application concepts wherever practical.

The objective is to make the security difference explicit rather than hiding it behind a global feature flag or duplicating the entire application.

---

# Security Scenarios

The project will investigate both traditional application security vulnerabilities and risks specific to AI agent systems.

## Traditional Application Security

Initial scenarios include:

- Broken Object Level Authorization / IDOR
- Excessive privileges
- Sensitive data exposure
- Improper authorization
- Business logic violations

## AI Agent Security

Initial scenarios include:

- Direct prompt injection
- Indirect prompt injection
- Excessive agency
- Tool abuse
- Sensitive information disclosure
- Improper output handling

## Multi-Agent Security

Initial scenarios include:

- Agent boundary violations
- Privilege escalation between agents
- Unauthorized tool invocation
- Excessive trust between agents
- Unsafe agent-to-agent interactions

Additional scenarios may be introduced when they provide meaningful security value to the architecture.

The objective is not to maximize the number of vulnerabilities.

The objective is to demonstrate realistic attack paths and effective defenses.

---

# Vulnerability Demonstration Model

Each security scenario will follow a consistent structure:

```text
┌─────────────────┐
│  Vulnerability  │
└────────┬────────┘
         ▼
┌─────────────────┐
│     Attack      │
└────────┬────────┘
         ▼
┌─────────────────┐
│     Impact      │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Root Cause    │
└────────┬────────┘
         ▼
┌─────────────────┐
│    Mitigation   │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Verification  │
└─────────────────┘
```

Where appropriate, the vulnerable implementation will be exploited first and the hardened implementation will then be tested against the same attack.

---

# Threat Modeling

Security design will be driven by an explicit threat model covering:

- Assets
- Trust boundaries
- Actors
- Entry points
- Agent capabilities
- Tool capabilities
- Data access
- Authorization decisions
- Attack paths
- Security controls

The threat model will be maintained alongside the implementation rather than treated as documentation added after development.

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack React Query
- Axios
- Zustand
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide
- Framer Motion

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

## AI

The application will use an abstraction layer between the agent architecture and LLM providers.

Initial provider support may include:

- OpenAI
- Google Gemini
- Groq

The provider abstraction allows the application to change LLM providers without coupling the core application architecture to a specific vendor.

## Database

- Turso
- libSQL

The project will use a dedicated Turso database.

---

# Project Structure

The project will follow the architectural boundaries established above.

A preliminary structure is:

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
│   ├── security/
│
│
└── README.md
```

This structure intentionally separates:

- Business logic
- Application orchestration
- AI agents
- Security policies
- Ports
- Primary adapters
- Secondary adapters
- Security verification

The structure may evolve as implementation decisions are validated.

The architecture favors clear boundaries over creating abstractions that do not provide practical value.

---

# Testing

Security controls will be verified through automated tests wherever practical.

Tests will cover areas such as:

- Authorization enforcement
- Object-level access control
- Agent permission boundaries
- Tool authorization
- Prompt-injection scenarios
- Unauthorized agent actions
- Sensitive data access
- Privilege escalation attempts
- Business rule enforcement

Testing will be performed at multiple levels:

```text
Unit Tests
    ↓
Integration Tests
    ↓
Security Tests
    ↓
End-to-End Tests
```

A successful LLM response will never be considered proof that an operation is secure.

Security tests must verify the application's actual enforcement mechanisms.

---

# Project Goals

AgenticEnclave has four primary goals:

1. **Build a realistic AI agent application**
2. **Demonstrate security failures that can occur in agentic systems**
3. **Implement application-level defenses against those failures**
4. **Demonstrate strong software engineering practices throughout the system**

The project is intended to demonstrate the intersection of:

```text
Software Engineering
        +
AI Agents
        +
Application Security
        +
Security Engineering
```

---

# Development Roadmap

## Phase 1 — Architecture and Foundation

- Define the domain model
- Define architectural boundaries
- Define agents and capabilities
- Define tools
- Define ports
- Define permissions
- Establish the threat model
- Create the application skeleton
- Implement the first end-to-end agent flow

## Phase 2 — Agent Platform

- Implement the agent layer
- Implement LLM provider abstraction
- Implement tool definitions
- Implement business logic
- Connect Turso
- Implement frontend interface

## Phase 3 — Security Scenarios

- Implement authentication and authorization
- Define agent permissions
- Implement centralized policy enforcement
- Implement controlled vulnerable scenarios
- Implement attack simulations

## Phase 4 — Hardening

- Implement mitigations
- Implement hardened paths
- Add security tests
- Validate authorization boundaries
- Verify attack prevention

## Phase 5 — Documentation

- Architecture documentation
- Threat model
- Attack walkthroughs
- Security findings
- Mitigation analysis
- Testing methodology
- Portfolio documentation

---

# Responsible Use

AgenticEnclave is intended for security research, education, application security engineering, and authorized testing.

All attack scenarios are designed to run against controlled environments owned or explicitly authorized by the operator.

Do not use the techniques demonstrated by this project against systems without authorization.

---

# Status

**Early development**

The architecture, domain model, and security model are being implemented incrementally.

Design decisions may change as the application and threat model are validated.

---

Built by **FM ByteShift Software**.
