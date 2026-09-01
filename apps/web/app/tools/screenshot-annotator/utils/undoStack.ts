/**
 * CSV Viewer's undo/redo history is already fully generic (`T` can be any
 * snapshot type, no CSV-specific coupling) — reused here as-is against
 * `Annotation[]` snapshots rather than re-implementing the same
 * past/present/future logic a second time.
 */
export { createUndoState, pushUndoState, undo, redo, canUndo, canRedo, type UndoState } from '../../csv-viewer/utils/undoStack';
