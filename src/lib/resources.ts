/**
 * Validates the "exactly one parent" invariant for a Resource.
 *
 * Returns null when valid (exactly one of courseId / assignmentId is non-null).
 * Returns an error string when the invariant is violated:
 *   - both non-null  → resource cannot have two parents
 *   - both null      → resource must have at least one parent
 *
 * Call this on any ownership data whose provenance is outside the type system
 * (e.g. records loaded from the database, future PATCH inputs).
 */
export function validateResourceParent(
  courseId: string | null | undefined,
  assignmentId: string | null | undefined,
): string | null {
  const hasCourse = courseId != null;
  const hasAssignment = assignmentId != null;
  if (hasCourse && hasAssignment) {
    return "A resource cannot belong to both a course and an assignment";
  }
  if (!hasCourse && !hasAssignment) {
    return "A resource must belong to either a course or an assignment";
  }
  return null;
}

/**
 * Constructs the ownership fields for a Resource create or query.
 * Exactly one of courseId / assignmentId will be non-null.
 *
 * This is the only place that sets these fields, so the invariant
 * is enforced at construction time. validateResourceParent is called
 * internally so the validator is exercised on every creation path.
 */
export function resourceOwnership(
  kind: "course",
  id: string
): { courseId: string; assignmentId: null };
export function resourceOwnership(
  kind: "assignment",
  id: string
): { courseId: null; assignmentId: string };
export function resourceOwnership(
  kind: "course" | "assignment",
  id: string
): { courseId: string | null; assignmentId: string | null } {
  const result =
    kind === "course"
      ? { courseId: id, assignmentId: null as null }
      : { courseId: null as null, assignmentId: id };

  // Internal assertion — construction is always correct by the overloads above,
  // but this keeps the validator on the hot path so a future refactor that breaks
  // the invariant will throw immediately rather than silently write bad data.
  const err = validateResourceParent(result.courseId, result.assignmentId);
  if (err) throw new Error(`[resourceOwnership] invariant violated: ${err}`);

  return result;
}
