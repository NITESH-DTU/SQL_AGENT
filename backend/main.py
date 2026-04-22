import os
import json
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

load_dotenv()

app = FastAPI(title="SQL Agent API")

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
        count_res = db_manager.execute_query(f"SELECT COUNT(*) as count FROM {table}")
        total = count_res[0]['count'] if count_res else 0
        
        # Get page data
        rows = db_manager.execute_query(f"SELECT * FROM {table} LIMIT {limit} OFFSET {offset}")
        return {
            "table": table,
            "rows": rows,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
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
    
    agent = SQLAgent(db_manager, req.active_tables)
    
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
    
    import time
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
            columns = list(result[0].keys()) if result and len(result) > 0 else []
            return {
                "type": "read",
                "rows": result,
                "columns": columns,
                "rowCount": len(result),
                "executionTime": f"{elapsed}ms"
            }
        else:
            result = db_manager.execute_write(sql)
            elapsed = round((time.time() - start) * 1000, 2)
            if isinstance(result, dict) and "error" in result:
                return {"error": result["error"], "executionTime": f"{elapsed}ms"}
            return {
                "type": "write",
                "success": True,
                "executionTime": f"{elapsed}ms"
            }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 2)
        return {"error": str(e), "executionTime": f"{elapsed}ms"}

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
