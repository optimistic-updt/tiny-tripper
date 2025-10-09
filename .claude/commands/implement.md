# Implement Specification Command

Multi-agent implementation of specifications using TDD methodology, isolated worktrees, and tmux coordination.

## Usage

`/implement <spec-folder-name>`

## Prerequisites

- Specification must exist in `/specs/<spec-folder-name>/`
- Must contain: requirements.md, design.md, tasks.md
- Tasks.md must have properly formatted tasks with status tracking
- Required: tmux installed for multi-agent workflow management

## Implementation Flow

### Main Claude Orchestration

1. **Load Specification**: Read requirements.md, design.md, and tasks.md
2. **Initialize Tmux Session**: Create `impl-<spec-name>` session with monitoring
3. **Dependency Analysis**: Find tasks with `status: pending` and satisfied dependencies
4. **Agent Spawning**: For each ready task:
   - Create isolated worktree
   - Spawn Claude agent with comprehensive context
   - Update task status to `in_progress`
   - Track tmux session
5. **Monitor Progress**: Use tmux introspection to track agent completion
6. **Handle Completion**: Merge work, update status to `completed`, cleanup worktree
7. **Continuous Loop**: Repeat until all tasks completed
8. **Create Implementation Summary**: Generate comprehensive summary.md in spec folder documenting:
   - Overview of what was implemented
   - Packages/components created
   - Key implementation decisions
   - Challenges and solutions
   - Benefits achieved
   - Next steps
9. **Create Pull Request**: Create PR with summary of changes from requirements and implementation

### Agent Workflow

Each agent receives:

- **Full specification context** (requirements, design, tasks)
- **Specific task details** (files, tests, dependencies, requirements)
- **Isolated environment** (worktree, unique port, tmux session)
- **Autonomous tools** (--allowTools for full independence)

Agent responsibilities:

1. Read specification context
2. Implement task using TDD methodology
3. Run focused tests (only task-related, not full suite)
4. Update status to `completed` when finished
5. Commit with conventional format
6. Merge back to main and cleanup

## Task Format

```markdown
### Task 1: Create Domain Entities

- **Status**: pending
- **Dependencies**: none
- **Files**: src/modules/businesses/domain/entities/business.ts
- **Tests**: src/modules/businesses/domain/entities/**tests**/business.test.ts
- **Requirements**: 1.1, 3.1, 3.2
```

## Commit Standards

- **Format**: `<type>[scope]: <description>` (max 50 chars)
- **Types**: feat, fix, docs, style, refactor, perf, test, chore, ci
- **Imperative mood**: "add", "fix", "update" (not "added", "fixed", "updated")
- **No AI attribution**: Never include AI contribution text
- **Group by scope**: Never commit unrelated files together

## Implementation Summary

After all tasks are completed, create a comprehensive `summary.md` in the specification folder (`/specs/<spec-name>/summary.md`) that includes:

### Summary Structure

1. **Overview**: High-level description of what was accomplished
2. **Implementation Timeline**: Start/end dates, total tasks, PR link
3. **Components Created**: Detailed list of packages, modules, or features
4. **Key Implementation Decisions**: Technical choices and rationale
5. **Migration/Implementation Process**: Phase-by-phase breakdown
6. **Benefits Achieved**: Concrete improvements delivered
7. **Documentation Created**: New docs and updates made
8. **Challenges and Solutions**: Problems encountered and resolutions
9. **Testing Summary**: Test coverage and results
10. **Next Steps**: Future work that can build on this implementation

### Example Summary Sections

```markdown
## Overview

Brief description of the implementation and its goals

## Implementation Timeline

- Start: YYYY-MM-DD
- Completion: YYYY-MM-DD
- Total Tasks: X (All completed ✅)
- Pull Request: #XX

## Key Implementation Decisions

### Decision 1: Pattern/Approach

- Rationale
- Benefits
- Trade-offs
```

## Pull Request Creation

After creating the implementation summary, automatically create a pull request with:

- **Title**: Based on specification name and scope
- **Body**: Summary of implemented features from requirements.md and key points from summary.md
- **Labels**: Auto-assigned based on task types (feat, fix, etc.)
- **Reviewers**: Optional configuration for default reviewers
- **Link to Summary**: Reference the detailed summary.md in the PR description

## Session Management

- **Main session**: `impl-<spec-name>` with monitoring windows
- **Agent sessions**: `impl-<spec-name>:Agent-<task-id>` with 4-pane layout
- **Attach**: `tmux attach-session -t impl-<spec-name>`
- **Monitor**: Main Claude uses tmux introspection for progress tracking

## Benefits

- **Parallel execution**: Multiple agents work simultaneously
- **Conflict prevention**: Isolated worktrees eliminate file conflicts
- **Dependency management**: Automatic task sequencing
- **Resource isolation**: Unique ports and environments
- **Autonomous operation**: Agents work independently with full context
- **Continuous monitoring**: Real-time progress tracking via tmux
- **Recoverable**: Sessions persist across disconnections

## Error Handling

The system includes comprehensive error handling:

### Automatic Recovery

- **Failed worktree creation**: Automatically cleans up and retries
- **Port conflicts**: Allocates alternative ports automatically
- **Agent failures**: Logs errors and continues with other agents
- **Git conflicts**: Provides clear error messages for manual resolution

### Validation

- **Specification structure**: Validates all required files exist and are readable
- **Task format**: Ensures tasks have required fields (Status, Dependencies)
- **Dependencies**: Checks tmux, git, and lsof are installed
- **Git repository**: Verifies working directory is a git repository

### Logging

All operations are logged with timestamps for debugging:

- Agent spawning and completion
- Worktree creation and cleanup
- Error conditions and recovery attempts
- Resource allocation and deallocation

## Example Usage

```bash
# Start implementation
/implement clean-architecture-businesses

# Attach to session
tmux attach-session -t impl-clean-architecture-businesses

# Monitor specific agent
tmux select-window -t impl-clean-architecture-businesses:Agent-1
```

The system automatically handles agent spawning, dependency resolution, resource allocation, and progress coordination through tmux introspection.
