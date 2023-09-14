use std::str::FromStr;

use bigdecimal::{BigDecimal, FromPrimitive};
use serde::{Deserialize, Serialize};

use crate::{Array, ArraySize, Error, ErrorMsg, Span};

use super::v1_5::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GridFileV1_4 {
    pub sheets: Vec<JsSheet>,
}

#[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct JsCoordinate {
    pub x: i64,
    pub y: i64,
}

#[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct JsMinMax {
    pub min: i64,
    pub max: i64,
}

#[derive(Serialize, Deserialize, Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct JsRectangle {
    pub x: i64,
    pub y: i64,
    pub width: i64,
    pub height: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsCell {
    pub x: i64,
    pub y: i64,
    pub r#type: JsCellType,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub array_cells: Option<Vec<(i64, i64)>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dependent_cells: Option<Vec<(i64, i64)>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evaluation_result: Option<JsCellEvalResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub formula_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_modified: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub python_code: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsCellEvalResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub std_out: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub std_err: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_value: Option<String>,
    pub cells_accessed: Vec<(i64, i64)>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub array_output: Option<JsArrayOutput>,
    pub formatted_code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_span: Option<(u32, u32)>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum JsArrayOutput {
    Block(Vec<Vec<Option<Any>>>),
    Array(Vec<Option<Any>>),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JsTextFormat {
    #[serde(rename = "type")]
    pub kind: NumericFormatKind,
    pub symbol: Option<String>,
    pub decimal_places: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JsCellFormat {
    pub x: i64,
    pub y: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alignment: Option<CellAlign>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bold: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fill_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub italic: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_format: Option<JsTextFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wrapping: Option<CellWrap>, // default is overflow
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsBorders {
    pub x: i64,
    pub y: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub horizontal: Option<CellBorder>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vertical: Option<CellBorder>,
}

#[derive(Serialize, Deserialize, Debug, Copy, Clone)]
pub struct JsHeadingSchema {
    pub id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Copy, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum JsCellType {
    Text,
    Formula,
    Javascript,
    Python,
    Sql,
    Computed,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsSheet {
    pub name: String,
    pub color: Option<String>,
    pub order: String,

    pub borders: Vec<JsBorders>,
    pub cells: Vec<JsCell>,
    pub cell_dependency: String,
    pub columns: Vec<JsHeadingSchema>,

    pub formats: Vec<JsCellFormat>,

    pub rows: Vec<JsHeadingSchema>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum Any {
    Number(f64),
    String(String),
    Boolean(bool),
}
impl Into<CellValue> for Any {
    fn into(self) -> CellValue {
        match self {
            Any::Number(n) => match BigDecimal::from_f64(n) {
                Some(n) => CellValue::Number(n),
                None => CellValue::Text(n.to_string()),
            },
            Any::String(s) => match BigDecimal::from_str(&s) {
                Ok(n) => CellValue::Number(n),
                Err(_) => CellValue::Text(s),
            },
            Any::Boolean(b) => CellValue::Logical(b),
        }
    }
}

impl JsCell {
    pub fn to_cell_value(&self) -> Option<CellValue> {
        match self.r#type {
            JsCellType::Text => Some(CellValue::Text(self.value.clone())),

            // we add computed cells with the original code that produced them
            JsCellType::Computed => None,

            _ => None,
        }
    }
    pub fn to_code_cell_value(
        &self,
        get_cell_ref: impl FnMut(Pos) -> CellRef,
    ) -> Option<CodeCellValue> {
        let language = match self.r#type {
            JsCellType::Text | JsCellType::Computed => return None,
            JsCellType::Formula => CodeCellLanguage::Formula,
            JsCellType::Javascript => CodeCellLanguage::JavaScript,
            JsCellType::Python => CodeCellLanguage::Python,
            JsCellType::Sql => CodeCellLanguage::Sql,
        };

        Some(CodeCellValue {
            language,
            code_string: match language {
                CodeCellLanguage::Python => self.python_code.clone().unwrap_or_default(),
                CodeCellLanguage::Formula => self.formula_code.clone().unwrap_or_default(),
                CodeCellLanguage::JavaScript | CodeCellLanguage::Sql => String::new(),
            },
            formatted_code_string: self
                .evaluation_result
                .as_ref()
                .map(|result| result.formatted_code.clone()),
            last_modified: self.last_modified.clone().unwrap_or_default(),
            output: self.evaluation_result.clone().and_then(|js_result| {
                let result = match js_result.success {
                    true => CodeCellRunResult::Ok {
                        output_value: if let Some(array) = js_result.array_output {
                            let width;
                            let height;
                            let array_contents;

                            match array {
                                JsArrayOutput::Array(values) => {
                                    width = 1;
                                    height = values.len() as u32;
                                    array_contents =
                                        values.iter().map(|v| v.clone().into()).collect();
                                }
                                JsArrayOutput::Block(values) => {
                                    width = values.get(0)?.len() as u32;
                                    height = values.len() as u32;
                                    array_contents =
                                        values.iter().flatten().map(|v| v.clone().into()).collect();
                                }
                            }

                            let array_size = ArraySize::new(width, height)?;
                            Value::Array(Array::new_row_major(array_size, array_contents).ok()?)
                        } else if let Some(s) = js_result.output_value.clone() {
                            Value::Single(CellValue::Text(s))
                        } else {
                            Value::Single(CellValue::Blank)
                        },
                        cells_accessed: js_result
                            .cells_accessed
                            .iter()
                            .map(|&(x, y)| Pos { x, y })
                            .map(get_cell_ref)
                            .collect(),
                    },
                    false => CodeCellRunResult::Err {
                        error: Error {
                            span: js_result.error_span.map(|(start, end)| Span { start, end }),
                            msg: ErrorMsg::UnknownError,
                        },
                    },
                };

                Some(CodeCellRunOutput {
                    std_out: js_result.std_out,
                    std_err: js_result.std_err,
                    result,
                })
            }),
        })
    }
}
