## Convex Integration

- Database schema defined in `convex/schema.ts`
- Authentication configured for Clerk integration via `convex/auth.config.ts`
- Real-time features available through Convex subscriptions

### Full Reference

See `.cursor/rules/convex_rules.mdc` for comprehensive examples including HTTP endpoints, pagination, crons, and more

### Function Syntax

Always use the new function syntax with explicit args and returns validators:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});
```

### Key Conventions

- **Public functions**: Use `query`, `mutation`, `action` for public API
- **Internal functions**: Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- **Always include validators**: Every function needs `args` and `returns` validators
- **Null returns**: Use `returns: v.null()` when a function doesn't return anything
- **Function references**: Use `api.file.function` for public, `internal.file.function` for internal

### Query Guidelines

- Do NOT use `filter` in queries - use `withIndex` instead
- Define indexes in schema for all query patterns
- Use `.order('asc')` or `.order('desc')` for ordering
- Use `.unique()` to get a single document (throws if multiple match)

### Schema Guidelines

- System fields `_id` and `_creationTime` are automatically added
- Index names should include all fields: `by_field1_and_field2`
- Index fields must be queried in the order they are defined

### Actions

- Add `"use node";` at top of files using Node.js modules
- Actions cannot use `ctx.db` - use `ctx.runQuery`/`ctx.runMutation` instead
- Minimize calls from actions to queries/mutations (each is a separate transaction)

### File Storage

- Use `ctx.storage.getUrl()` to get signed URLs for files
- Query `_storage` system table for file metadata: `ctx.db.system.get(fileId)`
