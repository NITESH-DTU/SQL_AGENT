import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from dotenv import load_dotenv

from db_manager import DBManager
from agent import SQLAgent
from table_builder import build_table_flow # won't use directly for API
from seeder import seed_table

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory single-user state
class AppState:
    def __init__(self):
        self.db = DBManager()
        self.active_tables = []

state = AppState()

class ConnectPayload(BaseModel):
    db_type: str # 'sqlite' or 'postgresql'
    filepath: Optional[str] = None
    host: Optional[str] = "localhost"
    port: Optional[str] = "5432"
    dbname: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None

class ActiveTablesPayload(BaseModel):
    tables: List[str]

class QueryPayload(BaseModel):
    query: str

class SeederPayload(BaseModel):
    table_name: str
    num_rows: int

class ColumnDef(BaseModel):
    name: str
    type: str
    is_primary: bool
    allow_null: bool
    is_unique: bool
    default_val: str

class CreateTablePayload(BaseModel):
    table_name: str
    columns: List[ColumnDef]

@app.post("/api/connect")
def connect_db(payload: ConnectPayload):
    try:
        if payload.db_type == "sqlite":
            if not payload.filepath:
                raise HTTPException(status_code=400, detail="Filepath required for SQLite")
            state.db.connect_sqlite(payload.filepath)
        elif payload.db_type == "postgresql":
            state.db.connect_postgresql(
                payload.host, payload.port, payload.dbname, 
                payload.user, payload.password
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid DB type")
        
        return {"success": True, "message": f"Connected to {payload.db_type}", "tables": state.db.get_all_tables()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tables")
def get_tables():
    if not state.db.conn:
        raise HTTPException(status_code=400, detail="Not connected")
    return {"tables": state.db.get_all_tables(), "active_tables": state.active_tables}

@app.post("/api/tables/active")
def set_active_tables(payload: ActiveTablesPayload):
    state.active_tables = payload.tables
    return {"success": True, "active_tables": state.active_tables}

@app.post("/api/tables/create")
def create_table(payload: CreateTablePayload):
    if not state.db.conn:
        raise HTTPException(status_code=400, detail="Not connected")
        
    columns_def = []
    
    # Map friendly types to actual types
    type_map = {
        "TEXT": "TEXT", "INTEGER": "INTEGER", "FLOAT": "REAL" if state.db.db_type == "sqlite" else "FLOAT",
        "BOOLEAN": "BOOLEAN", "TIMESTAMP": "TIMESTAMP", 
        "UUID": "TEXT" if state.db.db_type == "sqlite" else "UUID"
    }
    
    for c in payload.columns:
        col_type = type_map.get(c.type.upper(), "TEXT")
        col_def = f"{c.name} {col_type}"
        
        if c.is_primary:
            col_def += " PRIMARY KEY"
            if col_type == "UUID" and state.db.db_type == "postgresql":
                col_def += " DEFAULT gen_random_uuid()"
        else:
            if not c.allow_null:
                col_def += " NOT NULL"
            if c.is_unique:
                col_def += " UNIQUE"
            if c.default_val:
                if c.default_val.upper() not in ["TRUE", "FALSE", "NULL", "CURRENT_TIMESTAMP"] and not c.default_val.replace('.','',1).isdigit():
                    col_def += f" DEFAULT '{c.default_val}'"
                else:
                    col_def += f" DEFAULT {c.default_val}"
        columns_def.append(col_def)
        
    sql = f"CREATE TABLE {payload.table_name} (\\n  " + ",\\n  ".join(columns_def) + "\\n);"
    res = state.db.execute_write(sql)
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
        
    return {"success": True, "sql": sql}

@app.post("/api/tables/seed")
def seed_db_table(payload: SeederPayload):
    if not state.db.conn:
        raise HTTPException(status_code=400, detail="Not connected")
    success = seed_table(state.db, payload.table_name, payload.num_rows)
    if not success:
        raise HTTPException(status_code=500, detail="Seeding failed. Check console.")
    return {"success": True}

@app.post("/api/chat")
def chat(payload: QueryPayload):
    if not state.db.conn:
        raise HTTPException(status_code=400, detail="Not connected")
    if not state.active_tables:
        raise HTTPException(status_code=400, detail="No active tables selected")
        
    agent = SQLAgent(state.db, state.active_tables)
    # We use a modified run_query_api that returns the history of steps
    try:
        steps = agent.run_query_api(payload.query)
        return {"steps": steps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
