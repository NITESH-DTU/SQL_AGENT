import os
import sys
from dotenv import load_dotenv

# Load variables from .env file into os.environ
load_dotenv()

from db_manager import DBManager
from table_builder import build_table_flow
from agent import SQLAgent

def start_ui():
    db_manager = DBManager()
    active_tables = []
    
    while True:
        print("\n┌─────────────────────────────────────────┐")
        print("│       SQL AGENT — DATABASE MANAGER      │")
        print("├─────────────────────────────────────────┤")
        print("│  1. Connect to existing SQLite file     │")
        print("│  2. Connect to existing PostgreSQL DB   │")
        print("│  3. Create a new SQLite database        │")
        print("│  4. Create a new PostgreSQL database    │")
        print("│  5. Exit                                │")
        print("└─────────────────────────────────────────┘")
        
        choice = input("Choice: ").strip()
        
        if choice == "1":
            filepath = input("Enter path to .db file: ").strip()
            if not os.path.exists(filepath):
                print("File does not exist.")
                continue
            db_manager.connect_sqlite(filepath)
            active_tables = pick_tables(db_manager)
            if active_tables:
                agent_menu(db_manager, active_tables)
                
        elif choice == "2":
            host = input("Host (default: localhost): ").strip() or "localhost"
            port = input("Port (default: 5432): ").strip() or "5432"
            dbname = input("Database name: ").strip()
            user = input("Username: ").strip()
            password = input("Password: ").strip()
            
            try:
                db_manager.connect_postgresql(host, port, dbname, user, password)
                print("Successfully connected to PostgreSQL.")
                active_tables = pick_tables(db_manager)
                if active_tables:
                    agent_menu(db_manager, active_tables)
            except Exception as e:
                print(f"Connection failed: {e}")
                
        elif choice == "3":
            dbname = input("Enter name for the new database (without .db): ").strip()
            filepath = f"{dbname}.db"
            if os.path.exists(filepath):
                print("! File already exists.")
                continue
            # Simply connecting creates the file in sqlite
            db_manager.connect_sqlite(filepath)
            print(f"Created {filepath}.")
            build_table_flow(db_manager)
            active_tables = pick_tables(db_manager)
            if active_tables:
                agent_menu(db_manager, active_tables)
                
        elif choice == "4":
            # Must connect to default db first to create a new one
            host = input("Host (default: localhost): ").strip() or "localhost"
            port = input("Port (default: 5432): ").strip() or "5432"
            user = input("Username: ").strip()
            password = input("Password: ").strip()
            new_dbname = input("Enter name for the new database: ").strip()
            
            try:
                import psycopg2
                conn = psycopg2.connect(host=host, port=port, dbname="postgres", user=user, password=password)
                conn.autocommit = True
                cursor = conn.cursor()
                cursor.execute(f"CREATE DATABASE {new_dbname}")
                cursor.close()
                conn.close()
                print("Database created!")
                db_manager.connect_postgresql(host, port, new_dbname, user, password)
                build_table_flow(db_manager)
                active_tables = pick_tables(db_manager)
                if active_tables:
                    agent_menu(db_manager, active_tables)
            except Exception as e:
                print(f"Failed to create DB: {e}")
                
        elif choice == "5":
            print("Exiting.")
            sys.exit(0)
        else:
            print("Invalid choice.")

def pick_tables(db_manager):
    all_tables = db_manager.get_all_tables()
    if not all_tables:
        print("No tables found in the database.")
        return []
        
    print("\n--- SELECTION ---")
    print("Found tables:")
    for idx, table in enumerate(all_tables):
        print(f"  {idx + 1}. {table}")
        
    print("\nPick which tables the agent should work on.")
    ans = input("Type comma-separated numbers (e.g. 1,3,4) or 'all': ").strip()
    
    if ans.lower() == 'all':
        return list(all_tables)
        
    try:
        indices = [int(i.strip()) - 1 for i in ans.split(',')]
        selected = [all_tables[i] for i in indices if 0 <= i < len(all_tables)]
        return selected
    except ValueError:
        print("Invalid selection format.")
        return []

def agent_menu(db_manager, active_tables):
    while True:
        print("\n=========================================")
        print(f"Connected to: {db_manager.db_name} ({db_manager.db_type})")
        print(f"Active tables: {', '.join(active_tables)}")
        print("┌─────────────────────────────────────────┐")
        print("│             AGENT MENU                  │")
        print("├─────────────────────────────────────────┤")
        print("│  1. Ask the agent a question            │")
        print("│  2. Create a new table                  │")
        print("│  3. Switch active tables                │")
        print("│  4. View table schema                   │")
        print("│  5. View table data (sample rows)       │")
        print("│  6. Export a table to CSV               │")
        print("│  7. Show agent activity log             │")
        print("│  8. Disconnect and switch database      │")
        print("│  9. Exit                                │")
        print("└─────────────────────────────────────────┘")
        
        choice = input("Choice: ").strip()
        
        if choice == "1":
            question = input("\nAsk the agent: ").strip()
            if question:
                agent = SQLAgent(db_manager, active_tables)
                agent.run_query(question)
                
        elif choice == "2":
            build_table_flow(db_manager)
            active_tables = pick_tables(db_manager)
            
        elif choice == "3":
            active_tables = pick_tables(db_manager)
            
        elif choice == "4":
            t = input("Table name: ").strip()
            if t in active_tables:
                if db_manager.db_type == "sqlite":
                    print(db_manager.execute_query(f"PRAGMA table_info('{t}')"))
                else:
                    print(db_manager.execute_query(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}'"))
            else:
                print("Table not active.")
                
        elif choice == "5":
            t = input("Table name: ").strip()
            if t in active_tables:
                res = db_manager.execute_query(f"SELECT * FROM {t} LIMIT 5")
                for r in res: print(r)
            else:
                print("Table not active.")
                
        elif choice == "6":
            from exporter import export_to_csv
            t = input("Table name: ").strip()
            if t in active_tables:
                fname = input("Filename (e.g. data.csv): ").strip()
                res = export_to_csv(db_manager, f"SELECT * FROM {t}", fname)
                print(res)
            else:
                print("Table not active.")
                
        elif choice == "7":
            if os.path.exists("agent_sessions.log"):
                with open("agent_sessions.log", "r", encoding="utf-8") as f:
                    print(f.read()[-1500:]) # rough tail
            else:
                print("No logs found.")
                
        elif choice == "8":
            db_manager.close()
            return # Returns to start_ui loop
            
        elif choice == "9":
            db_manager.close()
            print("Exiting.")
            sys.exit(0)

if __name__ == "__main__":
    start_ui()
