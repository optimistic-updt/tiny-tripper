# Play Page Spec

The play page (`app/tt/play/page.tsx`) recommends an activity to the user. This document describes the intended product behavior. When behavior in the code diverges from this spec, treat the spec as the source of truth unless the user says otherwise.

## Default behavior

- By default, the page returns all activities. No category is filtered out unless the user explicitly activates a filter.

## Filters

There are two kinds of filter, with different semantics. Mixing them gives the user fine control without forcing a single model onto every use case.

### Narrow filters (inclusion, union)

- A set of filters that are **off by default**. Each one corresponds to a category of activities.
- Turning a narrow filter **on** restricts results to activities matching that category.
- When multiple narrow filters are on, the semantics are **union (OR)**: an activity qualifies if it matches *any* active narrow.
- Current narrow filters: `At Home`, `Rain Approved`, `Outdoor`.

### Exclude filters (subtraction)

- A set of filters that are **on by default** (i.e. that category is included in results).
- Turning an exclude filter **off** removes that category from results.
- Exclusions are applied *after* any narrow filter, so they further trim the narrowed set.
- Current exclude filters: `Food` (restaurants, cafes, dining).

### Radius filter

- In addition to category filters, the user can restrict results by a search radius (distance from their current location).
- The radius UI is hidden when the only active narrow filter is `At Home`, because at-home activities bypass the radius check anyway (see *Location behavior* below).

## Location behavior

- Whenever location is active, the results must always include activities tagged `at home` or that have no location attached to them — these bypass the proximity / radius filter.
- The radius filter only constrains activities that *do* have a physical location.

## Tag convention

- Tags are stored **lowercase, space-separated** (e.g. `at home`, `rain approved`, `outdoor`).
- Tag matching in filter logic is case-insensitive and trim-tolerant, so legacy mixed-case tags still resolve until they are migrated.
