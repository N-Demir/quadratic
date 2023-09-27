import { DragEvent, PropsWithChildren, useRef, useState } from 'react';
import { useGlobalSnackbar } from '../../components/GlobalSnackbarProvider';
import { grid } from '../../grid/controller/Grid';
import { sheets } from '../../grid/controller/Sheets';
import { pixiApp } from '../../gridGL/pixiApp/PixiApp';
import { Coordinate } from '../../gridGL/types/size';

export const FileUploadWrapper = (props: PropsWithChildren) => {
  // drag state
  const [dragActive, setDragActive] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const { addGlobalSnackbar } = useGlobalSnackbar();

  const moveCursor = (e: DragEvent<HTMLDivElement>): void => {
    const clientBoudingRect = divRef?.current?.getBoundingClientRect();
    const world = pixiApp.viewport.toWorld(
      e.pageX - (clientBoudingRect?.left || 0),
      e.pageY - (clientBoudingRect?.top || 0)
    );
    const sheet = sheets.sheet;
    const { column, row } = grid.getColumnRow(sheet.id, world.x, world.y);
    sheet.cursor.changePosition({
      cursorPosition: { x: column, y: row },
      keyboardMovePosition: { x: column, y: row },
      multiCursor: {
        originPosition: { x: column, y: row },
        terminalPosition: { x: column, y: row },
      },
    });
  };

  // handle drag events
  const handleDrag = function (e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);

      moveCursor(e);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // triggers when file is dropped
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.type === 'text/tab-separated-values') {
        const clientBoudingRect = divRef?.current?.getBoundingClientRect();
        const world = pixiApp.viewport.toWorld(
          e.pageX - (clientBoudingRect?.left || 0),
          e.pageY - (clientBoudingRect?.top || 0)
        );
        const { column, row } = grid.getColumnRow(sheets.sheet.id, world.x, world.y);
        const insertAtCellLocation = { x: column, y: row } as Coordinate;

        grid.importCsv(sheets.sheet.id, file, insertAtCellLocation, addGlobalSnackbar);
      } else {
        addGlobalSnackbar('File type not supported. Please upload a CSV file.');
      }
    }
  };

  return (
    <div ref={divRef} onDragEnter={handleDrag} style={{ flex: 1 }}>
      {props.children}
      {dragActive && (
        <div
          id="drag-file-element"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px',
            opacity: '0',
          }}
        ></div>
      )}
    </div>
  );
};
