use super::*;
use crate::{controller::transactions::TransactionSummary, grid::js_types::*};
use std::str::FromStr;

#[wasm_bindgen]
impl GridController {
    /// Imports a [`GridController`] from a file (that fits the schema defined in JS).
    #[wasm_bindgen(js_name = "newFromFile")]
    pub fn js_new_from_file(file: JsValue) -> Result<GridController, JsValue> {
        Ok(GridController::from_grid(Grid::from_legacy(
            &serde_wasm_bindgen::from_value(file)?,
        )?))
    }

    /// Exports a [`GridController`] to a file. Returns a `GridFile` (fits JS schema).
    #[wasm_bindgen(js_name = "exportToFile")]
    pub fn js_export_to_file(&self) -> Result<JsValue, JsValue> {
        Ok(serde_wasm_bindgen::to_value(
            &self.grid().to_legacy_file_format(),
        )?)
    }

    /// Constructs a new empty grid.
    #[wasm_bindgen(constructor)]
    pub fn js_new() -> Self {
        Self::new()
    }

    /// Returns whether there is a transaction to undo.
    #[wasm_bindgen(js_name = "hasUndo")]
    pub fn js_has_undo(&self) -> bool {
        self.has_undo()
    }
    /// Returns whether there is a transaction to redo.
    #[wasm_bindgen(js_name = "hasRedo")]
    pub fn js_has_redo(&self) -> bool {
        self.has_redo()
    }

    /// Undoes one transaction. Returns a [`TransactionSummary`], or `null` if
    /// there was nothing to undo.
    #[wasm_bindgen(js_name = "undo")]
    pub fn js_undo(&mut self, cursor: Option<String>) -> Result<JsValue, JsValue> {
        Ok(serde_wasm_bindgen::to_value(&self.undo(cursor))?)
    }
    /// Redoes one transaction. Returns a [`TransactionSummary`], or `null` if
    /// there was nothing to redo.
    #[wasm_bindgen(js_name = "redo")]
    pub fn js_redo(&mut self, cursor: Option<String>) -> Result<JsValue, JsValue> {
        Ok(serde_wasm_bindgen::to_value(&self.redo(cursor))?)
    }

