from seeder import seed_table

def build_table_flow(db_manager):
    print("\n--- TABLE CREATION FLOW ---")
    table_name = input("Enter table name: ").strip()
    if not table_name:
        print("Table name cannot be empty.")
        return
        
    try:
        num_columns = int(input("How many columns? ").strip())
    except ValueError:
        print("Invalid number.")
        return
        
    columns_def = []
    
    type_map = {
        "1": "TEXT",
        "2": "INTEGER",
        "3": "REAL" if db_manager.db_type == "sqlite" else "FLOAT",
        "4": "BOOLEAN",
        "5": "TIMESTAMP",
        "6": "UUID" # Needs special handling in SQLite, but we will use TEXT for UUID in sqlite if chosen
    }
    
    for i in range(num_columns):
        print(f"\n-- Column {i+1} --")
        col_name = input("Column name: ").strip()
        
        print("Data type (choose):")
        print("  1. TEXT")
        print("  2. INTEGER")
        print("  3. REAL / FLOAT")
        print("  4. BOOLEAN")
        print("  5. TIMESTAMP")
        print("  6. UUID (auto-generated)")
        
        type_choice = input("Choice (1-6): ").strip()
        col_type = type_map.get(type_choice, "TEXT")
        
        # SQLite UUID polyfill
        if col_type == "UUID" and db_manager.db_type == "sqlite":
            col_type = "TEXT"
        elif col_type == "UUID" and db_manager.db_type == "postgresql":
            col_type = "UUID"
            
        pk = input("Is this the primary key? (y/n): ").strip().lower() == 'y'
        
        allow_null_input = 'n'
        if not pk:
            allow_null_input = input("Allow NULL? (y/n): ").strip().lower()
        allow_null = allow_null_input == 'y'
        
        unique = False
        if not pk:
            unique = input("Unique? (y/n): ").strip().lower() == 'y'
            
        default_val = input("Default value? (press Enter to skip): ").strip()
        
        col_def = f"{col_name} {col_type}"
        if pk:
            col_def += " PRIMARY KEY"
            if col_type == "UUID" and db_manager.db_type == "postgresql":
                col_def += " DEFAULT gen_random_uuid()"
        else:
            if not allow_null:
                col_def += " NOT NULL"
            if unique:
                col_def += " UNIQUE"
            if default_val:
                # Basic string wrapping if not a number or function
                if default_val.upper() not in ["TRUE", "FALSE", "NULL", "CURRENT_TIMESTAMP"] and not default_val.replace('.','',1).isdigit():
                    col_def += f" DEFAULT '{default_val}'"
                else:
                    col_def += f" DEFAULT {default_val}"
                    
        columns_def.append(col_def)
        
    sql = f"CREATE TABLE {table_name} (\n  " + ",\n  ".join(columns_def) + "\n);"
    
    print("\n--- PREVIEW ---")
    print(sql)
    
    confirm = input("\nConfirm and create this table? (y/n): ").strip().lower()
    if confirm == 'y':
        res = db_manager.execute_write(sql)
        if isinstance(res, dict) and "error" in res:
            print(f"\nError creating table: {res['error']}")
        else:
            print("\nSuccess! Table created.")
            
            # Seeder Flow
            seed_choice = input("\nDo you want to seed this table with sample data? (y/n): ").strip().lower()
            if seed_choice == 'y':
                try:
                    rows = int(input("How many rows? ").strip())
                    seed_table(db_manager, table_name, rows)
                except ValueError:
                    print("Invalid number. Skipping seeder.")
