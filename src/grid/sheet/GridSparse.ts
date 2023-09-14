import { Rectangle } from 'pixi.js';
import { CellFill, CellRust } from '../../gridGL/cells/CellsTypes';
import { Quadrants } from '../../gridGL/quadrants/Quadrants';
import { Coordinate, MinMax } from '../../gridGL/types/size';
import { JsRenderBorder, JsRenderCodeCell } from '../../quadratic-core/types';
import { Cell, CellFormat } from '../../schemas';
import { CellRectangle } from './CellRectangle';
import { GridOffsets } from './GridOffsets';
import { Sheet } from './Sheet';

export interface CellAndFormat {
  cell?: Cell;
  format?: CellFormat;
}

/** Stores all cells and format locations */
export class GridSparse {
  private sheet: Sheet;

  sheetId: string;

  // tracks which quadrants need to render based on GridSparse data
  quadrants = new Set<string>();

  constructor(sheet: Sheet) {
    this.sheet = sheet;

    // const sheetId = '';
    // if (!sheetId) throw new Error('Expected sheetId to be defined');
    this.sheetId = '';
  }

  get gridOffsets(): GridOffsets {
    return this.sheet.gridOffsets;
  }

  updateCells(cells: Cell[], skipBounds = false): void {
    // cells.forEach((cell) => {
    //   if (cell.type === 'TEXT') {
    //     this.grid.setCellValue(this.sheetId, new Pos(cell.x, cell.y), { type: 'text', value: cell.value });
    //   } else {
    //     debugger;
    //   }
    //   this.quadrants.add(Quadrants.getKey(cell.x, cell.y));
    // });
    // if (!skipBounds) {
    //   this.grid.recalculateBounds(this.sheetId);
    // }
  }

  hasFormatting(format: CellFormat): boolean {
    const keys = Object.keys(format);
    return keys.length > 2;
  }

  // todo: this should be separated into its components
  updateFormat(formats: CellFormat[], skipBounds = false): void {
    // let background = false;
    // let labels = false;
    // formats.forEach((format) => {
    //   const region = new Rect(new Pos(format.x, format.y), new Pos(format.x, format.y));
    //   const originalRange = this.grid.getRenderCells(this.sheetId, region);
    //   const original = JSON.parse(originalRange)?.[0] ?? {};
    //   if (this.hasFormatting(format)) {
    //     if (format.bold !== undefined && format.bold !== original.bold) {
    //       this.grid.setCellBold(this.sheetId, region, !!format.bold);
    //       labels = true;
    //     }
    //     if (format.italic !== undefined && format.italic !== original.italic) {
    //       this.grid.setCellItalic(this.sheetId, region, !!format.italic);
    //       labels = true;
    //     }
    //     if (format.alignment !== undefined && format.alignment !== original.align) {
    //       this.grid.setCellAlign(this.sheetId, region, format.alignment);
    //       labels = true;
    //     }
    //     if (format.fillColor !== undefined && format.fillColor !== original.fillColor) {
    //       this.grid.setCellFillColor(this.sheetId, region, format.fillColor);
    //       background = true;
    //     }
    //     if (format.textColor !== undefined && format.textColor !== original.textColor) {
    //       this.grid.setCellTextColor(this.sheetId, region, format.textColor);
    //       labels = true;
    //     }
    //     if (format.textFormat !== undefined && format.textFormat !== original.textFormat) {
    //       this.grid.setCellNumericFormat(this.sheetId, region, format.textFormat);
    //       labels = true;
    //     }
    //     if (format.wrapping !== undefined && format.wrapping !== original.wrapping) {
    //       this.grid.setCellWrap(this.sheetId, region, format.textFormat);
    //       labels = true;
    //     }
    //   } else {
    //     this.grid.clearFormatting(this.sheetId, region);
    //     labels = true;
    //     background = true;
    //   }
    //   this.quadrants.add(Quadrants.getKey(format.x, format.y));
    // });
    // if (!skipBounds) {
    //   this.grid.recalculateBounds(this.sheetId);
    // }
    // pixiAppEvents.changed({
    //   sheet: this.sheet,
    //   cells: formats.map((format) => ({ x: format.x, y: format.y })),
    //   labels,
    //   background,
    // });
  }

  clearFormat(formats: CellFormat[], skipBounds = false): void {
    // formats.forEach((format) => {
    //   const region = new Rect(new Pos(format.x, format.y), new Pos(format.x, format.y));
    //   this.grid.clearFormatting(this.sheetId, region);
    // });
    // if (!skipBounds) {
    //   this.grid.recalculateBounds(this.sheetId);
    // }
  }

  deleteCells(cells: Coordinate[], skipBounds = false): void {
    // cells.forEach((cell) => {
    //   const region = new Rect(new Pos(cell.x, cell.y), new Pos(cell.x, cell.y));
    //   this.grid.deleteCellValues(this.sheetId, region);
    // });
    // if (!skipBounds) {
    //   this.grid.recalculateBounds(this.sheetId);
    // }
  }

