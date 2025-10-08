# Create Specification Command

This command creates a comprehensive specification for features, bug fixes, or refactoring tasks following the established pattern.

## Usage

`/plan <description>`

## Supports All Development Work

**Features:** New functionality, components, pages, or capabilities
**Bug Fixes:** Issue resolution, error corrections, or behaviour fixes
**Refactoring:** Code restructuring, performance improvements, or architecture changes

## Process

I will infer the work name from your description, create a subfolder in `/spec/` (kebab-case), and generate metadata and specification files in sequence with review points:

### 0. metadata.yaml (Created with Folder)

- **Purpose**: Track specification lifecycle and implementation status
- **Created automatically**: When spec folder is created
- **Updated automatically**: Throughout spec creation and implementation
- **Structure**:

```yaml
name: feature-name
type: feature # feature|bugfix|refactor
created: 2025-07-27T10:30:00Z
updated: 2025-07-27T10:30:00Z
author: Max
status: draft # draft|review|approved|implementing|completed
implementation:
  started: null
  completed: null
  tasksTotal: 0
  tasksCompleted: 0
```

### 1. requirements.md (Created First)

- **Purpose**: Capture high-level requirements for the work
- **Format**: User stories with acceptance criteria (for features) or problem statements with success criteria (for bugs/refactoring)
- **Structure**:
  - Introduction explaining the work purpose and impact
  - Requirements numbered sequentially (Requirement 1, 2, 3...)
  - Each requirement includes:
    - User story (features) or problem statement (bugs/refactoring)
    - Acceptance criteria using WHEN/THEN/IF format
    - Specific, testable criteria

**→ REVIEW POINT**: After creating requirements.md, I'll ask you to review and make any adjustments before proceeding.

### 2. design.md (Created After Requirements Approval)

- **Purpose**: Technical design specification analysing requirements
- **Structure**:
  - Overview of the solution approach
  - Architecture diagrams (using mermaid when helpful)
  - URL structure and routing
  - Component hierarchy and interfaces
  - Data access layer with TypeScript interfaces
  - Database queries and data models
  - SEO and metadata considerations
  - Error handling strategies
  - Testing strategy (unit, integration, E2E)
  - Accessibility considerations
  - Performance optimisation
  - Security considerations

**→ REVIEW POINT**: After creating design.md, I'll ask you to review and confirm before proceeding.

### 3. tasks.md (Created Only After Design Approval)

- **Purpose**: Implementation plan with atomic, testable tasks following TDD approach
- **Structure**:
  - Tasks numbered and organised hierarchically
  - Each task includes:
    - Requirement ID references (e.g., "_Requirements: 1.1, 2.1_")
    - Dependencies on other tasks
    - Test specifications (what tests to write first)
    - Implementation details (what to build to make tests pass)
    - Refactoring notes (how to improve after tests pass)
    - **Status tracking**: pending, in_progress, completed
    - **Self-contained context**: Each task includes enough detail to be implemented independently
  - Tasks designed as atomic TDD units:
    - Red: Write failing tests first
    - Green: Implement minimal code to pass tests
    - Refactor: Improve code while keeping tests green
    - Individual implementation by sub-agents
    - Integration testing across multiple tasks
    - End-to-end testing for complete features

**→ REVIEW POINT**: After creating tasks.md, I'll ask you to review and confirm before proceeding.

## Implementation Flow

1. **Checkout main branch** - Ensure we're working from the latest code
2. **Review existing specs** - Check for related work, dependencies, or conflicts
3. **Infer work name and type** - Determine if feature/bugfix/refactor and propose naming
4. **Assess scope** - Evaluate if work should be broken into smaller specs
5. **User approves scope and naming** - Confirm approach and branch naming convention
6. **Create spec folder and new branch** - Use proper naming (feature/, bugfix/, refactor/)
7. **Create metadata.yaml** - Initialize with draft status
8. **Create requirements.md** - Ask clarifying questions using existing specs as context
9. **User reviews requirements.md** - Wait for your approval before proceeding
10. **Update metadata.yaml** - Status to 'review'
11. **Create design.md** - Technical analysis considering existing architecture and specs
12. **User reviews design.md** - Wait for your approval before proceeding
13. **Create tasks.md** - Implementation plan with dependencies on existing work
14. **User reviews tasks.md** - Wait for your approval before proceeding
15. **Update metadata.yaml** - Status to 'approved', update tasksTotal count

## Branch Naming Convention

- **Features**: `feature/feature-name`
- **Bug Fixes**: `bugfix/fix-name`
- **Refactoring**: `refactor/refactor-name`

## Next Steps

After completing the specification, use `/implement <spec-folder-name>` to begin implementation of the tasks.

Tasks are atomic, traceable to requirements, and include dependency information for proper implementation order. All spec files require your explicit approval before proceeding to the next step.
