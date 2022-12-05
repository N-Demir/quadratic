import { GridInteractionState } from '../../../atoms/gridInteractionStateAtom';
import { EditorInteractionState } from '../../../atoms/editorInteractionStateAtom';
import { GetCellsDB } from '../../gridDB/Cells/GetCellsDB';

export const onDoubleClickCanvas = (
  event: PointerEvent,
  interactionState: GridInteractionState,
  setInteractionState: React.Dispatch<React.SetStateAction<GridInteractionState>>,
  setEditorInteractionState: React.Dispatch<React.SetStateAction<EditorInteractionState>>
) => {
  // Get the double clicked cell, check if it is already set
  const x = interactionState.cursorPosition.x;
  const y = interactionState.cursorPosition.y;
  let cells = GetCellsDB(x, y, x, y);
  // Check if cell is already set or not
  if (cells.length) {
    const cell = cells[0];

    // open single line, for TEXT and COMPUTED
    if (cell.type === 'TEXT' || cell.type === 'COMPUTED') {
      setInteractionState({
        ...interactionState,
        ...{
          showInput: true,
          inputInitialValue: cell.value,
        },
      });
    } else {
      // Open code editor, or move code editor if already open.
      setEditorInteractionState({
        showCellTypeMenu: false,
        showCodeEditor: true,
        selectedCell: { x: x, y: y },
        mode: cells[0].type,
      });
    }
  } else {
    // If no previous value, open single line Input
    setInteractionState({
      ...interactionState,
      ...{
        showInput: true,
        inputInitialValue: '',
      },
    });
  }
  event.preventDefault();
};
