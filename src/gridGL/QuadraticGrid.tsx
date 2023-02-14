import { useCallback, useEffect, useState } from 'react';
import { useLoading } from '../contexts/LoadingContext';
import { gridInteractionStateAtom } from '../atoms/gridInteractionStateAtom';
import { editorInteractionStateAtom } from '../atoms/editorInteractionStateAtom';
import { useRecoilState } from 'recoil';
import { PixiApp } from './pixiApp/PixiApp';
import { useKeyboard } from './interaction/keyboard/useKeyboard';
import { ensureVisible } from './interaction/viewportHelper';
import { CellInput } from './interaction/CellInput';
import { SheetController } from '../grid/controller/sheetController';
import { FloatingContextMenu } from '../ui/menus/ContextMenu/FloatingContextMenu';

interface IProps {
  sheetController: SheetController;
  app: PixiApp;
}

export default function QuadraticGrid(props: IProps) {
  const { loading } = useLoading();

  const [container, setContainer] = useState<HTMLDivElement>();
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainer(node);
  }, []);
  useEffect(() => {
    if (props.app && container) props.app.attach(container);
  }, [props.app, container]);

  useEffect(() => {
    if (props.app) {
      props.app.quadrants.build();
    }
  }, [props.sheetController.sheet, props.app]);

  // Interaction State hook
  const [interactionState, setInteractionState] = useRecoilState(gridInteractionStateAtom);
  useEffect(() => {
    props.app?.settings.updateInteractionState(interactionState, setInteractionState);
    ensureVisible({
      sheet: props.sheetController.sheet,
      app: props.app,
      interactionState,
    });
  }, [props.app, props.app?.settings, interactionState, setInteractionState, props.sheetController.sheet]);

  const [editorInteractionState, setEditorInteractionState] = useRecoilState(editorInteractionStateAtom);
  useEffect(() => {
    props.app?.settings.updateEditorInteractionState(editorInteractionState, setEditorInteractionState);
  }, [props.app?.settings, editorInteractionState, setEditorInteractionState]);

  // Right click menu
  const [showContextMenu, setShowContextMenu] = useState(false);

  const { onKeyDown } = useKeyboard({
    sheetController: props.sheetController,
    interactionState,
    setInteractionState,
    editorInteractionState,
    setEditorInteractionState,
    app: props.app,
  });

  if (loading) return null;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        outline: 'none',
        overflow: 'hidden',
        WebkitTapHighlightColor: 'transparent',
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        // If it's not already visibile, show the context menu
        if (!showContextMenu) {
          setShowContextMenu(true);
        }
      }}
      onClick={(e) => {
        // <FloatingFormatMenu> prevents events from bubbling up to here, so
        // we always hide the context menu if it's open
        if (showContextMenu) {
          setShowContextMenu(false);
        }
      }}
      onKeyDown={onKeyDown}
    >
      <CellInput
        interactionState={interactionState}
        editorInteractionState={editorInteractionState}
        setInteractionState={setInteractionState}
        container={container}
        app={props.app}
        sheetController={props.sheetController}
      />
      <FloatingContextMenu
        interactionState={interactionState}
        setInteractionState={setInteractionState}
        container={container}
        app={props.app}
        sheetController={props.sheetController}
        showContextMenu={showContextMenu}
      ></FloatingContextMenu>
    </div>
  );
}