    /// Adds an empty sheet to the grid. Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "addSheet")]
    pub fn js_add_sheet(&mut self, cursor: Option<String>) -> Result<JsValue, JsValue> {
        Ok(serde_wasm_bindgen::to_value(&self.add_sheet(cursor))?)
    }
    /// Gets a list of ordered sheet ids
    #[wasm_bindgen(js_name = "getSheetIds")]
    pub fn js_get_sheet_ids(&mut self) -> Result<String, JsValue> {
        let sheet_ids: Vec<String> = self.sheet_ids().iter().map(|id| id.to_string()).collect();
        Ok(serde_json::to_string(&sheet_ids).map_err(|e| e.to_string())?)
    }
    /// Deletes a sheet from the the grid. Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "deleteSheet")]
    pub fn js_delete_sheet(
        &mut self,
        sheet_id: String,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id);
        Ok(serde_wasm_bindgen::to_value(
            &self.delete_sheet(sheet_id.unwrap(), cursor),
        )?)
    }
    /// Moves a sheet to before another sheet, or to the end of the list.
    /// Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "moveSheet")]
    pub fn js_move_sheet(
        &mut self,
        sheet_id: String,
        to_before: Option<String>,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let to_before = match to_before {
            Some(to_before) => Some(SheetId::from_str(&to_before).unwrap()),
            None => None,
        };
        Ok(serde_wasm_bindgen::to_value(
            &self.move_sheet(sheet_id, to_before, cursor),
        )?)
    }
    /// Makes a copy of a sheet. Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "duplicateSheet")]
    pub fn js_duplicate_sheet(
        &mut self,
        sheet_id: String,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        Ok(serde_wasm_bindgen::to_value(
            &self.duplicate_sheet(sheet_id, cursor),
        )?)
    }

    /// Returns the ID of the sheet at the given index.
    #[wasm_bindgen(js_name = "sheetIdToIndex")]
    pub fn js_sheet_id_to_index(&self, id: String) -> Option<usize> {
        let sheet_id = SheetId::from_str(&id).unwrap();
        self.grid().sheet_id_to_index(sheet_id)
    }
    /// Returns the index of the sheet with the given ID.
    #[wasm_bindgen(js_name = "sheetIndexToId")]
    pub fn js_sheet_index_to_id(&self, index: usize) -> Result<String, JsValue> {
        let sheet_id = self.grid().sheet_index_to_id(index);
        match sheet_id {
            Some(sheet_id) => Ok(sheet_id.to_string()),
            None => Err(JsValue::UNDEFINED),
        }
    }

    /// Populates a portion of a sheet with random float values.
    ///
    /// Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "populateWithRandomFloats")]
    pub fn js_populate_with_random_floats(
        &mut self,
        sheet_id: String,
        region: &Rect,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        self.populate_with_random_floats(sheet_id, region);
        Ok(serde_wasm_bindgen::to_value(&TransactionSummary {
            cell_regions_modified: vec![(sheet_id, *region)],
            fill_sheets_modified: vec![],
            border_sheets_modified: vec![],
            code_cells_modified: vec![],
            sheet_list_modified: false,
            cursor: None,
        })?)
    }

    /// Returns a sheet's bounds.
    #[wasm_bindgen(js_name = "getGridBounds")]
    pub fn get_grid_bounds(
        &self,
        sheet_id: String,
        ignore_formatting: bool,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();

        Ok(serde_wasm_bindgen::to_value(
            &self.sheet(sheet_id).bounds(ignore_formatting),
        )?)
    }

    /// Returns cell data in a format useful for rendering. This includes only
    /// the data necessary to render raw text values.
    ///
    /// Returns a string containing a JSON array of [`JsRenderCell`].
    #[wasm_bindgen(js_name = "getRenderCells")]
    pub fn get_render_cells(&self, sheet_id: String, &region: &Rect) -> Result<String, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output = self.sheet(sheet_id).get_render_cells(region);
        Ok(serde_json::to_string::<[JsRenderCell]>(&output).map_err(|e| e.to_string())?)
    }
    /// Returns data for rendering cell fill color as a string containing a JSON
    /// array of [`JsRenderFill`].
    #[wasm_bindgen(js_name = "getRenderFills")]
    pub fn get_render_fills(&self, sheet_id: String, region: &Rect) -> Result<String, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output = self.sheet(sheet_id).get_render_fills(*region);
        Ok(serde_json::to_string::<[JsRenderFill]>(&output).map_err(|e| e.to_string())?)
    }
    /// Returns data for rendering all cell fill color as a string containing a JSON
    /// array of [`JsRenderFill`].
    #[wasm_bindgen(js_name = "getAllRenderFills")]
    pub fn get_all_render_fills(&self, sheet_id: String) -> Result<String, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output = self.sheet(sheet_id).get_all_render_fills();
        Ok(serde_json::to_string::<[JsRenderFill]>(&output).map_err(|e| e.to_string())?)
    }
    /// Returns data for rendering code cells as a string containing a JSON array
    /// of [`JsRenderCodeCell`].
    #[wasm_bindgen(js_name = "getRenderCodeCells")]
    pub fn get_render_code_cells(
        &self,
        sheet_id: String,
        region: &Rect,
    ) -> Result<String, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output = self.sheet(sheet_id).get_render_code_cells(*region);
        Ok(serde_json::to_string::<[JsRenderCodeCell]>(&output).map_err(|e| e.to_string())?)
    }
    /// Returns data for rendering code cells as a string containing a JSON array
    /// of [`JsRenderCodeCell`].
    #[wasm_bindgen(js_name = "getAllRenderCodeCells")]
    pub fn get_all_render_code_cells(&self, sheet_id: String) -> Result<String, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output = self.sheet(sheet_id).get_all_render_code_cells();
        Ok(serde_json::to_string::<[JsRenderCodeCell]>(&output).map_err(|e| e.to_string())?)
    }
    /// Returns data for rendering horizontal borders as a string containing a
    /// JSON array of [`JsRenderBorder`].
    #[wasm_bindgen(js_name = "getRenderHorizontalBorders")]
    pub fn get_render_horizontal_borders(&self, sheet_id: String) -> Result<String, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output = self.sheet(sheet_id).get_render_horizontal_borders();
        Ok(serde_json::to_string::<[JsRenderBorder]>(&output).map_err(|e| e.to_string())?)
    }
    /// Returns data for rendering vertical borders as a string containing a
    /// JSON array of [`JsRenderBorder`].
    #[wasm_bindgen(js_name = "getRenderVerticalBorders")]
    pub fn get_render_vertical_borders(&self, sheet_id: String) -> Result<String, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output = self.sheet(sheet_id).get_render_vertical_borders();
        Ok(serde_json::to_string::<[JsRenderBorder]>(&output).map_err(|e| e.to_string())?)
    }

    /// Sets a cell value given as a [`CellValue`].
    ///
    /// Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "setCellValue")]
    pub fn js_set_cell_value(
        &mut self,
        sheet_id: String,
        pos: &Pos,
        cell_value: JsValue,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let cell_value: CellValue = serde_wasm_bindgen::from_value(cell_value)?;
        Ok(serde_wasm_bindgen::to_value(
            &self.set_cell_value(sheet_id, *pos, cell_value, cursor),
        )?)
    }

    /// Deletes a region of cells.
    ///
    /// Returns a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "deleteCellValues")]
    pub fn js_delete_cell_values(
        &mut self,
        sheet_id: String,
        region: &Rect,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        Ok(serde_wasm_bindgen::to_value(
            &self.delete_cell_values(sheet_id, *region, cursor),
        )?)
    }

    /// Returns a code cell as a [`CodeCellValue`].
    #[wasm_bindgen(js_name = "getCodeCellValue")]
    pub fn get_code_cell_value(&mut self, sheet_id: String, pos: &Pos) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        match self.sheet(sheet_id).get_code_cell(*pos) {
            Some(code_cell) => Ok(serde_wasm_bindgen::to_value(&code_cell)?),
            None => Ok(JsValue::UNDEFINED),
        }
    }

    // /// Sets a code cell value given as a [`CodeCellValue`].
    // #[wasm_bindgen(js_name = "setCodeCellValue")]
    // pub fn set_code_cell_value(
    //     &mut self,
    //     sheet_id: &SheetId,
    //     pos: &Pos,
    //     code_cell_value: JsValue,
    // ) -> Result<(), JsValue> {
    //     let code_cell_value: CodeCellValue = serde_wasm_bindgen::from_value(code_cell_value)?;
    //     self.sheet_mut_from_id(*sheet_id)
    //         .set_code_cell_value(*pos, Some(code_cell_value));
    //     // TODO: return old code cell
    //     Ok(())
    // }

    /// Returns a summary of the formatting in a region as a
    /// [`FormattingSummary`].
    #[wasm_bindgen(js_name = "getFormattingSummary")]
    pub fn js_formatting_summary(
        &self,
        sheet_id: String,
        region: &Rect,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output: FormattingSummary = self.sheet(sheet_id).get_formatting_summary(*region);
        Ok(serde_wasm_bindgen::to_value(&output)?)
    }

    /// Returns a summary of the formatting in a region as a
    /// [`CellFormatSummary`].
    #[wasm_bindgen(js_name = "getCellFormatSummary")]
    pub fn js_cell_format_summary(&self, sheet_id: String, pos: &Pos) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let output: CellFormatSummary = self.sheet(sheet_id).get_cell_format_summary(*pos);
        Ok(serde_wasm_bindgen::to_value(&output)?)
    }

    #[wasm_bindgen(js_name = "getSheetName")]
    pub fn js_sheet_name(&self, sheet_id: String) -> String {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let sheet = self.grid().sheet_from_id(sheet_id);
        sheet.name.clone()
    }

    #[wasm_bindgen(js_name = "getSheetColor")]
    pub fn js_sheet_color(&self, sheet_id: String) -> String {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let sheet = self.grid().sheet_from_id(sheet_id);
        sheet.color.clone().unwrap_or_default()
    }

    #[wasm_bindgen(js_name = "getSheetOrder")]
    pub fn js_sheet_order(&self, sheet_id: String) -> String {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        let sheet = self.grid().sheet_from_id(sheet_id);
        sheet.order.clone()
    }

    /// Returns a code cell as a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "setSheetName")]
    pub fn js_set_sheet_name(
        &mut self,
        sheet_id: String,
        name: String,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        Ok(serde_wasm_bindgen::to_value(
            &self.set_sheet_name(sheet_id, name, cursor),
        )?)
    }

    /// Returns a code cell as a [`TransactionSummary`].
    #[wasm_bindgen(js_name = "setSheetColor")]
    pub fn js_set_sheet_color(
        &mut self,
        sheet_id: String,
        color: Option<String>,
        cursor: Option<String>,
    ) -> Result<JsValue, JsValue> {
        let sheet_id = SheetId::from_str(&sheet_id).unwrap();
        Ok(serde_wasm_bindgen::to_value(
            &self.set_sheet_color(sheet_id, color, cursor),
        )?)
    }

    // /// Sets the text alignment as a [`CellAlign`] in a region.
    // #[wasm_bindgen(js_name = "setCellAlign")]
    // pub fn set_cell_align(
    //     &mut self,
    //     sheet_id: &SheetId,
    //     region: &Rect,
    //     value: JsValue,
    // ) -> Result<(), JsValue> {
    //     let value: CellAlign = serde_wasm_bindgen::from_value(value)?;
    //     self.set_same_values(*sheet_id, *region, |column| &mut column.align, value);
    //     Ok(())
    // }
    // /// Sets the text wrapping as a [`CellWrap`] in a region.
    // #[wasm_bindgen(js_name = "setCellWrap")]
    // pub fn set_cell_wrap(
    //     &mut self,
    //     sheet_id: &SheetId,
    //     region: &Rect,
    //     value: JsValue,
    // ) -> Result<(), JsValue> {
    //     let value: CellWrap = serde_wasm_bindgen::from_value(value)?;
    //     self.set_same_values(*sheet_id, *region, |column| &mut column.wrap, value);
    //     Ok(())
    // }
    // /// Sets the horizontal borders as a [`CellBorder`] in a region.
    // #[wasm_bindgen(js_name = "setHorizontalCellBorder")]
    // pub fn set_horizontal_cell_border(
    //     &mut self,
    //     sheet_id: &SheetId,
    //     region: &Rect,
    //     value: JsValue,
    // ) -> Result<(), JsValue> {
    //     let value: CellBorder = serde_wasm_bindgen::from_value(value)?;
    //     self.sheet_mut_from_id(*sheet_id)
    //         .set_horizontal_border(*region, value);
    //     Ok(())
    // }
    // /// Sets the vertical borders as a [`CellBorder`] in a region.
    // #[wasm_bindgen(js_name = "setVerticalCellBorder")]
    // pub fn set_vertical_cell_border(
    //     &mut self,
    //     sheet_id: &SheetId,
    //     region: &Rect,
    //     value: JsValue,
    // ) -> Result<(), JsValue> {
    //     let value: CellBorder = serde_wasm_bindgen::from_value(value)?;
    //     self.sheet_mut_from_id(*sheet_id)
    //         .set_vertical_border(*region, value);
    //     Ok(())
    // }
    // /// Sets the numeric format as a [`NumericFormat`] in a region.
    // #[wasm_bindgen(js_name = "setCellNumericFormat")]
    // pub fn set_cell_numeric_format(
    //     &mut self,
    //     sheet_id: &SheetId,
    //     region: &Rect,
    //     value: JsValue,
    // ) -> Result<(), JsValue> {
    //     let value: NumericFormat = serde_wasm_bindgen::from_value(value)?;
    //     self.set_same_values(
    //         *sheet_id,
    //         *region,
    //         |column| &mut column.numeric_format,
    //         value,
    //     );
    //     Ok(())
    // }
    // /// Sets whether cell text is bold in a region.
    // #[wasm_bindgen(js_name = "setCellBold")]
    // pub fn set_cell_bold(&mut self, sheet_id: &SheetId, region: &Rect, value: bool) {
    //     self.set_same_values(*sheet_id, *region, |column| &mut column.bold, value);
    // }
    // /// Sets whether cell text is italic in a region.
    // #[wasm_bindgen(js_name = "setCellItalic")]
    // pub fn set_cell_italic(&mut self, sheet_id: &SheetId, region: &Rect, value: bool) {
    //     self.set_same_values(*sheet_id, *region, |column| &mut column.italic, value);
    // }
    // /// Sets text color in a region.
    // #[wasm_bindgen(js_name = "setCellTextColor")]
    // pub fn set_cell_text_color(&mut self, sheet_id: &SheetId, region: &Rect, value: String) {
    //     self.set_same_values(*sheet_id, *region, |column| &mut column.text_color, value);
    // }
    // /// Sets fill color in a region.
    // #[wasm_bindgen(js_name = "setCellFillColor")]
    // pub fn set_cell_fill_color(&mut self, sheet_id: &SheetId, region: &Rect, value: String) {
    //     self.set_same_values(*sheet_id, *region, |column| &mut column.fill_color, value);
    // }
    // /// Clears all formatting in a region.
    // #[wasm_bindgen(js_name = "clearFormatting")]
    // pub fn clear_formatting(&mut self, sheet_id: &SheetId, region: &Rect) {
    //     self.delete_cell_columns(*sheet_id, *region, |column| &mut column.fill_color);
    //     self.delete_cell_columns(*sheet_id, *region, |column| &mut column.align);
    //     self.delete_cell_columns(*sheet_id, *region, |column| &mut column.bold);
    //     self.delete_cell_columns(*sheet_id, *region, |column| &mut column.italic);
    //     self.delete_cell_columns(*sheet_id, *region, |column| &mut column.numeric_format);
    //     self.delete_cell_columns(*sheet_id, *region, |column| &mut column.text_color);
    //     self.delete_cell_columns(*sheet_id, *region, |column| &mut column.wrap);
    // }
}

