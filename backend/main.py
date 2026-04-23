import os
import json
import time
import uuid
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse

from db_manager import DBManager
from agent import SQLAgent
from file_importer import FileImporter
from exporter import Exporter
from seeder import AISeeder
from meta_db import MetaDB

load_dotenv()

app = FastAPI(title="SQL Agent API")

# Initialize Meta DB
meta_db = MetaDB()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global DB Manager instance
db_manager = DBManager()
active_tables = []

class ConnectionRequest(BaseModel):
    db_type: str  # "sqlite" or "postgresql"
    filepath: Optional[str] = None
    host: Optional[str] = None
    port: Optional[str] = None
    dbname: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None

class CreateTableRequest(BaseModel):
    table_name: str
    columns: List[Dict[str, Any]]
    seed_ai: bool = False
    seed_rows: int = 10

class ChatRequest(BaseModel):
    message: str
    active_tables: List[str]

class ImportRequest(BaseModel):
    file_path: str
    table_name: str
    mode: str  # "create_new" or "append"
    column_mapping: Optional[Dict[str, str]] = None

class WidgetCreateRequest(BaseModel):
    id: str
    title: str
    widget_type: str
    sql_query: str
    db_path: Optional[str] = None
    db_type: Optional[str] = None
    pg_config: Optional[Dict[str, Any]] = None
    chart_type: Optional[str] = None
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    color_scheme: Optional[str] = 'violet'
    width: Optional[str] = 'half'
    auto_refresh: Optional[int] = 0

class WidgetUpdateRequest(BaseModel):
    title: Optional[str] = None
    sql_query: Optional[str] = None
    chart_type: Optional[str] = None
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    color_scheme: Optional[str] = None
    width: Optional[str] = None
    auto_refresh: Optional[int] = None
    position: Optional[int] = None

class ReorderRequest(BaseModel):
    ids: List[str]

class BookmarkRequest(BaseModel):
    id: int

