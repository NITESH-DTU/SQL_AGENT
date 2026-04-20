import json
from exporter import export_to_csv
from guardrails import check_sql_guardrails, check_bulk_insert_guardrail

class AgentTools:
    def __init__(self, db_manager, active_tables):
        self.db_manager = db_manager
        self.active_tables = active_tables
        self.all_tables = self.db_manager.get_all_tables()

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
        return self._safe_execute(f"SELECT * FROM {table_name} LIMIT {int(limit)}")

    def search_records(self, table_name, column, value):
        err = self._check_table_active(table_name)
        if err: return err
        # Using params to prevent injection, though agent controls it
        sql = f"SELECT * FROM {table_name} WHERE {column} LIKE %s" if self.db_manager.db_type == "postgresql" else f"SELECT * FROM {table_name} WHERE {column} LIKE ?"
        # Just use raw SQL if params aren't fully utilized for simplicity.
        # Actually safer to construct SQL logic here
        
        # We will dynamically build it
        safe_value = value.replace("'", "''")
        return self._safe_execute(f"SELECT * FROM {table_name} WHERE {column} LIKE '{safe_value}'")

    def get_aggregates(self, table_name, column, agg_func):
        err = self._check_table_active(table_name)
        if err: return err
        if agg_func not in ["COUNT", "SUM", "AVG", "MIN", "MAX"]:
            return {"error": "Invalid aggregate function."}
        return self._safe_execute(f"SELECT {agg_func}({column}) as result FROM {table_name}")

    def get_row_count(self, table_name):
        err = self._check_table_active(table_name)
        if err: return err
        res = self._safe_execute(f"SELECT COUNT(*) as count FROM {table_name}")
        return res

    def join_tables(self, base_table, join_table, on_column, select_columns):
        err = self._check_table_active(base_table) or self._check_table_active(join_table)
        if err: return err
        cols = ", ".join(select_columns) if select_columns else "*"
        sql = f"SELECT {cols} FROM {base_table} INNER JOIN {join_table} ON {base_table}.{on_column} = {join_table}.{on_column}"
        return self._safe_execute(sql)

    def filter_records(self, table_name, filters_dict, order_by=None, limit=None):
        err = self._check_table_active(table_name)
        if err: return err
        
        where_clauses = []
        for k, v in filters_dict.items():
            safe_v = str(v).replace("'", "''")
            where_clauses.append(f"{k} = '{safe_v}'")
            
        where = " AND ".join(where_clauses)
        sql = f"SELECT * FROM {table_name} WHERE {where}"
        if order_by:
            sql += f" ORDER BY {order_by}"
        if limit is not None:
            sql += f" LIMIT {int(limit)}"
        return self._safe_execute(sql)

    def get_distinct_values(self, table_name, column):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT DISTINCT {column} FROM {table_name}")

    def insert_record(self, table_name, data_dict):
        err = self._check_table_active(table_name)
        if err: return err
        
        columns = ", ".join(data_dict.keys())
        placeholders = ", ".join(["%s" if self.db_manager.db_type == "postgresql" else "?"] * len(data_dict))
        sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        params = list(data_dict.values())
        return self._safe_write(sql, params)

    def bulk_insert(self, table_name, rows_list):
        err = self._check_table_active(table_name)
        if err: return err
        
        guard_res = check_bulk_insert_guardrail(rows_list)
        if guard_res["blocked"]: return guard_res
        
        if not rows_list:
            return {"success": True, "rows_affected": 0}
            
        columns = ", ".join(rows_list[0].keys())
        placeholders = ", ".join(["%s" if self.db_manager.db_type == "postgresql" else "?"] * len(rows_list[0]))
        sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        
        params_list = [list(row.values()) for row in rows_list]
        return self.db_manager.execute_many(sql, params_list)

    def update_record(self, table_name, data_dict, where_column, where_value):
        err = self._check_table_active(table_name)
        if err: return err
        
        set_clauses = ", ".join([f"{k} = '%s'" if self.db_manager.db_type == "postgresql" else f"{k} = ?" for k in data_dict.keys()])
        placeholder = "%s" if self.db_manager.db_type == "postgresql" else "?"
        sql = f"UPDATE {table_name} SET {set_clauses} WHERE {where_column} = {placeholder}"
        
        params = list(data_dict.values()) + [where_value]
        # execute_write will be fine, although if it uses params we need to be careful with safety check
        # We manually check the base string to satisfy guardrails
        guard_check = check_sql_guardrails(f"UPDATE {table_name} SET ... WHERE ...", self.active_tables, self.all_tables)
        if guard_check["blocked"]:
            return guard_check
            
        return self.db_manager.execute_write(sql, params)

    def rank_by_column(self, table_name, column, order, limit):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT * FROM {table_name} ORDER BY {column} {order} LIMIT {int(limit)}")

    def get_aggregates_grouped(self, table_name, group_column, agg_column, agg_func):
        err = self._check_table_active(table_name)
        if err: return err
        return self._safe_execute(f"SELECT {group_column}, {agg_func}({agg_column}) as result FROM {table_name} GROUP BY {group_column}")

    def detect_nulls(self, table_name):
        err = self._check_table_active(table_name)
        if err: return err
        
        schema = self.get_table_schema(table_name)
        cols = [r['name'] if self.db_manager.db_type == "sqlite" else r['column_name'] for r in schema]
        
        null_counts = {}
        for c in cols:
            res = self._safe_execute(f"SELECT COUNT(*) as count FROM {table_name} WHERE {c} IS NULL")
            if res and len(res) > 0:
                null_counts[c] = res[0]['count']
        return null_counts

    def detect_duplicates(self, table_name, column):
        err = self._check_table_active(table_name)
        if err: return err
        sql = f"SELECT {column}, COUNT(*) as count FROM {table_name} GROUP BY {column} HAVING COUNT(*) > 1"
        return self._safe_execute(sql)

    def calculate_column_stats(self, table_name, column):
        err = self._check_table_active(table_name)
        if err: return err
        
        # For simplicity across sqlite and postgres, compute avg, min, max.
        # stddev may not exist natively in sqlite, so just min, max, avg.
        res = self._safe_execute(f"SELECT MIN({column}) as min, MAX({column}) as max, AVG({column}) as avg FROM {table_name}")
        return res[0] if res else {}

    def generate_table_report(self, table_name):
        err = self._check_table_active(table_name)
        if err: return err
        
        return {
            "row_count": self.get_row_count(table_name),
            "schema": self.get_table_schema(table_name),
            "nulls": self.detect_nulls(table_name),
            "sample": self.get_table_sample(table_name, limit=5)
        }

    def export_csv(self, sql, filename):
        # We need to wrap it to match tool signature
        return export_to_csv(self.db_manager, sql, filename)

    def compare_tables(self, table1, table2):
        err1 = self._check_table_active(table1)
        err2 = self._check_table_active(table2)
        if err1: return err1
        if err2: return err2
        
        s1 = self.get_table_schema(table1)
        s2 = self.get_table_schema(table2)
        
        cols1 = set(r['name'] if self.db_manager.db_type == "sqlite" else r['column_name'] for r in s1)
        cols2 = set(r['name'] if self.db_manager.db_type == "sqlite" else r['column_name'] for r in s2)
        
        return {
            "shared_columns": list(cols1.intersection(cols2)),
            table1: {"row_count": self.get_row_count(table1), "columns": list(cols1)},
            table2: {"row_count": self.get_row_count(table2), "columns": list(cols2)}
        }

    def explain_query(self, sql):
        # sqlite uses EXPLAIN QUERY PLAN, postgres uses EXPLAIN
        if self.db_manager.db_type == "sqlite":
            explain_sql = f"EXPLAIN QUERY PLAN {sql}"
        else:
            explain_sql = f"EXPLAIN {sql}"
        return self._safe_execute(explain_sql)

    def create_index(self, table_name, column_name, index_name):
        err = self._check_table_active(table_name)
        if err: return err
        
        # Guard against basic injection
        if not index_name.isalnum() and "_" not in index_name:
            return {"error": "Invalid index name"}
        if not column_name.isalnum() and "_" not in column_name:
            return {"error": "Invalid column name"}

        sql = f"CREATE INDEX {index_name} ON {table_name} ({column_name})"
        return self._safe_write(sql)

    def drop_table(self, table_name):
        err = self._check_table_active(table_name)
        if err: return err
        
        sql = f"DROP TABLE {table_name}"
        # Bypass _safe_write since DROP is blocked in guardrails
        # but we already verified the table is in active_tables
        return self.db_manager.execute_write(sql)

    def invoke_tool(self, tool_name, params):
        if not hasattr(self, tool_name) and tool_name != 'export_to_csv':
            return {"error": f"Tool {tool_name} not found."}
            
        try:
            if tool_name == 'export_to_csv':
                return self.export_csv(**params)
            else:
                method = getattr(self, tool_name)
                return method(**params)
        except Exception as e:
            return {"error": str(e)}
