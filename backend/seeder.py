import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AISeeder:
    def __init__(self, db_manager):
        self.db_manager = db_manager
        # Use OpenAI SDK pointed at Gemini
        self.client = OpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        )

    def seed_table(self, table_name, columns_definition, num_rows=10):
        """
        Generates realistic seed data using LLM and inserts into table.
        columns_definition: List of dicts with 'name' and 'type'
        """
        prompt = f"""
        Generate {num_rows} realistic sample data rows for a SQL table.
        Table Name: {table_name}
        Columns: {json.dumps(columns_definition)}
        
        Return the data as a strict JSON array of objects.
        Each object key MUST match the column names provided.
        Only return the JSON array, no other text.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gemini-1.5-flash", # Or whatever model name gemini uses in openai compat mode
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"} if "gemini" not in self.client.base_url else None
            )
            
            content = response.choices[0].message.content.strip()
            # Clean markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            data = json.loads(content)
            if isinstance(data, dict) and "rows" in data: data = data["rows"]
            if not isinstance(data, list): data = [data]
            
            if not data:
                return False
                
            cols = list(data[0].keys())
            placeholders = ", ".join(["?" if self.db_manager.db_type == "sqlite" else "%s"] * len(cols))
            cols_str = ", ".join([f'"{c}"' for c in cols])
            sql = f"INSERT INTO \"{table_name}\" ({cols_str}) VALUES ({placeholders})"
            
            params_list = [tuple(row.get(c) for c in cols) for row in data]
            self.db_manager.execute_many(sql, params_list)
            return True
        except Exception as e:
            print(f"Seeding error: {str(e)}")
            return False
