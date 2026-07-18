# `/contracts` — shared types & module interfaces

The neutral ground. When two modules need to agree on a shape (a DTO, an enum, an interface
a module promises to implement), the **type lives here** — both sides import it, neither
owns it.

Rules:

- A type that only one module uses stays **inside that module**, not here.
- No runtime logic, no DB access, no side effects — types and interfaces only.
- If putting a type here would force a module dependency cycle, the boundary is wrong —
  stop and flag it (§4.3 rule 5).

Populated as Slice 1 modules define the interfaces they expose to each other.
