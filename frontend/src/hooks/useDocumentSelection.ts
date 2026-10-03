import { useCallback, useMemo, useState } from "react";

/**
 * Selection state for the documents table.
 *
 * Two modes: `visible` is the checked rows on the current page; `matching` means every document
 * matching the current filters, including other pages. Un-ticking any row drops back to `visible`,
 * so a partial selection is never mistaken for "everything".
 *
 * @param visibleIds - IDs of the rows currently shown
 */
export function useDocumentSelection(visibleIds: string[]) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [matching, setMatching] = useState(false);

  const clear = useCallback(() => {
    setIds(new Set());
    setMatching(false);
  }, []);

  const toggle = useCallback((id: string, checked: boolean) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    if (!checked) setMatching(false);
  }, []);

  const toggleVisible = useCallback(
    (checked: boolean) => {
      if (checked) setIds(new Set(visibleIds));
      else clear();
    },
    [visibleIds, clear],
  );

  const selectMatching = useCallback(() => setMatching(true), []);

  const headerState = useMemo<boolean | "indeterminate">(() => {
    if (visibleIds.length === 0) return false;
    const selectedVisible = visibleIds.filter((id) => ids.has(id)).length;
    if (selectedVisible === visibleIds.length) return true;
    return selectedVisible > 0 ? "indeterminate" : false;
  }, [visibleIds, ids]);

  return {
    ids,
    mode: matching ? ("matching" as const) : ("visible" as const),
    headerState,
    allVisibleSelected: headerState === true,
    toggle,
    toggleVisible,
    selectMatching,
    clear,
  };
}