  get empty(): boolean {
    return true;
    // const bounds = this.grid.getGridBounds(this.sheetId, false);
    // return bounds.width === 0 && bounds.height === 0;
  }

  clear() {
    // this.cells.clear();
    // this.quadrants.clear();
    // this.cellBounds.clear();
    // this.formatBounds.clear();
    // this.cellFormatBounds.clear();
  }

  get(x: number, y: number): CellAndFormat | undefined {
    // const json = this.grid.getRenderCells(this.sheetId, new Rect(new Pos(x, y), new Pos(x, y)));
    // const data = JSON.parse(json);
    // if (data.length) {
    //   return {
    //     cell: {
    //       x,
    //       y,
    //       value: data[0].value.value.toString(),
    //       type: 'TEXT',
    //     },
    //     format: {
    //       x,
    //       y,
    //       bold: data[0].bold,
    //       italic: data[0].italic,
    //       alignment: data[0].align,
    //       fillColor: data[0].fillColor,
    //       textColor: data[0].textColor,
    //       textFormat: data[0].textFormat,
    //       wrapping: data[0].wrapping,
    //     },
    //   };
    // }
    return;
  }

  getCell(x: number, y: number): Cell | undefined {
    // const json = this.grid.getRenderCells(this.sheetId, new Rect(new Pos(x, y), new Pos(x, y)));
    // const data = JSON.parse(json);
    // return {
    //   x,
    //   y,
    //   value: data[0].value.toString(),
    //   type: 'TEXT',
    // };
    return;
  }

  getFormat(x: number, y: number): CellFormat | undefined {
    // const json = this.grid.getRenderCells(this.sheetId, new Rect(new Pos(x, y), new Pos(x, y)));
    // const data = JSON.parse(json);
    // if (!data[0]) return;
    // return {
    //   x,
    //   y,
    //   bold: data[0].bold,
    //   italic: data[0].italic,
    //   alignment: data[0].align,
    //   fillColor: data[0].fillColor,
    //   textColor: data[0].textColor,
    //   textFormat: data[0].textFormat,
    //   wrapping: data[0].wrapping,
    // };
    return;
  }

  getCellValue(rectangle: Rectangle): CellRust[] {
    // const rect = new Rect(new Pos(rectangle.left, rectangle.top), new Pos(rectangle.right, rectangle.bottom));
    // const cells = this.grid.getRenderCells(this.sheetId, rect);
    // return JSON.parse(cells);
    return [];
  }

  getCellBackground(rectangle: Rectangle): CellFill[] {
    // const rect = new Rect(new Pos(rectangle.left, rectangle.top), new Pos(rectangle.right, rectangle.bottom));
    // const background = this.grid.getRenderFills(this.sheetId, rect);
    // return JSON.parse(background);
    return [];
  }

  getCells(rectangle: Rectangle): CellRectangle {
    // const rect = new Rect(new Pos(rectangle.x, rectangle.y), new Pos(rectangle.right, rectangle.bottom));
    // const data = this.grid.getRenderCells(this.sheetId, rect);
    // return CellRectangle.fromRust(rectangle, data, this);
    return new CellRectangle(new Rectangle(0, 0, 0, 0), this);
  }

  getRenderCodeCells(): JsRenderCodeCell[] | undefined {
    // const data = this.grid.getRenderCodeCells(this.sheetId);
    // return JSON.parse(data);
    return [];
  }

  getNakedCells(x0: number, y0: number, x1: number, y1: number): Cell[] {
    // const json = this.grid.getRenderCells(this.sheetId, new Rect(new Pos(x0, y0), new Pos(x1, y1)));
    // const data = JSON.parse(json);
    // const cells: Cell[] = [];
    // data.forEach((entry: any) => {
    //   if (entry.x >= x0 && entry.x <= x1 && entry.y >= y0 && entry.y <= y1) {
    //     cells.push({
    //       x: entry.x,
    //       y: entry.y,
    //       type: 'TEXT',
    //       value: entry.value,
    //     });
    //   }
    // });
    // return cells;
    return [];
  }

  getNakedFormat(x0: number, y0: number, x1: number, y1: number): CellFormat[] {
    // const json = this.grid.getRenderCells(this.sheetId, new Rect(new Pos(x0, y0), new Pos(x1, y1)));
    // const data = JSON.parse(json);
    // const cells: CellFormat[] = [];
    // data.forEach((entry: any) => {
    //   if (entry.x >= x0 && entry.x <= x1 && entry.y >= y0 && entry.y <= y1) {
    //     cells.push({
    //       x: entry.x,
    //       y: entry.y,
    //       bold: entry.bold,
    //       italic: entry.italic,
    //       alignment: entry.align,
    //       fillColor: entry.fillColor,
    //       textColor: entry.textColor,
    //       textFormat: entry.textFormat,
    //       wrapping: entry.wrapping,
    //     });
    //   }
    // });
    // return cells;
    return [];
  }

