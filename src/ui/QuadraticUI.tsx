import TopBar from '../ui/menus/TopBar';
import CodeEditor from '../ui/menus/CodeEditor';
import { useRecoilValue } from 'recoil';
import { editorInteractionStateAtom } from '../atoms/editorInteractionStateAtom';
import BottomBar from './menus/BottomBar';
import QuadraticGrid from '../gridGL/QuadraticGrid';
import CommandPalette from './menus/CommandPalette';
import GoTo from './menus/GoTo';
import { useEffect, useState } from 'react';
import CellTypeMenu from './menus/CellTypeMenu';
import FileMenu from './menus/FileMenu';
import { FileUploadWrapper } from './components/FileUploadWrapper';
import { useGridSettings } from './menus/TopBar/SubMenus/useGridSettings';
import PresentationModeHint from './components/PresentationModeHint';
import InitialPageLoadError from './components/InitialPageLoadError';
import { GetCellsDBSetSheet } from '../grid/sheet/Cells/GetCellsDB';
import { PixiApp } from '../gridGL/pixiApp/PixiApp';
import { SheetController } from '../grid/controller/sheetController';
import ReadOnlyDialog from './components/ReadOnlyDialog';
import { IS_READONLY_MODE } from '../constants/app';
import { useLocalFiles } from './contexts/LocalFiles';
import SheetBar from './menus/SheetBar';
import FeedbackMenu from './menus/FeedbackMenu';
import { ConfirmDeleteSheet } from './menus/SheetBar/ConfirmDeleteSheet';

export default function QuadraticUI({ app, sheetController }: { app: PixiApp; sheetController: SheetController }) {
  const editorInteractionState = useRecoilValue(editorInteractionStateAtom);
  const { presentationMode } = useGridSettings();
  const { hasInitialPageLoadError } = useLocalFiles();

  useEffect(() => {
    sheetController.setApp(app);
  }, [sheetController, app]);

  // Temporary way to attach sheet to global for use in GetCellsDB function
  useEffect(() => {
    GetCellsDBSetSheet(sheetController);
  }, [sheetController]);

  // Resize the canvas when user goes in/out of presentation mode
  useEffect(() => {
    app.resize();
  }, [presentationMode, app]);

  // used for delete sheet
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | undefined>();
  const [lastName, setLastName] = useState<string | undefined>();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {editorInteractionState.showCellTypeMenu && <CellTypeMenu></CellTypeMenu>}
      {!presentationMode && <TopBar app={app} sheetController={sheetController} />}
      {editorInteractionState.showCommandPalette && (
        <CommandPalette
          app={app}
          sheetController={sheetController}
          confirmSheetDelete={() => {
            setConfirmDelete({ id: sheetController.sheet.id, name: sheetController.sheet.name });
            setLastName(sheetController.sheet.name);
          }}
        />
      )}
      {editorInteractionState.showGoToMenu && <GoTo app={app} sheetController={sheetController} />}
      {editorInteractionState.showFileMenu && <FileMenu />}

      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <FileUploadWrapper sheetController={sheetController} app={app}>
          <QuadraticGrid sheetController={sheetController} app={app} />
        </FileUploadWrapper>
        <CodeEditor editorInteractionState={editorInteractionState} sheet_controller={sheetController} />
      </div>

      {!presentationMode && <SheetBar sheetController={sheetController} />}
      {!presentationMode && <BottomBar sheet={sheetController.sheet} />}
      {editorInteractionState.showFeedbackMenu && <FeedbackMenu />}
      {presentationMode && <PresentationModeHint />}
      {hasInitialPageLoadError && <InitialPageLoadError />}

      {IS_READONLY_MODE && <ReadOnlyDialog />}

      <ConfirmDeleteSheet
        sheetController={sheetController}
        lastName={lastName}
        confirmDelete={confirmDelete}
        handleClose={() => setConfirmDelete(undefined)}
      />
    </div>
  );
}
