use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use super::block::SameValue;
use super::column::ColumnData;
use super::js_types::JsRenderBorder;
use crate::Rect;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct SheetBorders {
    /// Horizontal borders, stored transposed so that each `ColumnData` actually
    /// holds the data for one row.
    horizontal: BTreeMap<i64, ColumnData<SameValue<CellBorder>>>,
    /// Vertical borders, stored normally so that each `ColumnData` holds data
    /// for one column.
    vertical: BTreeMap<i64, ColumnData<SameValue<CellBorder>>>,
}
impl SheetBorders {
    pub fn new() -> Self {
        SheetBorders {
            horizontal: BTreeMap::new(),
            vertical: BTreeMap::new(),
        }
    }

    pub fn set_horizontal_border(&mut self, region: Rect, value: CellBorder) {
        // The horizontal borders structure is transposed, so this code is
        // intentionally swapping X and Y everywhere.
        for y in region.y_range() {
            self.horizontal
                .entry(y)
                .or_default()
                .set_range(region.x_range(), value.clone());
        }
    }
    pub fn set_vertical_border(&mut self, region: Rect, value: CellBorder) {
        for x in region.x_range() {
            self.vertical
                .entry(x)
                .or_default()
                .set_range(region.y_range(), value.clone());
        }
    }

    pub fn get_render_horizontal_borders(&self) -> Vec<JsRenderBorder> {
        self.horizontal
            .iter()
            .flat_map(|(&y, row)| {
                row.blocks().map(move |block| JsRenderBorder {
                    x: block.start(),
                    y,
                    w: Some(block.len()),
                    h: None,
                    style: block.content().value.clone(),
                })
            })
            .collect()
    }
    pub fn get_render_vertical_borders(&self) -> Vec<JsRenderBorder> {
        self.vertical
            .iter()
            .flat_map(|(&x, column)| {
                column.blocks().map(move |block| JsRenderBorder {
                    x,
                    y: block.start(),
                    w: None,
                    h: Some(block.len()),
                    style: block.content().value.clone(),
                })
            })
            .collect()
    }
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[cfg_attr(feature = "js", derive(ts_rs::TS))]
pub struct CellBorders {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub h: Option<CellBorder>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub v: Option<CellBorder>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "js", derive(ts_rs::TS))]
pub struct CellBorder {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "type")]
    pub style: Option<CellBorderStyle>,
}
#[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "js", derive(ts_rs::TS))]
#[serde(rename_all = "lowercase")]
pub enum CellBorderStyle {
    Line1,
    Line2,
    Line3,
    Dotted,
    Dashed,
    Double,
}
