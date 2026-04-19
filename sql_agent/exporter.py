import csv
import os

def export_to_csv(db_manager, sql, filename):
    """Executes a SELECT query and writes the result to a CSV file."""
    result = db_manager.execute_query(sql)
    
    if isinstance(result, dict) and "error" in result:
        return result
        
    if not result:
        return {"success": False, "error": "Query returned no data to export."}

    try:
        keys = result[0].keys()
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(result)
        return {"success": True, "filepath": os.path.abspath(filename), "row_count": len(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}
