TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "execute_query",
            "description": "Runs any SELECT query on the active tables. Returns rows as JSON.",
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
            "description": "Returns ONLY the tables the user has selected as active. Never query tables outside this list.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_table_schema",
            "description": "Returns columns, types, and constraints for a specific active table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string", "description": "Name of the active table."}
                },
                "required": ["table_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_table_sample",
            "description": "Returns a sample of first N rows from a table.",
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
            "description": "Performs a LIKE search on a specific column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"},
                    "value": {"type": "string", "description": "Search pattern, e.g., '%john%'"}
                },
                "required": ["table_name", "column", "value"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_aggregates",
            "description": "Calculates COUNT, SUM, AVG, MIN, or MAX on any column.",
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
            "description": "Total rows in a table.",
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
            "description": "Safe INNER JOIN between two active tables.",
            "parameters": {
                "type": "object",
                "properties": {
                    "base_table": {"type": "string"},
                    "join_table": {"type": "string"},
                    "on_column": {"type": "string", "description": "Column name present in both tables"},
                    "select_columns": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of columns to select from both tables."
                    }
                },
                "required": ["base_table", "join_table", "on_column", "select_columns"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "filter_records",
            "description": "Builds a dynamic WHERE clause from a dictionary of column:value pairs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "filters_dict": {"type": "object", "description": "Key-value pairs for equality filters"},
                    "order_by": {"type": "string", "description": "Optional column to order by"},
                    "limit": {"type": "integer", "description": "Optional limit"}
                },
                "required": ["table_name", "filters_dict"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_distinct_values",
            "description": "Returns all unique values in a column.",
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
            "description": "Inserts one row into a table.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "data_dict": {"type": "object", "description": "Column-value pairs to insert"}
                },
                "required": ["table_name", "data_dict"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "bulk_insert",
            "description": "Inserts multiple rows in one transaction.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "rows_list": {
                        "type": "array",
                        "items": {"type": "object"},
                        "description": "List of dictionaries representing rows"
                    }
                },
                "required": ["table_name", "rows_list"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_record",
            "description": "Updates matching rows. WHERE clause always enforced.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "data_dict": {"type": "object", "description": "Fields to update"},
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
            "name": "rank_by_column",
            "description": "Top or bottom N rows by a numeric column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "column": {"type": "string"},
                    "order": {"type": "string", "enum": ["ASC", "DESC"]},
                    "limit": {"type": "integer"}
                },
                "required": ["table_name", "column", "order", "limit"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_aggregates_grouped",
            "description": "GROUP BY query. e.g. total sales per region.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string"},
                    "group_column": {"type": "string"},
                    "agg_column": {"type": "string"},
                    "agg_func": {"type": "string", "enum": ["COUNT", "SUM", "AVG", "MIN", "MAX"]}
                },
                "required": ["table_name", "group_column", "agg_column", "agg_func"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "detect_nulls",
            "description": "Scans all columns and reports which ones have NULL values and how many.",
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
            "description": "Finds duplicate values in a column and their count.",
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
            "description": "Returns min, max, avg, stddev for a numeric column.",
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
            "name": "generate_table_report",
            "description": "Full summary: row count, column list, numeric stats.",
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
            "name": "export_to_csv",
            "description": "Runs a SELECT query and writes to CSV. Returns file path.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string"},
                    "filename": {"type": "string", "description": "Name of the output csv file."}
                },
                "required": ["sql", "filename"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_tables",
            "description": "Compares schemas and row counts of two active tables.",
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
            "name": "explain_query",
            "description": "Explains a query execution plan to diagnose slow queries (Uses EXPLAIN or EXPLAIN QUERY PLAN).",
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "The query to explain."}
                },
                "required": ["sql"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_index",
            "description": "Creates an index on a table to improve query performance.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string", "description": "The name of the table."},
                    "column_name": {"type": "string", "description": "The column to index."},
                    "index_name": {"type": "string", "description": "The name of the new index."}
                },
                "required": ["table_name", "column_name", "index_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "drop_table",
            "description": "Drops an active table from the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "table_name": {"type": "string", "description": "The name of the table to drop."}
                },
                "required": ["table_name"]
            }
        }
    }
]