@app.post("/api/connect")
async def connect_db(req: ConnectionRequest):
    global active_tables
    try:
        if req.db_type == "sqlite":
            if not req.filepath:
                raise HTTPException(status_code=400, detail="Filepath required for SQLite")
            db_manager.connect_sqlite(req.filepath)
        elif req.db_type == "postgresql":
            db_manager.connect_postgresql(req.host, req.port, req.dbname, req.user, req.password)
        else:
            raise HTTPException(status_code=400, detail="Invalid DB type")
        
        active_tables = db_manager.get_all_tables()
        return {"status": "connected", "db_name": db_manager.db_name, "db_type": db_manager.db_type, "tables": active_tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-db")
async def create_db(req: ConnectionRequest):
    try:
        if req.db_type == "sqlite":
            # SQLite file is created on connection
            db_manager.connect_sqlite(req.filepath)
        elif req.db_type == "postgresql":
            # Implementation for creating PG database would go here (connecting to 'postgres' first)
            pass
        return {"status": "created", "db_name": db_manager.db_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tables")
async def get_tables():
    if not db_manager.conn:
        return {"tables": []}
    return {"tables": db_manager.get_all_tables()}

@app.get("/api/schema/{table}")
async def get_schema(table: str):
    try:
        # This logic should ideally be in db_manager
        if db_manager.db_type == "sqlite":
            res = db_manager.execute_query(f"PRAGMA table_info('{table}')")
        else:
            res = db_manager.execute_query(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table}'")
        return {"table": table, "schema": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/{table}")
async def get_table_data(table: str, page: int = 1, limit: int = 15):
    try:
        offset = (page - 1) * limit
        # Get total count
        count_res = db_manager.execute_query(f'SELECT COUNT(*) as count FROM "{table}"')
        if isinstance(count_res, dict) and "error" in count_res:
            raise HTTPException(status_code=500, detail=count_res["error"])
        total = count_res[0]['count'] if count_res else 0
        
        # Get page data
        rows = db_manager.execute_query(f'SELECT * FROM "{table}" LIMIT {limit} OFFSET {offset}')
        if isinstance(rows, dict) and "error" in rows:
            raise HTTPException(status_code=500, detail=rows["error"])
        return {
            "table": table,
            "rows": rows,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sample/{table}")
async def get_sample(table: str, limit: int = 5):
    try:
        res = db_manager.execute_query(f"SELECT * FROM {table} LIMIT {limit}")
        return {"table": table, "rows": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not db_manager.conn:
        raise HTTPException(status_code=400, detail="Database not connected")
    
    agent = SQLAgent(db_manager, req.active_tables, meta_db)
    
    async def event_generator():
        for event in agent.run_query_stream(req.message):
            yield {
                "event": "message",
                "data": json.dumps(event)
            }
            
    return EventSourceResponse(event_generator())

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    file_path = f"uploads/{file_id}{extension}"
    
    os.makedirs("uploads", exist_ok=True)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Get preview
    importer = FileImporter()
    preview = importer.get_preview(file_path)
    
    return {"file_path": file_path, "filename": file.filename, "preview": preview}

@app.post("/api/import")
async def import_data(req: ImportRequest):
    try:
        importer = FileImporter(db_manager)
        res = importer.import_to_table(req.file_path, req.table_name, req.mode)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/{format}")
async def export_data(format: str, sql: str, filename: str):
    exporter = Exporter(db_manager)
    if format == "csv":
        file_path = exporter.to_csv(sql, filename)
    elif format == "pdf":
        file_path = exporter.to_pdf(sql, "Export Result", filename)
    else:
        raise HTTPException(status_code=400, detail="Invalid format")
    
    return FileResponse(file_path, filename=filename)

class ExecuteSQLRequest(BaseModel):
    sql: str

@app.post("/api/execute-sql")
async def execute_sql(req: ExecuteSQLRequest):
    if not db_manager.conn:
        raise HTTPException(status_code=400, detail="Database not connected")
    
    sql = req.sql.strip()
    if not sql:
        raise HTTPException(status_code=400, detail="SQL query is empty")
    
    start = time.time()
    
    # Detect query type
    first_word = sql.split()[0].upper() if sql.split() else ""
    read_keywords = {"SELECT", "SHOW", "DESCRIBE", "EXPLAIN", "PRAGMA", "WITH"}
    is_read = first_word in read_keywords
    
    try:
        if is_read:
            result = db_manager.execute_query(sql)
            elapsed = round((time.time() - start) * 1000, 2)
            if isinstance(result, dict) and "error" in result:
                return {"error": result["error"], "executionTime": f"{elapsed}ms"}
            
            # Log to history
            meta_db.log_query(
                sql=sql,
                source='manual',
                result_count=len(result) if isinstance(result, list) else 0,
                execution_time=f"{elapsed}ms",
                db_name=db_manager.db_name
            )

            if isinstance(result, list):
                columns = list(result[0].keys()) if result else []
            else:
                columns = []
            return {
                "type": "read",
                "rows": result if isinstance(result, list) else [],
                "columns": columns,
                "rowCount": len(result) if isinstance(result, list) else 0,
                "executionTime": f"{elapsed}ms"
            }
        else:
            result = db_manager.execute_write(sql)
            elapsed = round((time.time() - start) * 1000, 2)
            if isinstance(result, dict) and "error" in result:
                return {"error": result["error"], "executionTime": f"{elapsed}ms"}
            
            # Log to history
            meta_db.log_query(
                sql=sql,
                source='manual',
                result_count=0,
                execution_time=f"{elapsed}ms",
                db_name=db_manager.db_name
            )

            return {
                "type": "write",
                "success": True,
                "executionTime": f"{elapsed}ms"
            }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 2)
        return {"error": str(e), "executionTime": f"{elapsed}ms"}

# --- History Endpoints ---

@app.get("/api/query-history")
async def get_query_history(page: int = 1, limit: int = 50, bookmarked: bool = False):
    offset = (page - 1) * limit
    history = meta_db.get_history(limit=limit, offset=offset, bookmarked_only=bookmarked)
    return {"history": history}

@app.patch("/api/query-history/{id}/bookmark")
async def toggle_bookmark(id: int):
    meta_db.toggle_bookmark(id)
    return {"status": "success"}

@app.delete("/api/query-history/{id}")
async def delete_history_item(id: int):
    meta_db.delete_history_item(id)
    return {"status": "success"}

@app.delete("/api/query-history")
async def clear_history():
    meta_db.clear_history()
    return {"status": "success"}

@app.get("/api/dashboard/widgets")
async def get_widgets():
    widgets = meta_db.get_widgets()
    return {"widgets": widgets}

@app.post("/api/dashboard/widgets")
async def add_widget(req: WidgetCreateRequest):
    meta_db.add_widget(req.dict())
    return {"status": "success"}

@app.patch("/api/dashboard/widgets/{widget_id}")
async def update_widget(widget_id: str, req: WidgetUpdateRequest):
    meta_db.update_widget(widget_id, req.dict(exclude_unset=True))
    return {"status": "success"}

@app.delete("/api/dashboard/widgets/{widget_id}")
async def delete_widget(widget_id: str):
    meta_db.delete_widget(widget_id)
    return {"status": "success"}

@app.post("/api/dashboard/reorder")
async def reorder_widgets(req: ReorderRequest):
    meta_db.reorder_widgets(req.ids)
    return {"status": "success"}

@app.post("/api/dashboard/widgets/{widget_id}/refresh")
async def refresh_widget(widget_id: str):
    widget = meta_db.get_widget(widget_id)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    # Setup temporary DB connection if not same as active
    target_db = db_manager
    # In a real multi-user/multi-db app, we'd handle connection pooling/switching here
    # For now, we assume the user is connected to the right DB or we use active one
    
    start = time.time()
    try:
        result = db_manager.execute_query(widget['sql_query'])
        elapsed = round((time.time() - start) * 1000, 2)
        
        if isinstance(result, dict) and "error" in result:
            return {"error": result["error"], "executionTime": f"{elapsed}ms"}
        
        response = {
            "rows": result if isinstance(result, list) else [],
            "executionTime": f"{elapsed}ms"
        }

        # Handle Metric Trend
        if widget['widget_type'] == 'metric' and result and isinstance(result, list):
            # Extract first numeric value
            first_row = result[0]
            val = None
            for v in first_row.values():
                if isinstance(v, (int, float)):
                    val = v
                    break
            
            if val is not None:
                meta_db.store_metric_value(widget_id, val)
                response['trend'] = meta_db.get_metric_trend(widget_id)
                response['value'] = val
        
        # Update last_refreshed timestamp
        meta_db.update_widget(widget_id, {"last_refreshed": datetime.now().isoformat()})
        
        return response
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/activity-log")
async def get_activity_log():
    log_path = "agent_sessions.log"
    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            lines = f.readlines()
            return {"logs": lines[-100:]}
    return {"logs": []}

@app.post("/api/create-table")
async def create_table(req: CreateTableRequest):
    try:
        # Build SQL for CREATE TABLE
        col_defs = []
        for col in req.columns:
            line = f"{col['name']} {col['type']}"
            if col.get('primary_key'): line += " PRIMARY KEY"
            if col.get('not_null'): line += " NOT NULL"
            if col.get('unique'): line += " UNIQUE"
            if col.get('auto_increment'):
                if db_manager.db_type == "sqlite":
                    line += " AUTOINCREMENT"
                else:
                    line = line.replace("INTEGER", "SERIAL")
            col_defs.append(line)
        
        sql = f"CREATE TABLE {req.table_name} ({', '.join(col_defs)})"
        db_manager.execute_write(sql)
        
        if req.seed_ai:
            seeder = AISeeder(db_manager)
            seeder.seed_table(req.table_name, req.columns, req.seed_rows)
            
        return {"status": "created", "table": req.table_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
