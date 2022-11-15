import { ColorResult } from 'react-color';
import { useRecoilState } from 'recoil';
import { gridInteractionStateAtom } from '../../../../atoms/gridInteractionStateAtom';
import { clearFormatDB, updateFormatDB } from '../../../../core/gridDB/Cells/UpdateFormatDB';
import {
  borderAll,
  borderBottom,
  borderLeft,
  borderRight,
  borderTop,
  BorderType,
  CellFormat,
} from '../../../../core/gridDB/db';
import { PixiApp } from '../../../../core/gridGL/pixiApp/PixiApp';
import { Coordinate } from '../../../../core/gridGL/types/size';
import { convertReactColorToString } from '../../../../helpers/convertColor';

export interface ChangeBorder {
  borderLeft?: boolean;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderRight?: boolean;
  borderHorizontal?: boolean;
  borderVertical?: boolean;
}

interface IResults {
  changeFillColor: (rgb: ColorResult) => void;
  removeFillColor: () => void;
  changeBorder: (options: ChangeBorder) => void;
  changeBorderColor: (rgb: ColorResult) => void;
  clearBorders: () => void;
  clearFormatting: () => void;
  changeBorderType: (type?: BorderType) => void;
}

type CellFormatNoPosition = Exclude<CellFormat, 'x' | 'y'>;

interface IProps {
  app?: PixiApp;
}

