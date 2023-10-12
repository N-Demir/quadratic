import { Container, Rectangle, Sprite, Texture, TilingSprite } from 'pixi.js';
import { grid } from '../../grid/controller/Grid';
import { Sheet } from '../../grid/sheet/Sheet';
import { JsRenderBorder, JsRenderBorders } from '../../quadratic-core/quadratic_core';
import { CellsSheet } from './CellsSheet';
import { BorderCull, drawCellBorder } from './drawBorders';

export class CellsBorders extends Container {
  private cellsSheet: CellsSheet;
  private sprites: BorderCull[];

  constructor(cellsSheet: CellsSheet) {
    super();
    this.cellsSheet = cellsSheet;
    this.sprites = [];
  }

  private get sheet(): Sheet {
    return this.cellsSheet.sheet;
  }

  clear(): void {
    this.removeChildren();
  }

  drawHorizontal(borders: JsRenderBorders) {
    let border: JsRenderBorder | undefined;
    while ((border = borders.horizontal_next())) {
      if (border.w === undefined) throw new Error('Expected border.w to be defined in CellsBorders.drawHorizontal');
      const start = this.sheet.offsets.getCellOffsets(Number(border.x), Number(border.y));
      const end = this.sheet.offsets.getCellOffsets(Number(border.x) + border.w, Number(border.y));
      const color = border.style.color;
      this.sprites.push(
        ...drawCellBorder({
          position: new Rectangle(start.x, start.y, end.x - start.x, end.y - start.y),
          horizontal: { type: border.style.line, color },
          getSprite: this.getSprite,
        })
      );
    }
  }

  drawVertical(borders: JsRenderBorders) {
    let border: JsRenderBorder | undefined;
    while ((border = borders.vertical_next())) {
      if (border.h === undefined) throw new Error('Expected border.h to be defined in CellsBorders.drawVertical');
      const start = this.sheet.offsets.getCellOffsets(Number(border.x), Number(border.y));
      const end = this.sheet.offsets.getCellOffsets(Number(border.x), Number(border.y) + border.h!);
      const color = border.style.color;
      this.sprites.push(
        ...drawCellBorder({
          position: new Rectangle(start.x, start.y, end.x - start.x, end.y - start.y),
          vertical: { type: border.style.line, color },
          getSprite: this.getSprite,
        })
      );
    }
  }

  create(): void {
    this.clear();
    const borders = grid.getRenderBorders(this.sheet.id);
    this.drawHorizontal(borders);
    this.drawVertical(borders);
    borders.free();
  }

  private getSprite = (tiling?: boolean): Sprite | TilingSprite => {
    if (tiling) {
      return this.addChild(new TilingSprite(Texture.WHITE));
    } else {
      return this.addChild(new Sprite(Texture.WHITE));
    }
  };

  // draw(input: CellsDraw): void {
  //   const drawInputBorder = (input: CellsDraw, tint: number, alpha: number): void => {
  //     drawBorder({
  //       x: input.x,
  //       y: input.y,
  //       width: input.width,
  //       height: input.height,
  //       tint,
  //       alpha,
  //       getSprite: this.getSprite,
  //       top: true,
  //       bottom: true,
  //       left: true,
  //       right: true,
  //     });
  //   };

  //   if (input.cell && this.app.settings.showCellTypeOutlines) {
  //     // Change outline color based on cell type
  //     if (input.cell.type === 'TEXT') {
  //       // drawInputBorder(input, colors.cellColorUserText, 0.75);
  //     } else if (input.cell.type === 'PYTHON') {
  //       drawInputBorder(input, colors.cellColorUserPython, 0.75);
  //     } else if (input.cell.type === 'FORMULA') {
  //       drawInputBorder(input, colors.cellColorUserFormula, 0.75);
  //     } else if (input.cell.type === 'AI') {
  //       drawInputBorder(input, colors.cellColorUserAI, 0.75);
  //     } else if (input.cell.type === 'COMPUTED') {
  //       // drawInputBorder(input, colors.independence, 0.75);
  //     }
  //   }
  // }

  // drawBorders(borders: Border[]): Rectangle | undefined {
  //   if (!borders.length) return;
  //   let minX = Infinity,
  //     minY = Infinity,
  //     maxX = -Infinity,
  //     maxY = -Infinity;
  //   const { gridOffsets } = this.app.sheet;
  //   borders.forEach((border) => {
  //     const position = gridOffsets.getCell(border.x, border.y);
  //     if (border.horizontal || border.vertical) {
  //       drawCellBorder({
  //         position,
  //         border,
  //         getSprite: this.getSprite,
  //       });
  //       if (border.horizontal) {
  //         minX = Math.min(minX, position.x);
  //         minY = Math.min(minY, position.y);
  //         maxX = Math.max(maxX, position.x + position.width);
  //         maxY = Math.max(maxY, position.y);
  //       }
  //       if (border.vertical) {
  //         minX = Math.min(minX, position.x);
  //         minY = Math.min(minY, position.y);
  //         maxX = Math.max(maxX, position.x);
  //         maxY = Math.max(maxY, position.y + position.height);
  //       }
  //     }
  //   });
  //   return new Rectangle(minX, minY, maxX - minX, maxY - minY);
  // }
}
