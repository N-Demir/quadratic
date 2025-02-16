use std::str::FromStr;

use bigdecimal::BigDecimal;

use crate::{
    cell_values::CellValues,
    controller::GridController,
    grid::{formatting::CellFmtArray, NumericDecimals, NumericFormat, NumericFormatKind},
    CellValue, RunLengthEncoding, SheetPos, SheetRect,
};

use super::operation::Operation;

impl GridController {
    /// Convert string to a cell_value and generate necessary operations
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
            if value.contains(',') {
                ops.push(Operation::SetCellFormats {
                    sheet_rect,
                    attr: CellFmtArray::NumericCommas(RunLengthEncoding::repeat(Some(true), 1)),
                });
            }
            // only change decimal places if decimals have not been set
            if let Some(sheet) = self.try_sheet(sheet_pos.sheet_id) {
                if sheet
                    .get_formatting_value::<NumericDecimals>(sheet_pos.into())
                    .is_none()
                {
                    ops.push(Operation::SetCellFormats {
                        sheet_rect,
                        attr: CellFmtArray::NumericDecimals(RunLengthEncoding::repeat(Some(2), 1)),
                    });
                }
            }
            CellValue::Number(number)
        } else if let Some(bool) = CellValue::unpack_boolean(value) {
            bool
        } else if let Ok(bd) = BigDecimal::from_str(&CellValue::strip_commas(value)) {
            if value.contains(',') {
                ops.push(Operation::SetCellFormats {
                    sheet_rect,
                    attr: CellFmtArray::NumericCommas(RunLengthEncoding::repeat(Some(true), 1)),
                });
            }
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

    /// Generate operations for a user-initiated change to a cell value
    pub fn set_cell_value_operations(
        &mut self,
        sheet_pos: SheetPos,
        value: String,
    ) -> Vec<Operation> {
        let mut ops = vec![];

        // strip whitespace
        let value = value.trim();

        // convert the string to a cell value and generate necessary operations
        let (operations, cell_value) = self.string_to_cell_value(sheet_pos, value);
        ops.extend(operations);

        ops.push(Operation::SetCellValues {
            sheet_pos,
            values: CellValues::from(cell_value),
        });
        ops
    }

    /// Generates and returns the set of operations to delete the values and code in a sheet_rect
    /// Does not commit the operations or create a transaction.
    pub fn delete_cells_rect_operations(&mut self, sheet_rect: SheetRect) -> Vec<Operation> {
        let values = CellValues::new(sheet_rect.width() as u32, sheet_rect.height() as u32);
        vec![Operation::SetCellValues {
            sheet_pos: sheet_rect.into(),
            values,
        }]
    }

    /// Generates and returns the set of operations to clear the formatting in a sheet_rect
    pub fn delete_values_and_formatting_operations(
        &mut self,
        sheet_rect: SheetRect,
    ) -> Vec<Operation> {
        let mut ops = self.delete_cells_rect_operations(sheet_rect);
        ops.extend(self.clear_formatting_operations(sheet_rect));
        ops
    }
}

#[cfg(test)]
mod test {
    use std::str::FromStr;

    use bigdecimal::BigDecimal;

    use crate::{controller::GridController, grid::SheetId, CellValue, SheetPos};

    #[test]
    fn test() {
        let mut client = GridController::test();
        let sheet_id = SheetId::test();
        client.sheet_mut(client.sheet_ids()[0]).id = sheet_id;
        let summary = client.set_cell_value(
            SheetPos {
                x: 1,
                y: 2,
                sheet_id,
            },
            "hello".to_string(),
            None,
        );
        assert_eq!(summary.operations, Some("[{\"SetCellValues\":{\"sheet_pos\":{\"x\":1,\"y\":2,\"sheet_id\":{\"id\":\"00000000-0000-0000-0000-000000000000\"}},\"values\":{\"columns\":[{\"0\":{\"type\":\"text\",\"value\":\"hello\"}}],\"w\":1,\"h\":1}}}]".to_string()));
    }

    #[test]
    fn boolean_to_cell_value() {
        let mut gc = GridController::test();
        let sheet_pos = SheetPos {
            x: 1,
            y: 2,
            sheet_id: SheetId::test(),
        };
        let (ops, value) = gc.string_to_cell_value(sheet_pos, "true");
        assert_eq!(ops.len(), 0);
        assert_eq!(value, true.into());

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "false");
        assert_eq!(ops.len(), 0);
        assert_eq!(value, false.into());

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "TRUE");
        assert_eq!(ops.len(), 0);
        assert_eq!(value, true.into());

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "FALSE");
        assert_eq!(ops.len(), 0);
        assert_eq!(value, false.into());

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "tRue");
        assert_eq!(ops.len(), 0);
        assert_eq!(value, true.into());

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "FaLse");
        assert_eq!(ops.len(), 0);
        assert_eq!(value, false.into());
    }

    #[test]
    fn number_to_cell_value() {
        let mut gc = GridController::test();
        let sheet_pos = SheetPos {
            x: 1,
            y: 2,
            sheet_id: SheetId::test(),
        };
        let (ops, value) = gc.string_to_cell_value(sheet_pos, "123");
        assert_eq!(ops.len(), 0);
        assert_eq!(value, 123.into());

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "123.45");
        assert_eq!(ops.len(), 0);
        assert_eq!(
            value,
            CellValue::Number(BigDecimal::from_str("123.45").unwrap())
        );

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "123,456.78");
        assert_eq!(ops.len(), 1);
        assert_eq!(
            value,
            CellValue::Number(BigDecimal::from_str("123456.78").unwrap())
        );

        let (ops, value) = gc.string_to_cell_value(sheet_pos, "123,456,789.01");
        assert_eq!(ops.len(), 1);
        assert_eq!(
            value,
            CellValue::Number(BigDecimal::from_str("123456789.01").unwrap())
        );
    }
}
