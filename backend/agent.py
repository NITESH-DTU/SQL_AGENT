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
    def __init__(self, db_manager, active_tables):
        self.db_manager = db_manager
        self.active_tables = active_tables
        self.tools_executor = AgentTools(db_manager, active_tables)
        
        # Use OpenAI SDK pointed at Groq
        api_key = os.getenv("GROQ_API_KEY")
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=api_key
        )
        self.model = "llama-3.3-70b-versatile"

    def _get_system_prompt(self):
        return f"""You are an autonomous SQL Data Engineer.
Active tables: {self.active_tables}
Database type: {self.db_manager.db_type}
Database name: {self.db_manager.db_name}

You do not ask for permission — you act, analyze, and continue until the task is complete.

Output Structure Rules:
1. **Always** use Markdown tables for data results.
2. **Always** structure your final answer with clear headings:
   - ### 📊 Analysis Overview
   - ### 🛠️ Actions Taken
   - ### 📝 Results Summary
3. **If** you are exporting data, provide a download link or confirmation.
4. **Be Concise**: Do not repeat the user's question. Focus on the data insights.
5. **Self-Correction**: If a tool fails or a guardrail blocks you, analyze why and try a different approach (e.g., query a different table, check schema again)."""

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
        
        while iterations < max_iterations:
            # Send status update
            yield {"type": "status", "content": f"Agent is thinking...", "iteration": iterations + 1}
            
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOLS_SCHEMA,
                    tool_choice="auto",
                    temperature=0.1
                )
            except Exception as e:
                yield {"type": "error", "message": f"LLM Error: {str(e)}"}
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
                result = self.tools_executor.invoke_tool(tool_name, args)
                result_str = json.dumps(result, default=str)
                
                # Notify frontend of result
                yield {"type": "tool_result", "tool": tool_name, "result": result_str}
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
