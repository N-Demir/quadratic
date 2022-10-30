import { Point } from 'pixi.js';
import { PixiApp } from '../../pixiApp/PixiApp';
import { doubleClickCell } from './doubleClickCell';
import { DOUBLE_CLICK_TIME } from './pointerUtils';

const MINIMUM_MOVE_POSITION = 5;

export class PointerDown {
  private app: PixiApp;
  private active = false;
  private positionRaw?: Point;
  private position?: Point;
  private previousPosition?: { originPosition: Point; terminalPosition: Point };
  private pointerMoved = false;
  private doubleClickTimeout?: number;

  constructor(app: PixiApp) {
    this.app = app;
  }

  pointerDown(world: Point, event: PointerEvent): void {
    this.positionRaw = world;
    const { gridOffsets, settings, cursor } = this.app;
    const { column, row } = gridOffsets.getRowColumnFromWorld(world.x, world.y);

    const rightClick = event.button === 2 || (event.button === 0 && event.ctrlKey);

    // If right click and we have a multi cell selection.
    // If the user has clicked inside the selection.
    const { interactionState, setInteractionState } = settings;
    if (!setInteractionState) {
      console.warn('Expected setInteractionState to be defined');
      return;
    }
    if (rightClick && interactionState.showMultiCursor) {
      if (
        column >= interactionState.multiCursorPosition.originPosition.x &&
        column <= interactionState.multiCursorPosition.terminalPosition.x &&
        row >= interactionState.multiCursorPosition.originPosition.y &&
        row <= interactionState.multiCursorPosition.terminalPosition.y
      )
        // Ignore this click. User is accessing the RightClickMenu.
        return;
    }

    // otherwise ignore right click
    else if (rightClick) {
      return;
    }

    if (this.doubleClickTimeout) {
      window.clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = undefined;
      doubleClickCell({ cell: this.app.grid.get(column, row), app: this.app });
      this.active = false;
      event.preventDefault();
      return;
    }

    this.active = true;
    this.position = new Point(column, row);

    const previousPosition = {
      originPosition: new Point(column, row),
      terminalPosition: new Point(column, row),
    };

    // Keep track of multiCursor previous position
    this.previousPosition = previousPosition;

    // Move cursor to mouse down position
    // For single click, hide multiCursor
    setInteractionState({
      ...interactionState,
      keyboardMovePosition: { x: column, y: row },
      cursorPosition: { x: column, y: row },
      multiCursorPosition: previousPosition,
      showMultiCursor: false,
    });
    cursor.dirty = true;
    this.pointerMoved = false;
  }

  private checkForCancelDoubleClick(world: Point): void {
    const viewport = this.app.viewport;
    if (!this.positionRaw) return;
    if (Math.sqrt(Math.pow(this.positionRaw.x - world.x, 2) + Math.pow(this.positionRaw.y - world.y, 2)) >
        MINIMUM_MOVE_POSITION * viewport.scale.x
    ) {
      window.clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = undefined;
    }
  }

  pointerMove(world: Point): void {
    const { viewport, gridOffsets, settings, cursor } = this.app;
    if (!this.active && !this.pointerMoved && this.doubleClickTimeout) {
      this.checkForCancelDoubleClick(world);
    }

    if (!this.active || !this.position || !this.previousPosition || !this.positionRaw || !settings.setInteractionState)
      return;

    // for determining if double click
    if (
      !this.pointerMoved &&
      Math.sqrt(Math.pow(this.positionRaw.x - world.x, 2) + Math.pow(this.positionRaw.y - world.y, 2)) >
        MINIMUM_MOVE_POSITION * viewport.scale.x
    ) {
      this.pointerMoved = true;
    }

    // calculate mouse move position
    const { column, row } = gridOffsets.getRowColumnFromWorld(world.x, world.y);

    // cursor start and end in the same cell
    if (column === this.position.x && row === this.position.y) {
      // hide multi cursor when only selecting one cell
      settings.setInteractionState({
        keyboardMovePosition: { x: this.position.x, y: this.position.y },
        cursorPosition: { x: this.position.x, y: this.position.y },
        multiCursorPosition: {
          originPosition: { x: this.position.x, y: this.position.y },
          terminalPosition: { x: this.position.x, y: this.position.y },
        },
        showMultiCursor: false,
        showInput: false,
        inputInitialValue: '',
      });
    } else {
      // cursor origin and terminal are not in the same cell

      // make origin top left, and terminal bottom right
      const originX = this.position.x < column ? this.position.x : column;
      const originY = this.position.y < row ? this.position.y : row;
      const termX = this.position.x > column ? this.position.x : column;
      const termY = this.position.y > row ? this.position.y : row;

      // determine if the cursor has moved from the previous event
      const hasMoved = !(
        this.previousPosition.originPosition.x === originX &&
        this.previousPosition.originPosition.y === originY &&
        this.previousPosition.terminalPosition.x === termX &&
        this.previousPosition.terminalPosition.y === termY
      );

      // only set state if changed
      // this reduces the number of hooks fired
      if (hasMoved) {
        // update multiCursor
        settings.setInteractionState({
          keyboardMovePosition: { x: column, y: row },
          cursorPosition: { x: this.position.x, y: this.position.y },
          multiCursorPosition: {
            originPosition: { x: originX, y: originY },
            terminalPosition: { x: termX, y: termY },
          },
          showMultiCursor: true,
          showInput: false,
          inputInitialValue: '',
        });
        cursor.dirty = true;

        // update previousPosition
        this.previousPosition = {
          originPosition: new Point(originX, originY),
          terminalPosition: new Point(termX, termY),
        };
      }
    }
  }

  pointerUp(): void {
    if (this.active) {
      if (!this.pointerMoved) {
        this.doubleClickTimeout = window.setTimeout(() => (this.doubleClickTimeout = undefined), DOUBLE_CLICK_TIME);
      }
      this.active = false;
    }
  }

  destroy(): void {
    if (this.doubleClickTimeout) {
      window.clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = undefined;
    }
  }
}
