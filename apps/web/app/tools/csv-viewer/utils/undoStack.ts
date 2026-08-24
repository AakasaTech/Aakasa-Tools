/**
 * Generic, immutable undo/redo history. Not CSV-specific in any way — `T`
 * can be any snapshot type, so a future tool with similar destructive-edit
 * concerns could reuse this as-is. No React, no DOM.
 */

export interface UndoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createUndoState<T>(initial: T): UndoState<T> {
  return { past: [], present: initial, future: [] };
}

/** Commits a new present state, clearing redo history (the usual undo/redo convention). `limit` caps how many past states are retained. */
export function pushUndoState<T>(state: UndoState<T>, next: T, limit = 20): UndoState<T> {
  const past = [...state.past, state.present].slice(-limit);
  return { past, present: next, future: [] };
}

export function undo<T>(state: UndoState<T>): UndoState<T> {
  const previous = state.past.at(-1);
  if (previous === undefined) {
    return state;
  }
  return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
}

export function redo<T>(state: UndoState<T>): UndoState<T> {
  const next = state.future[0];
  if (next === undefined) {
    return state;
  }
  return { past: [...state.past, state.present], present: next, future: state.future.slice(1) };
}

export function canUndo<T>(state: UndoState<T>): boolean {
  return state.past.length > 0;
}

export function canRedo<T>(state: UndoState<T>): boolean {
  return state.future.length > 0;
}
