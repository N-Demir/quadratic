import { EditorInteractionState } from '../../../atoms/editorInteractionStateAtom';
import { Sheet } from '../../../grid/sheet/Sheet';
import { CellFormatSummary } from '../../../quadratic-core/types';
import { zoomIn, zoomOut, zoomTo100, zoomToFit, zoomToSelection } from '../../helpers/zoom';
import { PixiApp } from '../../pixiApp/PixiApp';
import { Pointer } from '../pointer/Pointer';

export function keyboardViewport(options: {
  app: PixiApp;
  event: KeyboardEvent;
  sheet: Sheet;
  editorInteractionState: EditorInteractionState;
  setEditorInteractionState: React.Dispatch<React.SetStateAction<EditorInteractionState>>;
  clearAllFormatting: Function;
  changeBold: Function;
  changeItalic: Function;
  formatPrimaryCell?: CellFormatSummary;
  pointer: Pointer;
  presentationMode: boolean;
  setPresentationMode: Function;
}): boolean {
  const {
    changeBold,
    changeItalic,
    clearAllFormatting,
    event,
    formatPrimaryCell,
    sheet,
    editorInteractionState,
    setEditorInteractionState,
    presentationMode,
    setPresentationMode,
    app,
  } = options;

  const { viewport } = app;

  if (event.altKey) return false;

  if ((event.metaKey || event.ctrlKey) && (event.key === 'p' || event.key === 'k' || event.key === '/')) {
    setEditorInteractionState({
      ...editorInteractionState,
      showFeedbackMenu: false,
      showCellTypeMenu: false,
      showGoToMenu: false,
      showCommandPalette: !editorInteractionState.showCommandPalette,
    });
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
    clearAllFormatting();
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === '.') {
    setPresentationMode(!presentationMode);
    return true;
  }

  if (event.key === 'Escape') {
    if (presentationMode) {
      setPresentationMode(false);
      return true;
    }
    return app.pointer.handleEscape();
  }

  if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
    changeBold(!(formatPrimaryCell ? formatPrimaryCell.bold === true : true));
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
    changeItalic(!(formatPrimaryCell ? formatPrimaryCell.italic === true : true));
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && (event.key === 'g' || event.key === 'j')) {
    setEditorInteractionState({
      ...editorInteractionState,
      showFeedbackMenu: false,
      showCellTypeMenu: false,
      showCommandPalette: false,
      showGoToMenu: !editorInteractionState.showGoToMenu,
    });
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === '=') {
    zoomIn(viewport);
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === '-') {
    zoomOut(viewport);
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === '8') {
    zoomToSelection(sheet, viewport);
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === '9') {
    zoomToFit(sheet, viewport);
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === '0') {
    zoomTo100(viewport);
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    // don't do anything on Command+S
    return true;
  }

  return false;
}
