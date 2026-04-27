import datetime
import os
import sqlglot
from sqlglot import exp

def log_violation(reason, query=""):
    log_file = "guardrail_violations.log"
    with open(log_file, "a", encoding="utf-8") as f:
        timestamp = datetime.datetime.now().isoformat()
        safe_query = query.replace('\n', ' ')
        f.write(f"[{timestamp}] VIOLATION: {reason} | DATA: {safe_query}\n")

def check_sql_guardrails(sql, active_tables, all_tables):
    if len(sql) > 5000:
        msg = "SQL query exceeds 5000 characters limit."
        log_violation("SQL Length Limit", f"Length: {len(sql)}")
        return {"blocked": True, "error": msg}
        
    try:
        # Parse the SQL into an AST
        expressions = sqlglot.parse(sql)
        
        for expression in expressions:
            # 1. Block destructive operations
            forbidden_nodes = [exp.Drop, exp.TruncateTable, exp.Delete, exp.Alter]
            for node_type in forbidden_nodes:
                if any(isinstance(node, node_type) for node in expression.find_all(node_type)):
                    msg = f"Operation {node_type.__name__} is blocked for security reasons."
                    log_violation(f"Blocked Keyword (AST): {node_type.__name__}", sql)
                    return {"blocked": True, "error": msg}

            # 2. Block UPDATE without WHERE
            for update in expression.find_all(exp.Update):
                if not update.args.get("where"):
                    msg = "UPDATE statements MUST have a WHERE clause."
                    log_violation("UPDATE without WHERE (AST)", sql)
                    return {"blocked": True, "error": msg}

            # 3. Block access to tables not in active list
            # Find all Table nodes in the AST
            for table in expression.find_all(exp.Table):
                table_name = table.name.lower()
                # Normalize names for comparison
                active_lower = [t.lower() for t in active_tables]
                all_lower = [t.lower() for t in all_tables]
                
                if table_name in all_lower and table_name not in active_lower:
                    msg = f"Access to table '{table.name}' is restricted. It is not in your active tables list."
                    log_violation(f"Restricted Table Access (AST): {table.name}", sql)
                    return {"blocked": True, "error": msg}

    except Exception as e:
        # If sqlglot fails to parse, it might be an invalid query or a dialect it doesn't know
        # For security, we block it if it's suspicious, but here we just pass it to the DB 
        # which will throw its own syntax error if it's actually bad.
        # Alternatively, we could block it to be safe.
        pass

    return {"blocked": False}

def check_bulk_insert_guardrail(rows_list):
    if len(rows_list) > 1000:
        msg = f"Bulk insert is limited to 1000 rows per call. Attempted: {len(rows_list)}."
        log_violation("Bulk Insert Limit", f"Rows: {len(rows_list)}")
        return {"blocked": True, "error": msg}
    return {"blocked": False}
