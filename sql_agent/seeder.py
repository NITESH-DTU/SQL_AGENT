import os
import json
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

def seed_table(db_manager, table_name, num_rows):
    api_key = os.getenv("GROQ_API_KEY")
   
    if not api_key:
        print("Error: GROQ_API_KEY not found in environment.")
        return False
        
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key
    )
    
    
    # Get schema
    if db_manager.db_type == "sqlite":
        sql = f"PRAGMA table_info('{table_name}')"
    else:
        sql = f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}'
        """
    schema = db_manager.execute_query(sql)
    
    prompt = f"""
    Generate {num_rows} realistic sample data rows for the following table schema:
    Table: {table_name}
    Schema: {json.dumps(schema)}
    
    Return strict JSON format as an array of objects.
    Each object must have the column names as keys and the realistic data as values.
    Do not include any other text, markdown, or explanations. Just the JSON array.
    """
    
    print(f"\n[seeder] Asking LLM to generate {num_rows} rows for {table_name}...")
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    
    content = response.choices[0].message.content.strip()
    # Clean up markdown if model still included it
    if content.startswith("```json"):
        content = content[7:]
    if content.endswith("```"):
        content = content[:-3]
        
    try:
        data = json.loads(content)
        if not data or not isinstance(data, list):
            print("[seeder] Returned data is not a valid list.")
            return False
            
        columns = ", ".join(data[0].keys())
        placeholders = ", ".join(["%s" if db_manager.db_type == "postgresql" else "?"] * len(data[0]))
        sql_insert = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        
        params_list = [tuple(row.values()) for row in data]
        res = db_manager.execute_many(sql_insert, params_list)
        if "error" in res:
            print(f"[seeder] Insert Error: {res['error']}")
            return False
            
        print(f"[seeder] Successfully inserted {res.get('rows_affected', len(data))} rows into {table_name}.")
        return True
    except json.JSONDecodeError as e:
        print(f"[seeder] Failed to parse JSON from LLM: {str(e)}")
        print("Content was:", content)
        return False
    except Exception as e:
        print(f"[seeder] Error during seeding: {str(e)}")
        return False
