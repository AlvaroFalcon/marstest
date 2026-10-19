---
name: design-patterns
description: Catalogue of classic design patterns (creational, structural, behavioural) and React-specific patterns, with TypeScript/React examples, when to use them and when not to. Use during Plan or Implement when facing a known design problem - interchangeable algorithms, adapting heterogeneous external data, composing behaviour, notifying changes, building complex objects, modelling state transitions or building flexible component APIs.
---

# Design patterns

Use this skill to pick **the simplest pattern that solves a problem the code has today**. MarsBased rule: avoid patterns and abstractions you do not need yet. If plain functions and props solve it, stop there.

## How to use

1. Identify the problem in the **Problem → pattern** table below.
2. Open the reference file for the category and read the pattern entry (intent, when to use, when not to, example).
3. Apply it following `CLAUDE.md` conventions (function declarations, named exports, exported types, JSDoc).
4. If the pattern shapes the architecture (not a local detail), present it to the user as an option. If the user adopts it, hand the decision to the `decision-recorder` agent.

## Problem → pattern

| Problem you have | Pattern | Reference |
| --- | --- | --- |
| Several interchangeable algorithms selected at runtime (sorting, pricing, risk scoring per transport mode) | **Strategy** | [behavioural.md](references/behavioural.md#strategy) |
| External data comes in different shapes/vocabularies and must look the same inside the app | **Adapter** | [structural.md](references/structural.md#adapter) |
| A complex subsystem (API + cache + mapping) should be used through one simple interface | **Facade** | [structural.md](references/structural.md#facade) |
| Create objects of different kinds from a discriminator without `switch` everywhere | **Factory** | [creational.md](references/creational.md#factory) |
| Build an object with many optional parts step by step (test fixtures, query params) | **Builder** | [creational.md](references/creational.md#builder) |
| Exactly one shared instance (API client, config) | **Singleton (module)** | [creational.md](references/creational.md#singleton-module) |
| Add behaviour (logging, retries, caching) around a function without changing it | **Decorator** | [structural.md](references/structural.md#decorator) |
| Tree of items treated uniformly (nested menus, shipment legs, filters) | **Composite** | [structural.md](references/structural.md#composite) |
| Control or defer access to something expensive or sensitive | **Proxy** | [structural.md](references/structural.md#proxy) |
| Several parts must react when something changes | **Observer** | [behavioural.md](references/behavioural.md#observer) |
| An entity moves through well-defined states with allowed transitions | **State machine** | [behavioural.md](references/behavioural.md#state-machine) |
| Actions must be queued, undone, logged or approved before running | **Command** | [behavioural.md](references/behavioural.md#command) |
| A value passes through ordered handlers until one deals with it (validation, normalisation rules) | **Chain of Responsibility** | [behavioural.md](references/behavioural.md#chain-of-responsibility) |
| Same overall flow, steps vary per case | **Template Method** | [behavioural.md](references/behavioural.md#template-method) |
| Reuse stateful logic between components | **Custom hook** | [react.md](references/react.md#custom-hooks) |
| Flexible widget with related parts sharing implicit state (Tabs, Accordion, Stepper) | **Compound components** | [react.md](references/react.md#compound-components) |
| Caller decides what to render inside a reusable component | **Slots / render props** | [react.md](references/react.md#slots-and-render-props) |
| Share a value deep in the tree without prop drilling | **Provider (Context)** | [react.md](references/react.md#provider) |
| Component usable with or without parent-controlled state | **Controlled / uncontrolled** | [react.md](references/react.md#controlled-and-uncontrolled) |

## Anti-patterns to avoid

- **Speculative abstraction**: interfaces with a single implementation "for the future".
- **God context**: one Context holding unrelated global state (re-renders every consumer). Split it, or use zustand.
- **Class hierarchies in React**: use composition and functions, not inheritance.
- **Singleton with mutable global state** that tests cannot reset.
- **Pattern names in identifiers** (`ShipmentStrategyFactoryManager`). Name things after the domain.
