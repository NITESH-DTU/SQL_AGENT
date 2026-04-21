import re
import datetime
import os

def log_violation(reason, query=""):
    log_file = "guardrail_violations.log"
    with open(log_file, "a", encoding="utf-8") as f:
        timestamp = datetime.datetime.now().isoformat()
        safe_query = query.replace('\n', ' ')
        f.write(f"[{timestamp}] VIOLATION: {reason} | DATA: {safe_query}\n")

def check_sql_guardrails(sql, active_tables, all_tables):
    if len(sql) > 3000:
        msg = "SQL query exceeds 3000 characters limit."
        log_violation("SQL Length Limit", f"Length: {len(sql)}")
        return {"blocked": True, "error": msg}
        
    blocked_keywords = ["DROP", "TRUNCATE", "DELETE", "ALTER", "PRAGMA", "ATTACH", "EXEC", "GRANT", "REVOKE"]
    upper_sql = sql.upper()
    for kw in blocked_keywords:
        if re.search(r'\b' + kw + r'\b', upper_sql):
            msg = f"Operation {kw} is blocked for security reasons."
            log_violation(f"Blocked Keyword: {kw}", sql)
            return {"blocked": True, "error": msg}

    # Block UPDATE without WHERE
    if re.search(r'\bUPDATE\b', upper_sql):
        update_pos = upper_sql.find("UPDATE")
        if "WHERE" not in upper_sql[update_pos:]:
            msg = "UPDATE statements MUST have a WHERE clause."
            log_violation("UPDATE without WHERE", sql)
            return {"blocked": True, "error": msg}

    # Block access to tables not in active list
    inactive_tables = [t for t in all_tables if t not in active_tables]
    for it in inactive_tables:
        # Exact word match for table name
        if re.search(r'\b' + re.escape(it) + r'\b', sql, re.IGNORECASE):
            msg = f"Access to table '{it}' is restricted. It is not in your active tables list."
            log_violation(f"Restricted Table Access: {it}", sql)
            return {"blocked": True, "error": msg}

    return {"blocked": False}

def check_bulk_insert_guardrail(rows_list):
    if len(rows_list) > 500:
        msg = f"Bulk insert is limited to 500 rows per call. Attempted: {len(rows_list)}."
        log_violation("Bulk Insert Limit", f"Rows: {len(rows_list)}")
        return {"blocked": True, "error": msg}
    return {"blocked": False}
