import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import threading

class DBManager:
    def __init__(self):
        self.conn = None
        self.db_type = None
        self.db_name = None

    def connect_sqlite(self, filepath):
        self.conn = sqlite3.connect(filepath, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.db_type = "sqlite"
        self.db_name = filepath

    def connect_postgresql(self, host, port, dbname, user, password):
        self.conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password,
            cursor_factory=RealDictCursor
        )
        self.conn.autocommit = True
        self.db_type = "postgresql"
        self.db_name = dbname

    def execute_query(self, sql, params=None, timeout=15):
        """Executes a SELECT query and returns rows as dictionaries."""
        if params is None:
            params = []
        timer = None
        try:
            cursor = self.conn.cursor()
            
            if self.db_type == "postgresql":
                cursor.execute(f"SET statement_timeout = {timeout * 1000};")
                
            if self.db_type == "sqlite":
                timer = threading.Timer(timeout, self.conn.interrupt)
                timer.start()

            cursor.execute(sql, params)
            
            if timer:
                timer.cancel()

            if self.db_type == "sqlite":
                rows = cursor.fetchall()
                result = [dict(row) for row in rows]
            else:
                result = cursor.fetchall()
            cursor.close()
            return result
        except Exception as e:
            if timer:
                timer.cancel()
            return {"error": f"Query execution failed or timed out: {str(e)}"}

    def execute_write(self, sql, params=None, timeout=15):
        """Executes an INSERT, UPDATE query."""
        if params is None:
            params = []
        timer = None
        try:
            cursor = self.conn.cursor()
            
            if self.db_type == "postgresql":
                cursor.execute(f"SET statement_timeout = {timeout * 1000};")
                
            if self.db_type == "sqlite":
                timer = threading.Timer(timeout, self.conn.interrupt)
                timer.start()

            cursor.execute(sql, params)
            
            if timer:
                timer.cancel()

            if self.db_type == "sqlite":
                self.conn.commit()
            cursor.close()
            return {"success": True}
        except Exception as e:
            if timer:
                timer.cancel()
            if self.db_type == "sqlite":
                self.conn.rollback()
            return {"error": f"Write execution failed or timed out: {str(e)}"}

    def execute_many(self, sql, params_list, timeout=30):
        """Executes multiple operations in a transaction."""
        timer = None
        try:
            cursor = self.conn.cursor()
            
            if self.db_type == "postgresql":
                cursor.execute(f"SET statement_timeout = {timeout * 1000};")
                
            if self.db_type == "sqlite":
                timer = threading.Timer(timeout, self.conn.interrupt)
                timer.start()

            # In sqlite, executemany automatically handles the loop
            if self.db_type == "sqlite":
                cursor.executemany(sql, params_list)
                self.conn.commit()
            else:
                # In psycopg2, execute_batch or execute_values usually preferred, but executemany works for simple cases
                cursor.executemany(sql, params_list)
                
            if timer:
                timer.cancel()

            cursor.close()
            return {"success": True, "rows_affected": len(params_list)}
        except Exception as e:
            if timer:
                timer.cancel()
            if self.db_type == "sqlite":
                self.conn.rollback()
            return {"error": f"Bulk execution failed or timed out: {str(e)}"}

    def get_all_tables(self):
        """Gets all tables in the current database."""
        if self.db_type == "sqlite":
            sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
            result = self.execute_query(sql, timeout=5)
            if isinstance(result, list):
                return [row['name'] for row in result]
            return []
        elif self.db_type == "postgresql":
            sql = """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public';
            """
            result = self.execute_query(sql, timeout=5)
            if isinstance(result, list):
                return [row['table_name'] for row in result]
            return []

    def close(self):
        if self.conn:
            self.conn.close()