  getSheetBounds(onlyData: boolean): Rectangle | undefined {
    // const bounds = this.grid.getGridBounds(this.sheetId, onlyData);
    // if (bounds.type !== 'nonEmpty') return;
    // return new Rectangle(bounds.min.x, bounds.min.y, bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
    return;
  }

  /** finds the minimum and maximum location for content in a row */
  getRowMinMax(row: number, onlyData: boolean): MinMax | undefined {
    // const { minX, maxX, empty } = this.cellFormatBounds;
    // if (empty) return;
    // let min = Infinity;
    // let max = -Infinity;
    // for (let x = minX; x <= maxX; x++) {
    //   const entry = this.get(x, row);
    //   if (entry && ((onlyData && entry.cell) || (!onlyData && entry))) {
    //     min = x;
    //     break;
    //   }
    // }
    // for (let x = maxX; x >= minX; x--) {
    //   const entry = this.get(x, row);
    //   if (entry && ((onlyData && entry.cell) || (!onlyData && entry))) {
    //     max = x;
    //     break;
    //   }
    // }
    // if (min === Infinity) return;
    // return { min, max };
    return;
  }

  /**finds the minimum and maximum location for content in a column */
  getColumnMinMax(column: number, onlyData: boolean): MinMax | undefined {
    // const { minY, maxY, empty } = this.cellFormatBounds;
    // if (empty) return;
    // let min = Infinity;
    // let max = -Infinity;
    // for (let y = minY; y <= maxY; y++) {
    //   const entry = this.get(column, y);
    //   if (entry && ((onlyData && entry.cell) || (!onlyData && entry))) {
    //     min = y;
    //     break;
    //   }
    // }
    // for (let y = maxY; y >= minY; y--) {
    //   const entry = this.get(column, y);
    //   if (entry && ((onlyData && entry.cell) || (!onlyData && entry))) {
    //     max = y;
    //     break;
    //   }
    // }
    // if (min === Infinity) return;
    // return { min, max };
    return;
  }

  hasQuadrant(x: number, y: number): boolean {
    return this.quadrants.has(Quadrants.getKey(x, y));
  }

  /**
   * finds the next column with or without content
   * @param options
   * @param xStart where to start looking
   * @param y the row to look in
   * @param delta 1 or -1
   * @param withContent if true, will find the next column with content, if false, will find the next column without content
   * @returns the found column or the original column if nothing was found
   */
  findNextColumn(options: { xStart: number; y: number; delta: 1 | -1; withContent: boolean }): number {
    // const { xStart, delta, y, withContent } = options;
    // const bounds = this.cellBounds;
    // if (!bounds) return xStart;
    // let x = delta === 1 ? Math.max(xStart, bounds.minX) : Math.min(xStart, bounds.maxX);

    // // -1 and +1 are to cover where the cell at the bounds should be returned
    // while (x >= bounds.minX - 1 && x <= bounds.maxX + 1) {
    //   const hasContent = cellHasContent(this.get(x, y)?.cell);
    //   if ((withContent && hasContent) || (!withContent && !hasContent)) {
    //     return x;
    //   }
    //   x += delta;
    // }
    // return xStart;
    return 0;
  }

  /**
   * finds the next row with or without content
   * @param options
   * @param yStart where to start looking
   * @param x the column to look in
   * @param delta 1 or -1
   * @param withContent if true, will find the next column with content, if false, will find the next column without content
   * @returns the found row or the original row if nothing was found
   */
  findNextRow(options: { yStart: number; x: number; delta: 1 | -1; withContent: boolean }): number {
    // const { yStart, delta, x, withContent } = options;
    // const bounds = this.cellBounds;
    // if (!bounds) return yStart;
    // let y = delta === 1 ? Math.max(yStart, bounds.minY) : Math.min(yStart, bounds.maxY);

    // // -1 and +1 are to cover where the cell at the bounds should be returned
    // while (y >= bounds.minY - 1 && y <= bounds.maxY + 1) {
    //   const hasContent = cellHasContent(this.get(x, y)?.cell);
    //   if ((withContent && hasContent) || (!withContent && !hasContent)) {
    //     return y;
    //   }
    //   y += delta;
    // }
    // return yStart;
    return 0;
  }

  recalculateBounds(): void {
    // this.grid.recalculateBounds(this.sheetId);
  }

  getHorizontalBorders(): JsRenderBorder[] {
    // const data = this.grid.getRenderHorizontalBorders(this.sheetId);
    // return JSON.parse(data);
    return [];
  }

  getVerticalBorders(): JsRenderBorder[] {
    // const data = this.grid.getRenderVerticalBorders(this.sheetId);
    // return JSON.parse(data);
    return [];
  }
}
