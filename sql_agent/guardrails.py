import re
import datetime
import os

def log_violation(reason, query=""):
    with open("agent_violations.log", "a", encoding="utf-8") as f:
        timestamp = datetime.datetime.now().isoformat()
        safe_query = query.replace('\n', ' ')
        f.write(f"[{timestamp}] VIOLATION: {reason} | DATA: {safe_query}\n")

def check_sql_guardrails(sql, active_tables, all_tables):
    if len(sql) > 3000:
        msg = "SQL exceeds 3000 characters limit."
        log_violation("SQL length exceeded 3000 chars", "Length: " + str(len(sql)))
        return {"blocked": True, "error": msg}
        
    blocked_keywords = ["DROP", "TRUNCATE", "DELETE", "ALTER", "PRAGMA", "ATTACH", "EXEC", "GRANT", "REVOKE"]
    upper_sql = sql.upper()
    for kw in blocked_keywords:
        if re.search(r'\b' + kw + r'\b', upper_sql):
            msg = f"Keyword {kw} is blocked by guardrails."
            log_violation(f"Blocked keyword: {kw}", sql)
            return {"blocked": True, "error": msg}

    # Block UPDATE without WHERE
    # Basic check (could be fooled if 'WHERE' is in quotes, but sufficient for guardrail)
    if re.search(r'\bUPDATE\b', upper_sql):
        # We need to make sure there's a WHERE after it
        if "WHERE" not in upper_sql[upper_sql.find("UPDATE"):]:
            msg = "UPDATE statements must have a WHERE clause."
            log_violation("UPDATE without WHERE clause", sql)
            return {"blocked": True, "error": msg}

    # Block queries touching tables not in active_tables
    # Check if any inactive table is mentioned in the query
    inactive_tables = [t for t in all_tables if t not in active_tables]
    for it in inactive_tables:
        # Match table name as an exact word
        if re.search(r'\b' + re.escape(it) + r'\b', sql, re.IGNORECASE):
            msg = f"Table '{it}' is not in the active tables list. Allowed tables: {', '.join(active_tables)}"
            log_violation(f"Access to inactive table: {it}", sql)
            return {"blocked": True, "error": msg}

    return {"blocked": False}

def check_bulk_insert_guardrail(rows_list):
    if len(rows_list) > 500:
        msg = f"bulk_insert is limited to 500 rows at a time, you tried to insert {len(rows_list)}."
        log_violation("Bulk insert limit exceeded", f"Rows: {len(rows_list)}")
        return {"blocked": True, "error": msg}
    return {"blocked": False}
