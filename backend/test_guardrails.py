import sqlglot
from sqlglot import exp

queries = [
    "DROP TABLE users",
    "TRUNCATE TABLE users",
    "DELETE FROM users",
    "ALTER TABLE users ADD COLUMN age INT",
    "UPDATE users SET name = 'x'",
    "UPDATE users SET name = 'x' WHERE id = 1",
    "SELECT * FROM users"
]

def check(sql):
    try:
        expressions = sqlglot.parse(sql)
        for expression in expressions:
            print(f"\nQuery: {sql}")
            # 1. Block destructive operations
            forbidden_nodes = [exp.Drop, exp.TruncateTable, exp.Delete, exp.Alter]
            for node_type in forbidden_nodes:
                if any(isinstance(node, node_type) for node in expression.find_all(node_type)):
                    print(f"BLOCKED: {node_type.__name__}")
                    return True
            
            # 2. Update without WHERE
            for update in expression.find_all(exp.Update):
                if not update.args.get("where"):
                    print("BLOCKED: UPDATE without WHERE")
                    return True
        print("ALLOWED")
        return False
    except Exception as e:
        print(f"PARSE ERROR: {e}")
        return False

for q in queries:
    check(q)