macro_rules! impl_grid_controller_js_set_formatting_fns {
    (
        $(
            $(#[doc = $doc_line:literal])*
            #[js_name = $js_name:literal]
            fn $rust_fn_name:ident($value_name:ident: $type:ty) {
                $internal_fn_name:ident()
            }
        )+
    ) => {
        #[wasm_bindgen]
        impl GridController {
            $(
                $(#[doc = $doc_line])*
                /// Returns a [`TransactionSummary`].
                pub fn $rust_fn_name(
                    &mut self,
                    sheet_id: String,
                    rect: &Rect,
                    $value_name: JsValue,
                    cursor: Option<String>,
                ) -> Result<JsValue, JsValue> {
                    let sheet_id = SheetId::from_str(&sheet_id).unwrap();
                    let value: Option<$type> = serde_wasm_bindgen::from_value($value_name)?;
                    Ok(serde_wasm_bindgen::to_value(
                        &self.$internal_fn_name(sheet_id, *rect, value, cursor),
                    )?)
                }
            )+
        }
    };
}

impl_grid_controller_js_set_formatting_fns!(
    /// Sets cell align formatting given as an optional [`CellAlign`].
    #[js_name = "setCellAlign"]
    fn js_set_cell_align(align: CellAlign) {
        set_cell_align()
    }

    /// Sets cell wrap formatting given as an optional [`CellWrap`].
    #[js_name = "setCellWrap"]
    fn js_set_cell_wrap(wrap: CellWrap) {
        set_cell_wrap()
    }

    /// Sets cell numeric formatting given as an optional [`NumericFormat`].
    #[js_name = "setCellNumericFormat"]
    fn js_set_cell_numeric_format(numeric_format: NumericFormat) {
        set_cell_numeric_format()
    }

    /// Sets cell bold formatting given as an optional [`bool`].
    #[js_name = "setCellBold"]
    fn js_set_cell_bold(bold: bool) {
        set_cell_bold()
    }
    /// Sets cell italic formatting given as an optional [`bool`].
    #[js_name = "setCellItalic"]
    fn js_set_cell_italic(italic: bool) {
        set_cell_italic()
    }

    /// Sets cell text color given as an optional [`String`].
    #[js_name = "setCellTextColor"]
    fn js_set_cell_text_color(text_color: String) {
        set_cell_text_color()
    }
    /// Sets cell fill color given as an optional [`String`].
    #[js_name = "setCellFillColor"]
    fn js_set_cell_fill_color(fill_color: String) {
        set_cell_fill_color()
    }
);
