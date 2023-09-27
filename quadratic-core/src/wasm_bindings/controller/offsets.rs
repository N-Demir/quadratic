use super::*;

#[wasm_bindgen]
pub struct Placement {
    pub index: i32,
    pub position: f64,
    pub size: i32,
}

#[wasm_bindgen]
impl GridController {
    /// Resizes a column transiently; the operation must be committed using
    /// `commitResize()` or canceled using `cancelResize()`. If `size` is `null`
    /// then the column width is reset.
    #[wasm_bindgen(js_name = "resizeColumnTransiently")]
    pub fn js_resize_column_transiently(
        &mut self,
        sheet_id: String,
        column: i32,
        size: Option<f64>,
    ) {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        self.resize_column_transiently(sheet_id, column as i64, size);
    }
    /// Resizes a row transiently; the operation must be committed using
    /// `commitResize()` or canceled using `cancelResize()`. If `size` is `null`
    /// then the row height is reset.
    #[wasm_bindgen(js_name = "resizeRowTransiently")]
    pub fn js_resize_row_transiently(&mut self, sheet_id: String, row: i32, size: Option<f64>) {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        self.resize_row_transiently(sheet_id, row as i64, size);
    }
    /// Cancels a resize operation.
    #[wasm_bindgen(js_name = "cancelResize")]
    pub fn js_cancel_resize(&mut self) {
        self.cancel_resize();
    }
    /// Commits a resize operation. Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "commitResize")]
    pub fn js_commit_resize(&mut self, cursor: Option<String>) -> Result<JsValue, JsValue> {
        Ok(serde_wasm_bindgen::to_value(&self.commit_resize(cursor))?)
    }

    /// Commits a column resize operation w/o transient changes. Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "resizeColumn")]
    pub fn js_resize_column(
        &mut self,
        sheet_id: String,
        column: i32,
        size: f64,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        self.resize_column_transiently(sheet_id, column as i64, Some(size));
        Ok(serde_wasm_bindgen::to_value(&self.commit_resize(cursor))?)
    }

    /// Returns a rectangle with the screen coordinates for a cell
    #[wasm_bindgen(js_name = "getCellOffsets")]
    pub fn js_get_cell_offsets(&self, sheet_id: String, column: i32, row: i32) -> ScreenRect {
        let sheet = self.grid().sheet_from_string(sheet_id);
        sheet.cell_offsets(column as i64, row as i64)
    }

    /// gets the column width. Returns a f32
    #[wasm_bindgen(js_name = "getColumnWidth")]
    pub fn js_column_width(&self, sheet_id: String, x: i32) -> f32 {
        let sheet = self.grid().sheet_from_string(sheet_id);
        sheet.column_width(x as i64) as f32
    }

    /// gets the row height from a row index
    #[wasm_bindgen(js_name = "getRowHeight")]
    pub fn js_row_height(&self, sheet_id: String, y: i32) -> f32 {
        let sheet = self.grid().sheet_from_string(sheet_id);
        sheet.row_height(y as i64) as f32
    }

    /// gets the screen coordinate and size for a row. Returns a [`Placement`]
    #[wasm_bindgen(js_name = "getColumnPlacement")]
    pub fn js_column_placement(&self, sheet_id: String, column: i32) -> Placement {
        let sheet = self.grid().sheet_from_string(sheet_id);
        let (position, size) = sheet.column_position_size(column as i64);
        Placement {
            index: column,
            position,
            size: size as i32,
        }
    }
    /// gets the screen coordinate and size for a pixel y-coordinate. Returns a [`Placement`]
    #[wasm_bindgen(js_name = "getRowPlacement")]
    pub fn js_row_placement(&self, sheet_id: String, row: i32) -> Placement {
        let sheet = self.grid().sheet_from_string(sheet_id);
        let (position, size) = sheet.row_position_size(row as i64);
        Placement {
            index: row,
            position,
            size: size as i32,
        }
    }

    /// gets the screen coordinate and size for a pixel x-coordinate. Returns a [`Placement`]
    #[wasm_bindgen(js_name = "getXPlacement")]
    pub fn js_x_placement(&self, sheet_id: String, x: f64) -> Placement {
        let sheet = self.grid().sheet_from_string(sheet_id);
        let index = sheet.column_from_x(x);
        Placement {
            index: index.0 as i32,
            position: index.1,
            size: sheet.column_width(index.0) as i32,
        }
    }
    /// gets the screen coordinate and size for a pixel y-coordinate. Returns a [`Placement`]
    #[wasm_bindgen(js_name = "getYPlacement")]
    pub fn js_y_placement(&self, sheet_id: String, y: f64) -> Placement {
        let sheet = self.grid().sheet_from_string(sheet_id);
        let index = sheet.row_from_y(y);
        Placement {
            index: index.0 as i32,
            position: index.1,
            size: sheet.row_height(index.0) as i32,
        }
    }
}
