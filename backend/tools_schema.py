TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "execute_query",
            "description": "Execute a raw SELECT SQL query on the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "The SELECT SQL query to execute."}
                },
                "required": ["sql"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_active_tables",
            "description": "List all tables currently active for the agent.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_table_schema",
            "description": "Get the schema (columns, types) of a specific table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"}
                },
                "required": ["table_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_table_sample",
            "description": "Get sample rows from a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "limit": {"type": "integer", "default": 5}
                },
                "required": ["table_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_records",
            "description": "Search records in a table where a column matches a value (uses LIKE).",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"},
                    "value": {"type": "string"}
                },
                "required": ["table_name", "column", "value"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_aggregates",
            "description": "Calculate aggregate values (COUNT, SUM, AVG, MIN, MAX) for a column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"},
                    "agg_func": {"type": "string", "enum": ["COUNT", "SUM", "AVG", "MIN", "MAX"]}
                },
                "required": ["table_name", "column", "agg_func"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_row_count",
            "description": "Get the total number of rows in a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"}
                },
                "required": ["table_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "join_tables",
            "description": "Join two tables and select columns.",
            "parameters": {
                "type": "object",
                "properties": {
                    "base_table": {"type": "string"},
                    "join_table": {"type": "string"},
                    "on_column": {"type": "string"},
                    "select_columns": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["base_table", "join_table", "on_column"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_distinct_values",
            "description": "Get unique values from a column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"}
                },
                "required": ["table_name", "column"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "insert_record",
            "description": "Insert a single record into a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "data_dict": {"type": "object", "description": "Column-value pairs"}
                },
                "required": ["table_name", "data_dict"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "bulk_insert",
            "description": "Insert multiple records into a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "rows_list": {"type": "array", "items": {"type": "object"}}
                },
                "required": ["table_name", "rows_list"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_record",
            "description": "Update a record in a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "data_dict": {"type": "object"},
                    "where_column": {"type": "string"},
                    "where_value": {"type": "string"}
                },
                "required": ["table_name", "data_dict", "where_column", "where_value"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_table",
            "description": "Create a new table in the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "columns_definition": {"type": "array", "items": {"type": "string"}, "description": "List of 'col name TYPE' strings"}
                },
                "required": ["table_name", "columns_definition"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "rank_by_column",
            "description": "Rank rows by a column value.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"},
                    "order": {"type": "string", "enum": ["ASC", "DESC"]},
                    "limit": {"type": "integer"}
                },
                "required": ["table_name", "column"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_aggregates_grouped",
            "description": "Calculate aggregates grouped by a column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "group_col": {"type": "string"},
                    "agg_col": {"type": "string"},
                    "agg_func": {"type": "string", "enum": ["COUNT", "SUM", "AVG", "MIN", "MAX"]}
                },
                "required": ["table_name", "group_col", "agg_col", "agg_func"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "detect_nulls",
            "description": "Detect null values across all columns in a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"}
                },
                "required": ["table_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "detect_duplicates",
            "description": "Detect duplicate values in a specific column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"}
                },
                "required": ["table_name", "column"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_column_stats",
            "description": "Calculate basic statistics (MIN, MAX, AVG) for a column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"}
                },
                "required": ["table_name", "column"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_tables",
            "description": "Compare schemas of two tables.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table1": {"type": "string"},
                    "table2": {"type": "string"}
                },
                "required": ["table1", "table2"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "export_to_csv",
            "description": "Export the results of a SELECT query to a CSV file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string"},
                    "filename": {"type": "string"}
                },
                "required": ["sql", "filename"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "export_to_pdf",
            "description": "Export the results of a SELECT query to a PDF file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string"},
                    "title": {"type": "string"},
                    "filename": {"type": "string"}
                },
                "required": ["sql", "title", "filename"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "export_session_log",
            "description": "Export the current session activity log to a JSON file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {"type": "string"}
                },
                "required": ["filename"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "import_file_to_table",
            "description": "Import data from an uploaded file into a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"},
                    "table_name": {"type": "string"},
                    "mode": {"type": "string", "enum": ["create_new", "append"]}
                },
                "required": ["file_path", "table_name", "mode"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "extract_file_to_context",
            "description": "Extract content from a file to use as context for answering questions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string"}
                },
                "required": ["file_path"]
            }
        }
    }
]
