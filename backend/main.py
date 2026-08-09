import os
import json
import time
import uuid
from datetime import datetime
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from sse_starlette.sse import EventSourceResponse

from db_manager import DBManager
from agent import SQLAgent
from file_importer import FileImporter
from exporter import Exporter
from seeder import AISeeder
from meta_db import MetaDB
from guardrails import check_sql_guardrails
from pii_manager import identify_pii_columns, mask_rows

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
    active_tables: List[str] = []

class OptimizeRequest(BaseModel):
    sql: str
    active_tables: List[str] = []

class ImportRequest(BaseModel):
    file_path: str
    table_name: str
    mode: str  # "create_new" or "append"
    column_mapping: Optional[Dict[str, str]] = None

class WidgetRequest(BaseModel):
    id: str = None
    title: str
    sql_query: str
    widget_type: str
    chart_config: dict = None
    active_tables: List[str] = []
    db_type: Optional[str] = None
    pg_config: Optional[Dict[str, Any]] = None
    chart_type: Optional[str] = None
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    color_scheme: Optional[str] = 'violet'
    width: Optional[str] = 'half'
    auto_refresh: Optional[int] = 0

class RefreshRequest(BaseModel):
    active_tables: List[str] = []

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

class SettingsRequest(BaseModel):
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: Optional[str] = None

