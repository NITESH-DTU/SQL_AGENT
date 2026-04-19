import os
import json
from openai import OpenAI
from tools import AgentTools
from tools_schema import TOOLS_SCHEMA
from dotenv import load_dotenv
load_dotenv()

class SQLAgent:
    def __init__(self, db_manager, active_tables):
        self.db_manager = db_manager
        self.active_tables = active_tables
        self.tools_executor = AgentTools(db_manager, active_tables)
        
        api_key = os.getenv("GROQ_API_KEY")
        
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key
        )
        self.model = "llama-3.3-70b-versatile"

    def _get_system_prompt(self):
        return f"""You are an autonomous SQL agent connected to a live database.
The user has selected these active tables: {self.active_tables}
Database type: {self.db_manager.db_type}

You have 21 tools available. Use them in whatever order you 
decide is best. You do not ask for permission — you act, 
observe, and continue until the task is done.

Rules:
- Explore schema before writing complex queries
- Justify every write operation before executing
- If a guardrail blocks you, self-correct and try differently
- Never invent data — only report what tools return
- Scope all operations strictly to the active tables only
- End with a clean, structured summary for the user"""

    def _log_session(self, action, content):
        with open("agent_sessions.log", "a", encoding="utf-8") as f:
            f.write(f"{action}\\n{content}\\n\\n")

    def run_query(self, user_query):
        messages = [
            {"role": "system", "content": self._get_system_prompt()},
            {"role": "user", "content": user_query}
        ]
        
        self._log_session("--- NEW SESSION ---", f"User Query: {user_query}")
        
        iterations = 0
        max_iterations = 15
        
        while iterations < max_iterations:
            print("\\n[THINKING] Agent is contemplating...")
            self._log_session("[THINKING]", "Calling LLM")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=TOOLS_SCHEMA,
                tool_choice="auto",
                temperature=0.1
            )
            
            msg = response.choices[0].message
            messages.append(msg)
            
            # If there's content but no tool calls, it's (hopefully) final answer
            if msg.content:
                self._log_session("[AGENT]", msg.content)
            
            if not msg.tool_calls:
                print(f"\\n[AGENT] {msg.content}")
                break
                
            for tool_call in msg.tool_calls:
                tool_name = tool_call.function.name
                
                try:
                    args = json.loads(tool_call.function.arguments)
                except:
                    args = {}
                
                print(f"[TOOL CALL] {tool_name} {args}")
                self._log_session("[TOOL CALL]", f"{tool_name} {args}")
                
                result = self.tools_executor.invoke_tool(tool_name, args)
                result_str = json.dumps(result, default=str)
                
                trunc_len = 400
                display_res = result_str if len(result_str) <= trunc_len else result_str[:trunc_len] + "..."
                print(f"[TOOL RESULT] {display_res}")
                self._log_session("[TOOL RESULT]", display_res)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_name,
                    "content": result_str
                })
                
            iterations += 1
            
        if iterations >= max_iterations:
            s = "\\n[AGENT] Reached maximum iterations (15). Terminating loop."
            print(s)
            self._log_session("[AGENT]", s)

    def run_query_api(self, user_query):
        messages = [
            {"role": "system", "content": self._get_system_prompt()},
            {"role": "user", "content": user_query}
        ]
        
        self._log_session("--- NEW API SESSION ---", f"User Query: {user_query}")
        
        iterations = 0
        max_iterations = 15
        steps = []
        
        while iterations < max_iterations:
            steps.append({"type": "thinking", "content": "Agent is contemplating..."})
            self._log_session("[THINKING]", "Calling LLM")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=TOOLS_SCHEMA,
                tool_choice="auto",
                temperature=0.1
            )
            
            msg = response.choices[0].message
            messages.append(msg)
            
            if msg.content:
                steps.append({"type": "agent", "content": msg.content})
                self._log_session("[AGENT]", msg.content)
            
            if not msg.tool_calls:
                break
                
            for tool_call in msg.tool_calls:
                tool_name = tool_call.function.name
                try:
                    args = json.loads(tool_call.function.arguments)
                except:
                    args = {}
                
                steps.append({"type": "tool_call", "tool_name": tool_name, "args": args})
                self._log_session("[TOOL CALL]", f"{tool_name} {args}")
                
                result = self.tools_executor.invoke_tool(tool_name, args)
                result_str = json.dumps(result, default=str)
                
                trunc_len = 400
                display_res = result_str if len(result_str) <= trunc_len else result_str[:trunc_len] + "..."
                steps.append({"type": "tool_result", "tool_name": tool_name, "result": display_res})
                self._log_session("[TOOL RESULT]", display_res)
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_name,
                    "content": result_str
                })
                
            iterations += 1
            
        if iterations >= max_iterations:
            steps.append({"type": "agent", "content": "Reached maximum iterations (15). Terminating loop."})
            self._log_session("[AGENT]", "Reached max iterations.")
            
        return steps
