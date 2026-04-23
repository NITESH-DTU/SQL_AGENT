import sqlite3
import json
from datetime import datetime
import os

DB_PATH = "_sqlagent_meta.db"

class MetaDB:
    def __init__(self):
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Query History Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sql_text TEXT NOT NULL,
                source TEXT DEFAULT 'manual',
                result_count INTEGER DEFAULT 0,
                execution_time TEXT,
                bookmarked INTEGER DEFAULT 0,
                db_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # New Detailed Dashboard Widgets Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dashboard_widgets (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                widget_type TEXT NOT NULL, -- 'chart' | 'metric' | 'table' | 'schedule_result'
                sql_query TEXT NOT NULL,
                db_path TEXT,
                db_type TEXT, -- 'sqlite' | 'postgresql'
                pg_config TEXT, -- JSON string
                chart_type TEXT, -- 'bar' | 'line' | 'pie' | 'scatter'
                x_column TEXT,
                y_column TEXT,
                color_scheme TEXT DEFAULT 'violet',
                position INTEGER,
                width TEXT DEFAULT 'half', -- 'half' | 'full'
                schedule_id TEXT,
                last_refreshed TIMESTAMP,
                auto_refresh INTEGER DEFAULT 0, -- 0=off, 30=30s, etc.
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Metric Trends Table (to store previous values for trend arrows)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metric_trends (
                widget_id TEXT,
                value REAL,
                captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()

    # --- History Methods ---
    def log_query(self, sql, source, result_count, execution_time, db_name):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO query_history (sql_text, source, result_count, execution_time, db_name) VALUES (?, ?, ?, ?, ?)",
            (sql, source, result_count, execution_time, db_name)
        )
        conn.commit()
        conn.close()

    def get_history(self, limit=50, offset=0, bookmarked_only=False):
        conn = self._get_conn()
        cursor = conn.cursor()
        query = "SELECT * FROM query_history"
        params = []
        if bookmarked_only:
            query += " WHERE bookmarked = 1"
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows

    def toggle_bookmark(self, history_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE query_history SET bookmarked = 1 - bookmarked WHERE id = ?", (history_id,))
        conn.commit()
        conn.close()

    def delete_history_item(self, history_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM query_history WHERE id = ?", (history_id,))
        conn.commit()
        conn.close()

    def clear_history(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM query_history")
        conn.commit()
        conn.close()

    # --- Dashboard Methods ---
    def add_widget(self, widget_data):
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Get next position
        cursor.execute("SELECT MAX(position) FROM dashboard_widgets")
        max_pos = cursor.fetchone()[0] or 0
        
        fields = [
            'id', 'title', 'widget_type', 'sql_query', 'db_path', 'db_type',
            'pg_config', 'chart_type', 'x_column', 'y_column', 'color_scheme',
            'position', 'width', 'schedule_id', 'auto_refresh', 'created_by'
        ]
        
        placeholders = ', '.join(['?' for _ in fields])
        sql = f"INSERT INTO dashboard_widgets ({', '.join(fields)}) VALUES ({placeholders})"
        
        values = [
            widget_data.get('id'),
            widget_data.get('title'),
            widget_data.get('widget_type'),
            widget_data.get('sql_query'),
            widget_data.get('db_path'),
            widget_data.get('db_type'),
            json.dumps(widget_data.get('pg_config')) if widget_data.get('pg_config') else None,
            widget_data.get('chart_type'),
            widget_data.get('x_column'),
            widget_data.get('y_column'),
            widget_data.get('color_scheme', 'violet'),
            widget_data.get('position', max_pos + 1),
            widget_data.get('width', 'half'),
            widget_data.get('schedule_id'),
            widget_data.get('auto_refresh', 0),
            widget_data.get('created_by', 'system')
        ]
        
        cursor.execute(sql, values)
        conn.commit()
        conn.close()

    def update_widget(self, widget_id, updates):
        conn = self._get_conn()
        cursor = conn.cursor()
        
        sets = []
        values = []
        for k, v in updates.items():
            if k == 'pg_config' and v:
                sets.append(f"{k} = ?")
                values.append(json.dumps(v))
            else:
                sets.append(f"{k} = ?")
                values.append(v)
        
        values.append(widget_id)
        sql = f"UPDATE dashboard_widgets SET {', '.join(sets)} WHERE id = ?"
        cursor.execute(sql, values)
        conn.commit()
        conn.close()

    def get_widgets(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM dashboard_widgets ORDER BY position ASC")
        rows = [dict(row) for row in cursor.fetchall()]
        for row in rows:
            if row['pg_config']:
                row['pg_config'] = json.loads(row['pg_config'])
        conn.close()
        return rows

    def delete_widget(self, widget_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dashboard_widgets WHERE id = ?", (widget_id,))
        cursor.execute("DELETE FROM metric_trends WHERE widget_id = ?", (widget_id,))
        conn.commit()
        conn.close()

    def get_widget(self, widget_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM dashboard_widgets WHERE id = ?", (widget_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            res = dict(row)
            if res['pg_config']:
                res['pg_config'] = json.loads(res['pg_config'])
            return res
        return None

    def store_metric_value(self, widget_id, value):
        conn = self._get_conn()
        cursor = conn.cursor()
        # Keep only last 5 values for trend
        cursor.execute("INSERT INTO metric_trends (widget_id, value) VALUES (?, ?)", (widget_id, value))
        cursor.execute("""
            DELETE FROM metric_trends 
            WHERE rowid NOT IN (
                SELECT rowid FROM metric_trends 
                WHERE widget_id = ? 
                ORDER BY captured_at DESC LIMIT 5
            ) AND widget_id = ?
        """, (widget_id, widget_id))
        conn.commit()
        conn.close()

    def get_metric_trend(self, widget_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM metric_trends WHERE widget_id = ? ORDER BY captured_at DESC LIMIT 2", (widget_id,))
        rows = cursor.fetchall()
        conn.close()
        if len(rows) >= 2:
            current = rows[0][0]
            previous = rows[1][0]
            if current > previous: return "up"
            if current < previous: return "down"
        return "neutral"

    def reorder_widgets(self, order_list):
        # order_list: list of ids in order
        conn = self._get_conn()
        cursor = conn.cursor()
        for idx, widget_id in enumerate(order_list):
            cursor.execute("UPDATE dashboard_widgets SET position = ? WHERE id = ?", (idx, widget_id))
        conn.commit()
        conn.close()
