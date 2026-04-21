import json
import os
from guardrails import check_sql_guardrails, check_bulk_insert_guardrail
from exporter import Exporter
from file_importer import FileImporter

class AgentTools:
    def __init__(self, db_manager, active_tables):
        self.db_manager = db_manager
        self.active_tables = active_tables
        self.all_tables = self.db_manager.get_all_tables()
        self.exporter = Exporter(db_manager)
        self.importer = FileImporter(db_manager)

    def _safe_execute(self, sql):
        guard_result = check_sql_guardrails(sql, self.active_tables, self.all_tables)
        if guard_result["blocked"]:
            return guard_result
        return self.db_manager.execute_query(sql)

    def _safe_write(self, sql, params=None):
        guard_result = check_sql_guardrails(sql, self.active_tables, self.all_tables)
        if guard_result["blocked"]:
            return guard_result
        return self.db_manager.execute_write(sql, params)

    def _check_table_active(self, table_name):
        if table_name not in self.active_tables:
            return {"error": f"Table '{table_name}' is not in active tables list."}
        return None

    # --- READ TOOLS (9) ---
    def execute_query(self, sql):
        return self._safe_execute(sql)

    def list_active_tables(self):
        return {"active_tables": self.active_tables}

    def get_table_schema(self, table_name):
        err = self._check_table_active(table_name)
        if err: return err
        if self.db_manager.db_type == "sqlite":
            sql = f"PRAGMA table_info('{table_name}')"
            return self.db_manager.execute_query(sql)
        else:
            sql = f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
            """
            return self._safe_execute(sql)

    def get_table_sample(self, table_name, limit=5):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT * FROM \"{table_name}\" LIMIT {int(limit)}")

    def search_records(self, table_name, column, value):
        err = self._check_table_active(table_name)
        if err: return err
        safe_v = str(value).replace("'", "''")
        return self._safe_execute(f"SELECT * FROM \"{table_name}\" WHERE \"{column}\" LIKE '%{safe_v}%'")

    def get_aggregates(self, table_name, column, agg_func):
        err = self._check_table_active(table_name)
        if err: return err
        if agg_func.upper() not in ["COUNT", "SUM", "AVG", "MIN", "MAX"]:
            return {"error": "Invalid aggregate function."}
        return self._safe_execute(f"SELECT {agg_func}(\"{column}\") as result FROM \"{table_name}\"")

    def get_row_count(self, table_name):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT COUNT(*) as count FROM \"{table_name}\"")

    def join_tables(self, base_table, join_table, on_column, select_columns=None):
        err = self._check_table_active(base_table) or self._check_table_active(join_table)
        if err: return err
        cols = ", ".join(select_columns) if select_columns else "*"
        sql = f"SELECT {cols} FROM \"{base_table}\" INNER JOIN \"{join_table}\" ON \"{base_table}\".\"{on_column}\" = \"{join_table}\".\"{on_column}\""
        return self._safe_execute(sql)

    def get_distinct_values(self, table_name, column):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT DISTINCT \"{column}\" FROM \"{table_name}\"")

    # --- WRITE TOOLS (4) ---
    def insert_record(self, table_name, data_dict):
        err = self._check_table_active(table_name)
        if err: return err
        columns = ", ".join([f'"{k}"' for k in data_dict.keys()])
        placeholders = ", ".join(["%s" if self.db_manager.db_type == "postgresql" else "?"] * len(data_dict))
        sql = f"INSERT INTO \"{table_name}\" ({columns}) VALUES ({placeholders})"
        return self._safe_write(sql, list(data_dict.values()))

    def bulk_insert(self, table_name, rows_list):
        err = self._check_table_active(table_name)
        if err: return err
        guard = check_bulk_insert_guardrail(rows_list)
        if guard["blocked"]: return guard
        if not rows_list: return {"success": True, "count": 0}
        cols = ", ".join([f'"{k}"' for k in rows_list[0].keys()])
        ph = ", ".join(["%s" if self.db_manager.db_type == "postgresql" else "?" ] * len(rows_list[0]))
        sql = f"INSERT INTO \"{table_name}\" ({cols}) VALUES ({ph})"
        params = [list(r.values()) for r in rows_list]
        return self.db_manager.execute_many(sql, params)

    def update_record(self, table_name, data_dict, where_column, where_value):
        err = self._check_table_active(table_name)
        if err: return err
        ph = "%s" if self.db_manager.db_type == "postgresql" else "?"
        sets = ", ".join([f'"{k}" = {ph}' for k in data_dict.keys()])
        sql = f"UPDATE \"{table_name}\" SET {sets} WHERE \"{where_column}\" = {ph}"
        params = list(data_dict.values()) + [where_value]
        return self._safe_write(sql, params)

    def create_table(self, table_name, columns_definition):
        # columns_definition: list of "col_name TYPE CONSTRAINTS" strings
        cols_str = ", ".join(columns_definition)
        sql = f"CREATE TABLE \"{table_name}\" ({cols_str})"
        return self._safe_write(sql)

    # --- ANALYSIS TOOLS (6) ---
    def rank_by_column(self, table_name, column, order="DESC", limit=10):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT * FROM \"{table_name}\" ORDER BY \"{column}\" {order} LIMIT {int(limit)}")

    def get_aggregates_grouped(self, table_name, group_col, agg_col, agg_func):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT \"{group_col}\", {agg_func}(\"{agg_col}\") as result FROM \"{table_name}\" GROUP BY \"{group_col}\"")

    def detect_nulls(self, table_name):
        err = self._check_table_active(table_name)
        if err: return err
        schema = self.get_table_schema(table_name)
        cols = [r['name'] if self.db_manager.db_type == "sqlite" else r['column_name'] for r in schema]
        results = {}
        for c in cols:
            res = self._safe_execute(f"SELECT COUNT(*) as count FROM \"{table_name}\" WHERE \"{c}\" IS NULL")
            results[c] = res[0]['count'] if res else 0
        return results

    def detect_duplicates(self, table_name, column):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT \"{column}\", COUNT(*) as count FROM \"{table_name}\" GROUP BY \"{column}\" HAVING COUNT(*) > 1")

    def calculate_column_stats(self, table_name, column):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT MIN(\"{column}\") as min, MAX(\"{column}\") as max, AVG(\"{column}\") as avg FROM \"{table_name}\"")

    def compare_tables(self, table1, table2):
        err = self._check_table_active(table1) or self._check_table_active(table2)
        if err: return err
        s1 = self.get_table_schema(table1)
        s2 = self.get_table_schema(table2)
        return {"table1_schema": s1, "table2_schema": s2}

    # --- EXPORT TOOLS (3) ---
    def export_to_csv(self, sql, filename):
        try:
            path = self.exporter.to_csv(sql, filename)
            return {"status": "success", "file_path": path}
        except Exception as e:
            return {"error": str(e)}

    def export_to_pdf(self, sql, title, filename):
        try:
            path = self.exporter.to_pdf(sql, title, filename)
            return {"status": "success", "file_path": path}
        except Exception as e:
            return {"error": str(e)}

    def export_session_log(self, filename):
        if not filename.endswith(".json"): filename += ".json"
        path = os.path.join("exports", filename)
        if os.path.exists("agent_sessions.log"):
            with open("agent_sessions.log", "r") as f:
                logs = f.read()
            with open(path, "w") as f:
                json.dump({"logs": logs}, f)
            return {"status": "success", "file_path": path}
        return {"error": "No logs found"}

    # --- FILE IMPORT TOOLS (2) ---
    def import_file_to_table(self, file_path, table_name, mode="create_new"):
        return self.importer.import_to_table(file_path, table_name, mode)

    def extract_file_to_context(self, file_path):
        preview = self.importer.get_preview(file_path)
        return {"content": preview}

    def invoke_tool(self, tool_name, params):
        if not hasattr(self, tool_name):
            return {"error": f"Tool {tool_name} not found."}
        try:
            method = getattr(self, tool_name)
            return method(**params)
        except Exception as e:
            return {"error": str(e)}
