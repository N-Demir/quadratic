use std::str::FromStr;

use bigdecimal::BigDecimal;

use crate::{
    controller::GridController,
    grid::{formatting::CellFmtArray, NumericDecimals, NumericFormat, NumericFormatKind},
    Array, CellValue, RunLengthEncoding, SheetPos, SheetRect,
};

use super::operation::Operation;

impl GridController {
    pub(super) fn string_to_cell_value(
        &mut self,
        sheet_pos: SheetPos,
        value: &str,
    ) -> (Vec<Operation>, CellValue) {
        let mut ops = vec![];
        let sheet_rect: SheetRect = sheet_pos.into();
        let cell_value = if value.is_empty() {
            CellValue::Blank
        } else if let Some((currency, number)) = CellValue::unpack_currency(value) {
            let numeric_format = NumericFormat {
                kind: NumericFormatKind::Currency,
                symbol: Some(currency),
            };
            ops.push(Operation::SetCellFormats {
                sheet_rect,
                attr: CellFmtArray::NumericFormat(RunLengthEncoding::repeat(
                    Some(numeric_format),
                    1,
                )),
            });
            // only change decimal places if decimals have not been set
            let sheet = self.grid.sheet_from_id(sheet_pos.sheet_id);
            if sheet
                .get_formatting_value::<NumericDecimals>(sheet_pos.into())
                .is_none()
            {
                ops.push(Operation::SetCellFormats {
                    sheet_rect,
                    attr: CellFmtArray::NumericDecimals(RunLengthEncoding::repeat(Some(2), 1)),
                });
            }
            CellValue::Number(number)
        } else if let Ok(bd) = BigDecimal::from_str(value) {
            CellValue::Number(bd)
        } else if let Some(percent) = CellValue::unpack_percentage(value) {
            let numeric_format = NumericFormat {
                kind: NumericFormatKind::Percentage,
                symbol: None,
            };
            ops.push(Operation::SetCellFormats {
                sheet_rect,
                attr: CellFmtArray::NumericFormat(RunLengthEncoding::repeat(
                    Some(numeric_format),
                    1,
                )),
            });
            CellValue::Number(percent)
        } else {
            CellValue::Text(value.into())
        };
        (ops, cell_value)
    }

    pub fn set_cell_value_operations(
        &mut self,
        sheet_pos: SheetPos,
        value: String,
    ) -> Vec<Operation> {
        let mut ops = vec![];

        // strip whitespace
        let value = value.trim();

        // check if any code cells need to be deleted
        let sheet = match self.grid.try_sheet_from_id(sheet_pos.sheet_id) {
            None => return vec![], // sheet may have been deleted in multiplayer
            Some(sheet) => sheet,
        };
        sheet.code_cells.iter().for_each(|(pos, _)| {
            let possible_delete = pos.to_sheet_pos(sheet.id);
            if sheet_pos == possible_delete {
                ops.extend(self.delete_code_cell_operations(possible_delete));
            }
        });

        // convert the string to a cell value and generate necessary operations
        let (operations, cell_value) = self.string_to_cell_value(sheet_pos, value);
        ops.extend(operations);

        ops.extend(self.check_for_cell_value_spill_error(sheet_pos));

        ops.push(Operation::SetCellValues {
            sheet_rect: sheet_pos.into(),
            values: Array::from(cell_value),
        });
        ops
    }

    /// Generates and returns the set of operations to deleted the values and code in a given region
    /// Does not commit the operations or create a transaction.
    pub fn delete_cells_rect_operations(&mut self, sheet_rect: SheetRect) -> Vec<Operation> {
        let mut ops = vec![];
        let values = Array::new_empty(sheet_rect.size());
        ops.push(Operation::SetCellValues { sheet_rect, values });

        let sheet = self.grid.sheet_from_id(sheet_rect.sheet_id);

        // collect all the code cells in the region
        for pos in sheet.code_cells.keys() {
            if sheet_rect.contains(pos.to_sheet_pos(sheet_rect.sheet_id)) {
                ops.push(Operation::SetCodeCell {
                    sheet_pos: pos.to_sheet_pos(sheet_rect.sheet_id),
                    code_cell_value: None,
                });
            }
        }
        ops
    }

    pub fn delete_values_and_formatting_operations(
        &mut self,
        sheet_rect: SheetRect,
    ) -> Vec<Operation> {
        let mut ops = self.delete_cells_rect_operations(sheet_rect);
        ops.extend(self.clear_formatting_operations(sheet_rect));
        ops
    }
}
