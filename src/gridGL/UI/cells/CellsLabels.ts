import { Container, Rectangle } from 'pixi.js';
import { Coordinate } from '../../types/size';
import { CellLabel } from './CellLabel';
import { CELL_TEXT_MARGIN_LEFT, CELL_TEXT_MARGIN_TOP } from '../../../constants/gridConstants';
import { Cell, CellFormat } from '../../../grid/sheet/gridTypes';
import { PixiApp } from '../../pixiApp/PixiApp';

export interface LabelData {
  text: string;
  x: number;
  y: number;
  location?: Coordinate;
  isQuadrant?: boolean;
  expectedWidth: number;
  width: number;
  height: number;
  cell?: Cell;
  format?: CellFormat;
}

export class CellsLabels extends Container {
  private app: PixiApp;
  private labelData: LabelData[] = [];

  constructor(app: PixiApp) {
    super();
    this.app = app;
  }

  clear() {
    this.labelData = [];
    this.children.forEach((child) => (child.visible = false));
  }

  add(label: LabelData): void {
    this.labelData.push(label);
  }

  // checks to see if the label needs to be clipped based on other labels
  private checkForClipping(label: CellLabel, data: LabelData): void {
    const x = data.x + CELL_TEXT_MARGIN_LEFT;
    const y = data.y + CELL_TEXT_MARGIN_TOP;
    label.setClip();
    if (label.textWidth > data.expectedWidth) {
      const start = label.x + data.expectedWidth;
      const end = start + (label.width - data.expectedWidth);
      const neighboringLabels = this.labelData.filter(
        (search) => search.y === y && search.x >= start && search.x <= end
      );
      if (neighboringLabels.length) {
        const neighboringLabel = neighboringLabels.sort((a, b) => a.x - b.x)[0];
        label.setClip(neighboringLabel.x - x - CELL_TEXT_MARGIN_LEFT * 2);
      } else {
        label.setClip();
      }
    } else {
      label.setClip();
    }
    this.app.cells.cellsTypeBorder.draw(label, data);
  }

  private compareLabelData(label: CellLabel, data: LabelData): boolean {
    const isSame = (a?: boolean, b?: boolean): boolean => {
      return (!a && !b) || (a && b) ? true : false;
    };

    return (
      label.originalText === data.text &&
      isSame(label.format?.bold, data.format?.bold) &&
      isSame(label.format?.italic, data.format?.italic) &&
      label.format?.textColor === data.format?.textColor
    );
  }

  /**
   * add labels to headings using cached labels
   * @returns the visual bounds only if isQuadrant is defined (otherwise not worth the .width/.height call)
   */
  update(): Rectangle | undefined {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // keep current children to use as the cache
    this.children.forEach((child) => (child.visible = false));

    const available = [...this.children] as CellLabel[];
    const leftovers: LabelData[] = [];

    // reuse existing labels that have the same text
    this.labelData.forEach((data) => {
      const index = available.findIndex((label) => this.compareLabelData(label, data));
      if (index === -1) {
        leftovers.push(data);
      } else {
        const label = available[index];
        label.position.set(data.x + CELL_TEXT_MARGIN_LEFT, data.y + CELL_TEXT_MARGIN_TOP);
        label.visible = true;
        this.checkForClipping(label, data);

        // track overflowed widths
        if (data.isQuadrant) {
          label.location = data.location;
          const width = label.width;
          if (width > data.expectedWidth) {
            label.overflowRight = width - data.expectedWidth;
          } else {
            label.overflowRight = undefined;
          }
          minX = Math.min(label.x, minX);
          maxX = Math.max(label.x + width, maxX);
          minY = Math.min(label.y, minY);
          maxY = Math.max(label.y + label.height, maxY);
        }
        available.splice(index, 1);
      }
    });

    // use existing labels but change the text
    leftovers.forEach((data, i) => {
      let label: CellLabel;
      if (i < available.length) {
        label = available[i];
        label.visible = true;
        label.setFormat(data.format);
      }

      // otherwise create new labels
      else {
        label = this.addChild(new CellLabel(data.format));
      }

      label.position.set(data.x + CELL_TEXT_MARGIN_LEFT, data.y + CELL_TEXT_MARGIN_TOP);
      label.text = data.text;
      this.checkForClipping(label, data);

      // track overflowed widths
      if (data.expectedWidth) {
        label.location = data.location;
        if (label.textWidth > data.expectedWidth) {
          label.overflowRight = label.textWidth - data.expectedWidth;
        } else {
          label.overflowRight = undefined;
        }
      }
      if (data.isQuadrant) {
        minX = Math.min(label.x, minX);
        maxX = Math.max(label.x + label.width, maxX);
        minY = Math.min(label.y, minY);
        maxY = Math.max(label.y + label.height, maxY);
      }
    });

    if (minX !== Infinity) {
      return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    }
  }

  get(): CellLabel[] {
    return this.children as CellLabel[];
  }

  getVisible(): CellLabel[] {
    return this.children.filter((child) => child.visible) as CellLabel[];
  }
}