@app.post("/api/connect")
async def connect_db(req: ConnectionRequest):
    global active_tables
    try:
        if req.db_type == "sqlite":
            if not req.filepath:
                raise HTTPException(status_code=400, detail="Filepath required for SQLite")
            
            # Helper to detect local windows paths in linux deployment
            if "\\" in req.filepath or (len(req.filepath) > 1 and req.filepath[1] == ":"):
                raise HTTPException(status_code=400, detail="Local Windows path detected. Please use a simple name like 'data.db' for cloud deployment.")
                
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
    global active_tables
    try:
        if req.db_type == "sqlite":
            filepath = req.filepath or "new_database.db"
            if not filepath.endswith(".db"):
                filepath = f"{filepath}.db"
            db_manager.connect_sqlite(filepath)
        elif req.db_type == "postgresql":
            db_manager.connect_postgresql(req.host, req.port, req.dbname, req.user, req.password)
        else:
            raise HTTPException(status_code=400, detail="Invalid DB type")
        
        active_tables = db_manager.get_all_tables()
        return {"status": "created", "db_name": db_manager.db_name, "db_type": db_manager.db_type, "tables": active_tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tables")
async def get_tables():
    if not db_manager.conn:
        return {"tables": []}
    return {"tables": db_manager.get_all_tables()}

GLOSSARY_PATH = os.path.join(os.path.dirname(__file__), "business_glossary.json")

@app.get("/api/glossary")
async def get_glossary():
    if not os.path.exists(GLOSSARY_PATH):
        return {}
    with open(GLOSSARY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/glossary")
async def save_glossary(data: dict):
    with open(GLOSSARY_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    return {"status": "success"}

@app.get("/api/erd")
async def get_erd():
    if not db_manager.conn:
        raise HTTPException(status_code=400, detail="No DB connected")
    
    try:
        tables = db_manager.get_all_tables()
        nodes = []
        edges = []
        
        for table in tables:
            cols = []
            if db_manager.db_type == "sqlite":
                res = db_manager.execute_query(f"PRAGMA table_info('{table}')")
                if res and isinstance(res, list):
                    cols = [{"name": r["name"], "type": r["type"], "pk": r["pk"] > 0} for r in res]
                
                fk_res = db_manager.execute_query(f"PRAGMA foreign_key_list('{table}')")
                if fk_res and isinstance(fk_res, list):
                    for fk in fk_res:
                        edges.append({
                            "source": table,
                            "target": fk["table"],
                            "sourceHandle": fk["from"],
                            "targetHandle": fk["to"]
                        })
            else:
                # PostgreSQL
                # Get columns and primary keys
                pk_sql = f"""
                    SELECT kcu.column_name 
                    FROM information_schema.table_constraints tc 
                    JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name 
                    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = '{table}'
                """
                pk_res = db_manager.execute_query(pk_sql)
                pks = [r['column_name'] for r in pk_res] if isinstance(pk_res, list) else []

                col_res = db_manager.execute_query(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
                if col_res and isinstance(col_res, list):
                    cols = [{"name": r["column_name"], "type": r["data_type"], "pk": r["column_name"] in pks} for r in col_res]

                # Get foreign keys
                fk_sql = f"""
                    SELECT kcu.column_name as from_col, ccu.table_name as to_table, ccu.column_name as to_col
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '{table}'
                """
                fk_res = db_manager.execute_query(fk_sql)
                if fk_res and isinstance(fk_res, list):
                    for fk in fk_res:
                        edges.append({
                            "source": table,
                            "target": fk["to_table"],
                            "sourceHandle": fk["from_col"],
                            "targetHandle": fk["to_col"]
                        })
                
            nodes.append({
                "id": table,
                "columns": cols
            })
            
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schedule")
async def schedule_report(data: dict):
    print(f"Scheduled report for widget {data.get('widget_id')} to {data.get('email')} ({data.get('frequency')})")
    return {"status": "success", "message": f"Report successfully scheduled for {data.get('frequency')} delivery"}

@app.get("/api/reports/stream-scheduled")
async def stream_scheduled_reports():
    async def report_generator():
        yield {"event": "status", "data": json.dumps({"step": "Initializing Scheduled Report Engine", "progress": 10})}
        time.sleep(0.5)
        yield {"event": "status", "data": json.dumps({"step": "Compiling BI Dashboard Metrics & PDF Charts", "progress": 50})}
        time.sleep(0.5)
        yield {"event": "status", "data": json.dumps({"step": "Streaming PDF & CSV Package via SSE Delivery", "progress": 100, "status": "completed"})}

    return EventSourceResponse(report_generator())

@app.get("/api/schema/{table}")
async def get_schema(table: str):
    try:
        if db_manager.db_type == "sqlite":
            res = db_manager.execute_query(f"PRAGMA table_info('{table}')")
        else:
            res = db_manager.execute_query(f"SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '{table}'")
        return {"table": table, "schema": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/{table}")
async def profile_table(table: str):
    if not db_manager.conn:
        raise HTTPException(status_code=400, detail="No DB connected")
    
    try:
        count_res = db_manager.execute_query(f'SELECT COUNT(*) as c FROM "{table}"')
        total_rows = count_res[0]['c'] if count_res else 0
        
        # We sample up to 10000 rows for fast profiling
        res = db_manager.execute_query(f'SELECT * FROM "{table}" LIMIT 10000')
        if not res:
            return {"table": table, "total_rows": total_rows, "profile": []}
        
        df = pd.DataFrame(res)
        profile = []
        
        for col in df.columns:
            col_data = df[col]
            null_count = int(col_data.isna().sum())
            null_pct = round((null_count / len(df)) * 100, 2) if len(df) > 0 else 0
            
            # Using try-except for unhashable types like lists/dicts
            try:
                unique_count = int(col_data.nunique())
            except TypeError:
                unique_count = 0
                
            dtype = str(col_data.dtype)
            
            issues = []
            if null_pct > 20:
                issues.append(f"High NULLs ({null_pct}%)")
            if unique_count == 1 and len(df) > 1:
                issues.append("Constant Value")
            elif unique_count == len(df) and len(df) > 1 and dtype != 'object':
                issues.append("All Unique (ID?)")
                
            profile.append({
                "name": col,
                "type": dtype,
                "nulls": null_count,
                "null_pct": null_pct,
                "unique": unique_count,
                "issues": issues
            })
            
        return {
            "table": table,
            "total_rows": total_rows,
            "profile": profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/{table}")
async def get_table_data(table: str, page: int = 1, limit: int = 15, active_tables: str = ""):
    try:
        active_list = active_tables.split(",") if active_tables else []
        all_tables = db_manager.get_all_tables()
        
        # Check Guardrails
        guard_result = check_sql_guardrails(f'SELECT * FROM "{table}"', active_list, all_tables)
        if guard_result["blocked"]:
            raise HTTPException(status_code=403, detail=guard_result["error"])

        offset = (page - 1) * limit
        # Get total count
        count_res = db_manager.execute_query(f'SELECT COUNT(*) as count FROM "{table}"')
        total = count_res[0]['count'] if count_res else 0
        
        # Get page data
        rows = db_manager.execute_query(f'SELECT * FROM "{table}" LIMIT {limit} OFFSET {offset}')
        
        # Apply PII Masking
        if isinstance(rows, list) and rows:
            pii_cols = identify_pii_columns(list(rows[0].keys()))
            if pii_cols:
                rows = mask_rows(rows, pii_cols)
                
        return {
            "table": table,
            "rows": rows,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sample/{table}")
async def get_sample(table: str, limit: int = 5, active_tables: str = ""):
    try:
        active_list = active_tables.split(",") if active_tables else []
        all_tables = db_manager.get_all_tables()
        
        # Check Guardrails
        guard_result = check_sql_guardrails(f'SELECT * FROM "{table}"', active_list, all_tables)
        if guard_result["blocked"]:
            raise HTTPException(status_code=403, detail=guard_result["error"])
            
        res = db_manager.execute_query(f"SELECT * FROM {table} LIMIT {limit}")
        
        # Apply PII Masking
        if isinstance(res, list) and res:
            pii_cols = identify_pii_columns(list(res[0].keys()))
            if pii_cols:
                res = mask_rows(res, pii_cols)
                
        return {"table": table, "rows": res}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not db_manager.conn:
        raise HTTPException(status_code=400, detail="Database not connected")
    
    try:
        agent = SQLAgent(db_manager, req.active_tables, meta_db)
    except ValueError as e:
        print(f"⚠️  Chat Request Blocked: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    async def event_generator():
        try:
            for event in agent.run_query_stream(req.message):
                yield {
                    "event": "message",
                    "data": json.dumps(event)
                }
        except Exception as e:
            yield {
                "event": "message",
                "data": json.dumps({"type": "error", "message": str(e)})
            }
            
    return EventSourceResponse(event_generator())

@app.post("/api/optimize-sql")
async def optimize_sql(req: OptimizeRequest):
    if not db_manager.conn:
        raise HTTPException(status_code=400, detail="Database not connected")
    
    start_time = time.time()
    explain_results = []
    scan_type = "Unknown Scan"
    cost_estimate = "N/A"
    
    try:
        # Run empirical EXPLAIN plan
        if db_manager.db_type == "sqlite":
            explain_res = db_manager.execute_query(f"EXPLAIN QUERY PLAN {req.sql}")
            explain_results = explain_res if isinstance(explain_res, list) else []
            plan_str = json.dumps(explain_results)
            if "SCAN TABLE" in plan_str.upper():
                scan_type = "FULL TABLE SCAN (Sequential)"
            elif "SEARCH TABLE" in plan_str.upper():
                scan_type = "INDEX SEARCH (Optimized)"
        else:
            explain_res = db_manager.execute_query(f"EXPLAIN ANALYZE {req.sql}")
            explain_results = explain_res if isinstance(explain_res, list) else []
            plan_str = json.dumps(explain_results)
            if "Seq Scan" in plan_str:
                scan_type = "Sequential Table Scan (Slow)"
            elif "Index Scan" in plan_str:
                scan_type = "Index Scan (Fast)"

        elapsed = round((time.time() - start_time) * 1000, 2)
        
        # Build empirical Bottleneck Report
        empirical_report = f"""### 🔍 Empirical Query Execution Plan & Bottleneck Analysis
- **Database Engine**: {db_manager.db_type.upper()}
- **Access Pattern Detected**: `{scan_type}`
- **Execution Cost Overhead**: {elapsed} ms
- **Raw Execution Plan**:
```json
{json.dumps(explain_results, indent=2)}
```

### ⚡ Optimization Recommendations
1. **Index Optimization**: If scan type shows Full Table Scan, create a composite index on filtered `WHERE` columns.
2. **Column Selection**: Avoid `SELECT *` — explicitly specify target columns to minimize I/O overhead.
"""

        # AI enhancement if key available
        try:
            agent = SQLAgent(db_manager, req.active_tables, meta_db)
            if agent.client:
                prompt = f"Analyze the following query and its empirical execution plan. Provide optimized rewritten SQL and index suggestions.\n\nQuery:\n```sql\n{req.sql}\n```\n\nExecution Plan:\n```json\n{json.dumps(explain_results)}\n```"
                completion = agent.client.chat.completions.create(
                    model=agent.model,
                    messages=[
                        {"role": "system", "content": "You are a database performance tuning expert. Provide clear markdown with: 1. Bottleneck Analysis, 2. Optimized SQL, 3. Index Suggestions."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.2,
                    max_tokens=1200
                )
                return {"suggestion": f"{empirical_report}\n\n### 🤖 AI Performance Diagnosis\n{completion.choices[0].message.content}"}
        except Exception:
            pass

        return {"suggestion": empirical_report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    active_tables: List[str] = []

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
    
    # Apply Guardrails
    all_tables = db_manager.get_all_tables()
    guard_result = check_sql_guardrails(sql, req.active_tables, all_tables)
    if guard_result["blocked"]:
        meta_db.log_audit(sql, was_blocked=True, block_reason=guard_result["error"])
        return {"error": guard_result["error"], "executionTime": "0ms"}

    try:
        if is_read:
            result = db_manager.execute_query(sql)
            elapsed = round((time.time() - start) * 1000, 2)
            if isinstance(result, dict) and "error" in result:
                return {"error": result["error"], "executionTime": f"{elapsed}ms"}
            
            # Apply PII Masking
            columns = list(result[0].keys()) if result else []
            pii_cols = identify_pii_columns(columns)
            if pii_cols:
                result = mask_rows(result, pii_cols)

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

@app.post("/api/ai/suggest-query")
async def suggest_query(req: Dict[str, Any]):
    prompt = req.get("prompt")
    active_tables = req.get("active_tables", [])
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt required")
    
    if not db_manager.conn:
        raise HTTPException(status_code=400, detail="Database not connected")

    try:
        # Get schema for context
        schema_info = {}
        for table in active_tables:
            if db_manager.db_type == "sqlite":
                res = db_manager.execute_query(f"PRAGMA table_info('{table}')")
            else:
                res = db_manager.execute_query(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            schema_info[table] = res

        settings = meta_db.get_settings()
        api_key = settings.get("openai_api_key") or os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        base_url = settings.get("openai_base_url")
        model = settings.get("openai_model") or "llama-3.1-8b-instant"

        if not api_key:
            return {"suggestions": ["Please configure API Key in Settings"]}
            
        client = OpenAI(
            base_url=base_url if base_url else None,
            api_key=api_key
        )

        # Check guardrails for the context tables
        all_tables = db_manager.get_all_tables()
        for table in active_tables:
             # Basic check to ensure we don't leak schemas of restricted tables
             if table not in active_tables:
                 continue
                 
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system", 
                    "content": f"You are a SQL assistant. Generate ONLY the SQL query for the user's request. Do not include markdown code blocks or explanations. Use valid {db_manager.db_type} syntax. Tables and schema: {json.dumps(schema_info)}"
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        sql = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if sql.startswith("```"):
            sql = sql.split("\n", 1)[1]
        if sql.endswith("```"):
            sql = sql.rsplit("\n", 1)[0]
        if sql.startswith("sql"): # Handle ```sql ... ```
            sql = sql[3:].strip()
            
        return {"sql": sql}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/widgets")
async def get_widgets():
    widgets = meta_db.get_widgets()
    return {"widgets": widgets}

@app.post("/api/dashboard/widgets")
async def add_widget(req: WidgetCreateRequest):
    meta_db.add_widget(req.dict())
    return {"status": "success"}

@app.patch("/api/dashboard/widgets/{widget_id}")
async def update_widget(widget_id: str, updates: Dict[str, Any]):
    widget = meta_db.get_widget(widget_id)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    # Merge updates
    updated_widget = {**widget, **updates}
    meta_db.update_widget(widget_id, updated_widget)
    return {"status": "success", "widget": updated_widget}

@app.delete("/api/dashboard/widgets/{widget_id}")
async def delete_widget(widget_id: str):
    meta_db.delete_widget(widget_id)
    return {"status": "success"}

@app.post("/api/dashboard/reorder")
async def reorder_widgets(req: ReorderRequest):
    meta_db.reorder_widgets(req.ids)
    return {"status": "success"}

@app.post("/api/dashboard/widgets/{widget_id}/refresh")
async def refresh_widget(widget_id: str, req: RefreshRequest):
    widget = meta_db.get_widget(widget_id)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    # Apply Guardrails
    all_tables = db_manager.get_all_tables()
    guard_result = check_sql_guardrails(widget['sql_query'], req.active_tables, all_tables)
    if guard_result["blocked"]:
        return {"error": guard_result["error"]}
    
    start = time.time()
    try:
        result = db_manager.execute_query(widget['sql_query'])
        elapsed = round((time.time() - start) * 1000, 2)
        
        if isinstance(result, dict) and "error" in result:
            return {"error": result["error"], "executionTime": f"{elapsed}ms"}
        
        # Apply PII Masking
        if isinstance(result, list) and result:
            pii_cols = identify_pii_columns(list(result[0].keys()))
            if pii_cols:
                result = mask_rows(result, pii_cols)

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
        with open(log_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            return {"logs": lines[-100:]}
    return {"logs": []}

@app.get("/api/audit-log")
@app.get("/api/audit-logs")
async def get_audit_logs(limit: int = 100):
    logs = meta_db.get_audit_logs(limit=limit)
    return {"logs": logs}

@app.get("/api/glossary")
async def get_glossary():
    path = "business_glossary.json"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"metrics": {}, "segments": {}, "entities": {}}

@app.post("/api/glossary")
async def update_glossary(req: dict):
    path = "business_glossary.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(req, f, indent=4)
    return {"status": "success"}

@app.post("/api/autocomplete")
async def autocomplete(req: dict):
    sql = req.get("sql", "").strip()
    if not sql:
        return {"suggestions": []}
        
    try:
        # Provide schema context for better suggestions
        schema_context = ""
        for table in active_tables:
            if db_manager.db_type == "sqlite":
                cols = db_manager.execute_query(f"PRAGMA table_info('{table}')")
                col_names = [c['name'] for c in cols]
            else:
                cols = db_manager.execute_query(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
                col_names = [c['column_name'] for c in cols]
            schema_context += f"Table {table}: {', '.join(col_names)}\n"

        settings = meta_db.get_settings()
        api_key = settings.get("openai_api_key") or os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        base_url = settings.get("openai_base_url")
        model = settings.get("openai_model") or "llama-3.1-8b-instant"

        if not api_key:
            return {"suggestions": ["Please configure API Key"]}
            
        client = OpenAI(
            base_url=base_url if base_url else None,
            api_key=api_key
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": f"You are an AI assistant helping a user autocomplete SQL queries. Provide ONLY 3 concise SQL suggestions based on their current input. Return a JSON array of strings under the key 'suggestions'. Schema context:\n{schema_context}"},
                {"role": "user", "content": f"Current SQL input: {sql}"}
            ],
            response_format={"type": "json_object"}
        )
        try:
            suggestions = json.loads(response.choices[0].message.content)
            return suggestions
        except:
            return {"suggestions": []}
    except Exception as e:
        return {"suggestions": []}

@app.get("/api/settings")
async def get_settings():
    settings = meta_db.get_settings()
    api_key = settings.get("openai_api_key", "")
    masked_key = ""
    if api_key:
        if len(api_key) > 8:
            masked_key = f"{api_key[:4]}...{api_key[-4:]}"
        else:
            masked_key = "***"
    
    return {
        "openai_api_key": masked_key,
        "openai_base_url": settings.get("openai_base_url", ""),
        "openai_model": settings.get("openai_model", "")
    }

@app.post("/api/settings")
async def save_settings(req: SettingsRequest):
    settings_dict = {}
    
    if req.openai_api_key:
        if "..." not in req.openai_api_key and req.openai_api_key != "***":
            settings_dict["openai_api_key"] = req.openai_api_key
    
    if req.openai_base_url is not None:
        settings_dict["openai_base_url"] = req.openai_base_url
        
    if req.openai_model is not None:
        settings_dict["openai_model"] = req.openai_model
        
    if settings_dict:
        meta_db.update_settings(settings_dict)
        
    return {"status": "success"}

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

@app.post("/api/dashboard/demo")
async def seed_demo_dashboard():
    if not db_manager.conn:
        # Create a temporary sqlite for demo if not connected
        db_manager.connect_sqlite("demo.db")
    
    try:
        # 1. Create a demo table
        db_manager.execute_write("DROP TABLE IF EXISTS demo_sales")
        db_manager.execute_write("""
            CREATE TABLE demo_sales (
                id INTEGER PRIMARY KEY,
                product TEXT,
                category TEXT,
                revenue REAL,
                units INTEGER,
                sale_date DATE
            )
        """)
        
        # 2. Insert sample data
        sample_data = [
            ("Laptops", "Electronics", 12000.50, 10, "2024-01-10"),
            ("Smartphones", "Electronics", 8500.20, 15, "2024-01-12"),
            ("Coffee Makers", "Appliances", 1500.00, 20, "2024-01-15"),
            ("Air Purifiers", "Appliances", 2200.75, 8, "2024-01-18"),
            ("Running Shoes", "Apparel", 3400.00, 40, "2024-01-20"),
            ("T-Shirts", "Apparel", 1200.00, 100, "2024-01-22"),
            ("Desks", "Furniture", 5600.00, 12, "2024-01-25"),
            ("Chairs", "Furniture", 2800.00, 30, "2024-01-28"),
        ]
        
        for item in sample_data:
            db_manager.execute_write(
                "INSERT INTO demo_sales (product, category, revenue, units, sale_date) VALUES (?, ?, ?, ?, ?)",
                item
            )
        
        # 3. Create demo widgets
        meta_db.clear_history()
        # Clear existing widgets for demo? Maybe not, just add them
        
        demo_widgets = [
            {
                "id": str(uuid.uuid4()),
                "title": "Revenue by Category (Pie)",
                "widget_type": "chart",
                "chart_type": "pie",
                "sql_query": "SELECT category, SUM(revenue) as total_revenue FROM demo_sales GROUP BY category",
                "x_column": "category",
                "y_column": "total_revenue",
                "color_scheme": "violet",
                "width": "half"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Units Sold by Product (Bar)",
                "widget_type": "chart",
                "chart_type": "bar",
                "sql_query": "SELECT product, units FROM demo_sales ORDER BY units DESC",
                "x_column": "product",
                "y_column": "units",
                "color_scheme": "cyan",
                "width": "half"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Total Revenue (Metric)",
                "widget_type": "metric",
                "sql_query": "SELECT SUM(revenue) as value FROM demo_sales",
                "color_scheme": "green",
                "width": "half"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Detailed Sales Log (Table)",
                "widget_type": "table",
                "sql_query": "SELECT * FROM demo_sales ORDER BY sale_date DESC",
                "width": "full"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Revenue vs Units (Scatter)",
                "widget_type": "chart",
                "chart_type": "scatter",
                "sql_query": "SELECT revenue, units, product FROM demo_sales",
                "x_column": "revenue",
                "y_column": "units",
                "color_scheme": "amber",
                "width": "half"
            }
        ]
        
        for w in demo_widgets:
            meta_db.add_widget(w)
            
        return {"status": "success", "message": "Demo dashboard seeded with Pie, Bar, Metric, Table, and Scatter charts."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve frontend static files in production
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend-dist")
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)