export const useFormatCells = (props: IProps): IResults => {
  const [interactionState] = useRecoilState(gridInteractionStateAtom);
  const multiCursor = interactionState.showMultiCursor;

  const getStartEnd = (): { start: Coordinate; end: Coordinate } => {
    let start: Coordinate, end: Coordinate;
    if (multiCursor) {
      start = interactionState.multiCursorPosition.originPosition;
      end = interactionState.multiCursorPosition.terminalPosition;
    } else {
      start = interactionState.cursorPosition;
      end = interactionState.cursorPosition;
    }
    return { start, end };
  };

  const onFormat = (updatedFormat: CellFormatNoPosition): void => {
    if (!props.app) return;
    const { start, end } = getStartEnd();
    const formats: CellFormat[] = [];
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        const format = props.app.grid.getFormat(x, y) ?? { x, y };
        formats.push({ ...format, ...updatedFormat });
      }
    }
    updateFormatDB(formats);
  };

  const changeFillColor = (color: ColorResult): void => {
    onFormat({ fillColor: convertReactColorToString(color) });
  };

  const removeFillColor = () => {
    onFormat({ fillColor: undefined });
  };

  const changeBorder = (options: {
    borderLeft?: boolean;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderRight?: boolean;
    borderHorizontal?: boolean;
    borderVertical?: boolean;
  }): void => {
    if (!props.app) return;
    const { start, end } = getStartEnd();
    const formats: CellFormat[] = [];

    // gets neighbor from changed formats list or from gridSparse
    const updateNeighbor = (x: number, y: number, value: number): CellFormat | undefined => {
      if (!props.app) return;
      const neighbor = formats.find((format) => format.x === x && format.y === y);
      if (neighbor?.border) {
        if (neighbor?.border & value) {
          neighbor.border = neighbor.border & (borderAll ^ value);
        }
        return neighbor;
      }
      const newNeighbor = props.app.grid.getFormat(x - 1, y);
      if (newNeighbor?.border) {
        const format = { ...newNeighbor };
        formats.push(format);
        return { ...newNeighbor };
      }
    };

    // this updates border and removes neighboring borders (if necessary)
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        const format = props.app.grid.getFormat(x, y) ?? { x, y };
        let border = format?.border ?? 0;
        if (x === start.x && options.borderLeft !== undefined) {
          if (options.borderLeft === true) {
            border = border | borderLeft;
          } else if (options.borderLeft === false) {
            border = border & (borderAll ^ borderLeft);
          }
          updateNeighbor(x - 1, y, borderRight);
        }
        if (x === end.x && options.borderRight !== undefined) {
          if (options.borderRight === true) {
            border = border | borderRight;
          } else if (options.borderRight === false) {
            border = border & (borderAll ^ borderRight);
          }
          updateNeighbor(x + 1, y, borderLeft);
        }
        if (y === start.y && options.borderTop !== undefined) {
          if (options.borderTop === true) {
            border = border | borderTop;
          } else if (options.borderTop === false) {
            border = border & (borderAll ^ borderTop);
          }
          updateNeighbor(x, y - 1, borderBottom);
        }
        if (y === end.y && options.borderBottom !== undefined) {
          if (options.borderBottom === true) {
            border = border | borderBottom;
          } else if (options.borderBottom === false) {
            border = border & (borderAll ^ borderBottom);
          }
          updateNeighbor(x, y + 1, borderTop);
        }
        if (multiCursor && y !== end.y && options.borderHorizontal !== undefined) {
          if (options.borderHorizontal === true) {
            border = border | borderBottom;
          }
          updateNeighbor(x + 1, y, borderTop);
        }
        if (multiCursor && x !== end.x && options.borderVertical !== undefined) {
          if (options.borderVertical === true) {
            border = border | borderRight;
          }
          updateNeighbor(x + 1, y, borderLeft);
        }
        formats.push({ ...format, border });
      }
    }
    updateFormatDB(formats);
  };

  const changeBorderColor = (color: ColorResult): void => {
    if (!props.app) return;
    const borderColor = convertReactColorToString(color);
    const { start, end } = getStartEnd();
    const formats: CellFormat[] = [];
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        const format = props.app.grid.getFormat(x, y);
        if (format) {
          formats.push({ ...format, borderColor });
        }

        // change neighbor's borderBottom above
        if (y === start.y) {
          const format = props.app.grid.getFormat(x, y - 1);
          if (format?.border && format.border & borderBottom && format.borderColor !== borderColor) {
            formats.push({ ...format, borderColor });
          }
        }

        // change neighbor's borderTop below
        if (y === end.y) {
          const format = props.app.grid.getFormat(x, y + 1);
          if (format?.border && format.border & borderTop && format.borderColor !== borderColor) {
            formats.push({ ...format, borderColor });
          }
        }
      }

      // change neighbor's borderRight to the left
      const left = props.app.grid.getFormat(start.x - 1, y);
      if (left?.border && left.border & borderRight && left.borderColor !== borderColor) {
        formats.push({ ...left, borderColor });
      }

      // change neighbor's borderLeft to the right
      const right = props.app.grid.getFormat(end.x + 1, y);
      if (right?.border && right.border & borderLeft && right.borderColor !== borderColor) {
        formats.push({ ...right, borderColor });
      }
    }
    updateFormatDB(formats);
  };

  const clearBorders = (): void => {
    if (!props.app) return;
    const { start, end } = getStartEnd();
    const formats: CellFormat[] = [];
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        const format = props.app.grid.getFormat(x, y);
        if (format) {
          formats.push({ ...format, border: 0 });
        }

        // clear neighbor's borderBottom above
        if (y === start.y) {
          const format = props.app.grid.getFormat(x, y - 1);
          if (format?.border && format.border & borderBottom) {
            formats.push({ ...format, border: format.border & (borderAll ^ borderBottom) });
          }
        }

        // clear neighbor's borderTop below
        if (y === end.y) {
          const format = props.app.grid.getFormat(x, y + 1);
          if (format?.border && format.border & borderTop) {
            formats.push({ ...format, border: format.border & (borderAll ^ borderTop) });
          }
        }
      }

      // clear neighbor's borderRight to the left
      const left = props.app.grid.getFormat(start.x - 1, y);
      if (left?.border && left.border & borderRight) {
        formats.push({ ...left, border: left.border & (borderAll ^ borderRight) });
      }

      // clear neighbor's borderLeft to the right
      const right = props.app.grid.getFormat(end.x + 1, y);
      if (right?.border && right.border & borderLeft) {
        formats.push({ ...right, border: right.border & (borderAll ^ borderLeft) });
      }
    }
    updateFormatDB(formats);
  };

  const clearFormatting = (): void => {
    if (!props.app) return;
    const { start, end } = getStartEnd();
    const cells: { x: number; y: number }[] = [];
    const formats: CellFormat[] = [];
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        cells.push({ x, y });

        // clear neighbor's borderBottom above
        if (y === start.y) {
          const format = props.app.grid.getFormat(x, y - 1);
          if (format?.border && format.border & borderBottom) {
            formats.push({ ...format, border: format.border & (borderAll ^ borderBottom) });
          }
        }

        // clear neighbor's borderTop below
        if (y === end.y) {
          const format = props.app.grid.getFormat(x, y + 1);
          if (format?.border && format.border & borderTop) {
            formats.push({ ...format, border: format.border & (borderAll ^ borderTop) });
          }
        }
      }

      // clear neighbor's borderRight to the left
      const left = props.app.grid.getFormat(start.x - 1, y);
      if (left?.border && left.border & borderRight) {
        formats.push({ ...left, border: left.border & (borderAll ^ borderRight) });
      }

      // clear neighbor's borderLeft to the right
      const right = props.app.grid.getFormat(end.x + 1, y);
      if (right?.border && right.border & borderLeft) {
        formats.push({ ...right, border: right.border & (borderAll ^ borderLeft) });
      }
    }
    clearFormatDB(cells);
    if (formats.length) {
      updateFormatDB(formats);
    }
  };

  const changeBorderType = (type?: BorderType): void => {
    if (!props.app) return;
    const { start, end } = getStartEnd();
    const formats: CellFormat[] = [];
    for (let y = start.y; y <= end.y; y++) {
      for (let x = start.x; x <= end.x; x++) {
        const format = props.app.grid.getFormat(x, y) ?? { x, y };
        formats.push({ ...format, borderType: type });

        // change neighbor's borderBottom above
        if (y === start.y) {
          const format = props.app.grid.getFormat(x, y - 1);
          if (format?.border && format.border & borderBottom && format.borderType !== type) {
            formats.push({ ...format, borderType: type });
          }
        }

        // change neighbor's borderTop below
        if (y === end.y) {
          const format = props.app.grid.getFormat(x, y + 1);
          if (format?.border && format.border & borderTop && format.borderType !== type) {
            formats.push({ ...format, borderType: type });
          }
        }
      }
      // change neighbor's borderRight to the left
      const left = props.app.grid.getFormat(start.x - 1, y);
      if (left?.border && left.border & borderRight && left.borderType !== type) {
        formats.push({ ...left, borderType: type });
      }

      // change neighbor's borderLeft to the right
      const right = props.app.grid.getFormat(end.x + 1, y);
      if (right?.border && right.border & borderLeft && right.borderType !== type) {
        formats.push({ ...right, borderType: type });
      }
    }
    updateFormatDB(formats);
  };

  return {
    changeFillColor,
    removeFillColor,
    changeBorder,
    changeBorderColor,
    clearBorders,
    clearFormatting,
    changeBorderType,
  };
};
