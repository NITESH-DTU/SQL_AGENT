import os
import json
import time
from typing import Generator
from openai import OpenAI
from tools import AgentTools
from tools_schema import TOOLS_SCHEMA
from dotenv import load_dotenv

load_dotenv()

class SQLAgent:
    def __init__(self, db_manager, active_tables, meta_db):
        self.db_manager = db_manager
        self.active_tables = active_tables
        self.meta_db = meta_db
        self.tools_executor = AgentTools(db_manager, active_tables, meta_db)
        
        # Multi-provider setup: Groq -> OpenAI -> Fallback
        self.provider = None
        self.client = None
        self.model = None

        settings = self.meta_db.get_settings()
        api_key = settings.get("openai_api_key")
        base_url = settings.get("openai_base_url")
        model = settings.get("openai_model")

        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if api_key:
            self.provider = "custom"
            self.client = OpenAI(
                base_url=base_url if base_url else None,
                api_key=api_key
            )
            self.model = model or "gpt-4o-mini"
        elif groq_key and groq_key != "your_groq_api_key_goes_here":
            self.provider = "groq"
            self.client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=groq_key
            )
            self.model = "llama-3.1-8b-instant"
        elif openai_key and openai_key != "your_openai_api_key_goes_here":
            self.provider = "openai"
            self.client = OpenAI(api_key=openai_key)
            self.model = "gpt-4o-mini"
        else:
            self.provider = "local_fallback"
            print("ℹ️ Operating in Local Fallback mode (No GROQ_API_KEY or OPENAI_API_KEY set).")

    def _get_system_prompt(self):
        glossary_context = ""
        try:
            glossary_path = os.path.join(os.path.dirname(__file__), "business_glossary.json")
            if os.path.exists(glossary_path):
                with open(glossary_path, "r", encoding="utf-8") as f:
                    glossary_data = json.load(f)
                    glossary_context = f"\nOFFICIAL BUSINESS GLOSSARY & SEMANTIC DEFINITIONS:\n{json.dumps(glossary_data, indent=2)}\n"
        except Exception:
            pass

        return f"""You are an autonomous SQL Data Engineer.
Active tables: {self.active_tables}
Database type: {self.db_manager.db_type}
Database name: {self.db_manager.db_name}
{glossary_context}
You do not ask for permission — you act, analyze, and continue until the task is complete.

BUSINESS GLOSSARY RULES:
- Use the provided semantic definitions above whenever writing SQL or analyzing metrics (e.g. revenue, churn, active_user).

CRITICAL TOOL CALLING RULES:
- Use ONLY the provided tool functions via the standard tool calling interface.
- NEVER output XML-style function calls like <function=name{{}}></function>.
- Call ONE tool at a time.

Output Structure Rules:
1. **Always** use Markdown tables for data results.
2. **Always** structure your final answer with clear headings:
   - ### 📊 Analysis Overview
   - ### 🛠️ Actions Taken
   - ### 📝 Results Summary
3. **Be Concise**: Focus on data insights."""

    def _log_session(self, action, content):
        with open("agent_sessions.log", "a", encoding="utf-8") as f:
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{timestamp}] {action}: {str(content)}\n")

    def run_query_stream(self, user_query: str) -> Generator[dict, None, None]:
        messages = [
            {"role": "system", "content": self._get_system_prompt()},
            {"role": "user", "content": user_query}
        ]
        
        self._log_session("START", f"User Query: {user_query}")
        
        iterations = 0
        max_iterations = 15
        retry_count = 0
        max_retries = 3
        
        while iterations < max_iterations:
            # Send status update
            yield {"type": "status", "content": f"Agent is thinking...", "iteration": iterations + 1}
            
            if self.provider == "local_fallback" or not self.client:
                # Local fallback query processor
                target_table = self.active_tables[0] if self.active_tables else "demo_sales"
                sql = f"SELECT * FROM \"{target_table}\" LIMIT 10"
                yield {"type": "tool_call", "tool": "execute_query", "args": {"sql": sql}}
                res = self.tools_executor.invoke_tool("execute_query", {"sql": sql})
                yield {"type": "tool_result", "tool": "execute_query", "args": {"sql": sql}, "result": json.dumps(res.get("result", []), default=str), "sql": sql}
                
                answer = f"### 📊 Analysis Overview\nQuery analyzed using Local Rule Fallback.\n\n### 🛠️ Actions Taken\nExecuted SQL query on table `{target_table}`.\n\n### 📝 Results Summary\nRetrieved {len(res.get('result', []))} records."
                yield {"type": "final_answer", "message": answer}
                break

            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOLS_SCHEMA,
                    tool_choice="auto",
                    temperature=0.1,
                    parallel_tool_calls=False
                )
                retry_count = 0  # Reset on success
            except Exception as e:
                error_str = str(e)
                # Retry on malformed tool call errors from Groq
                if ("tool_use_failed" in error_str or "failed_generation" in error_str) and retry_count < max_retries:
                    retry_count += 1
                    self._log_session("RETRY", f"Attempt {retry_count}: {error_str[:200]}")
                    messages.append({
                        "role": "user",
                        "content": "IMPORTANT: Your previous response had a formatting error. You MUST use the structured tool calling interface. Do NOT write function calls as text. Just use the execute_query tool with the SQL query directly."
                    })
                    yield {"type": "status", "content": f"Retrying after format error (attempt {retry_count}/{max_retries})..."}
                    iterations += 1
                    continue
                
                # Fallback to executing query locally if LLM provider fails
                target_table = self.active_tables[0] if self.active_tables else "demo_sales"
                sql = f"SELECT * FROM \"{target_table}\" LIMIT 10"
                yield {"type": "tool_call", "tool": "execute_query", "args": {"sql": sql}}
                res = self.tools_executor.invoke_tool("execute_query", {"sql": sql})
                yield {"type": "tool_result", "tool": "execute_query", "args": {"sql": sql}, "result": json.dumps(res.get("result", []), default=str), "sql": sql}
                yield {"type": "final_answer", "message": f"### 📊 Analysis Overview\nExecuted fallback query due to API error ({error_str[:100]}).\n\n### 📝 Results Summary\nFetched dataset from table `{target_table}`."}
                break
            
            msg = response.choices[0].message
            messages.append(msg)
            
            # If the agent sent text
            if msg.content:
                yield {"type": "final_answer", "message": msg.content}
                self._log_session("AGENT", msg.content)
            
            # If no more tool calls, we are done
            if not msg.tool_calls:
                break
                
            for tool_call in msg.tool_calls:
                tool_name = tool_call.function.name
                try:
                    args = json.loads(tool_call.function.arguments)
                except:
                    args = {}
                
                # Notify frontend of tool call
                yield {"type": "tool_call", "tool": tool_name, "args": args}
                self._log_session("TOOL_CALL", f"{tool_name} {args}")
                
                # Execute tool
                start_tool = time.time()
                tool_response = self.tools_executor.invoke_tool(tool_name, args)
                result = tool_response.get("result")
                logged_sql = tool_response.get("sql")
                
                elapsed_tool = round((time.time() - start_tool) * 1000, 2)
                result_str = json.dumps(result, default=str)
                
                # Log SQL-related tools to history if we have SQL
                if logged_sql:
                    self.meta_db.log_query(
                        sql=logged_sql,
                        source="agent",
                        result_count=len(result) if isinstance(result, list) else 0,
                        execution_time=f"{elapsed_tool}ms",
                        db_name=self.db_manager.db_name
                    )

                # Notify frontend of result
                yield {
                    "type": "tool_result", 
                    "tool": tool_name, 
                    "args": args,
                    "result": result_str,
                    "sql": logged_sql
                }
                self._log_session("TOOL_RESULT", f"{tool_name} completed")
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_name,
                    "content": result_str
                })
                
            iterations += 1
            
        if iterations >= max_iterations:
            yield {"type": "final_answer", "message": "Reached maximum iterations (15). Terminating loop."}
            self._log_session("STOP", "Reached max iterations")
        
        yield {"type": "done"}
