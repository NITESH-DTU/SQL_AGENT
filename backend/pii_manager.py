import re

PII_KEYWORDS = {
    'email': r'email|mail|addr',
    'phone': r'phone|mobile|tel|contact',
    'ssn': r'ssn|social_security|national_id',
    'credit_card': r'cc|credit_card|card_no|card_number|pan',
    'dob': r'dob|birth|date_of_birth',
    'password': r'password|pwd|secret|token|key',
    'personal': r'address|street|city|zip|postal'
}

def identify_pii_columns(columns):
    """Identifies which columns likely contain PII based on their names."""
    pii_cols = []
    for col in columns:
        col_lower = col.lower()
        for pii_type, pattern in PII_KEYWORDS.items():
            if re.search(pattern, col_lower):
                pii_cols.append(col)
                break
    return pii_cols

def mask_rows(rows, pii_columns):
    """Replaces values in PII columns with masked strings."""
    if not pii_columns:
        return rows
        
    masked_rows = []
    for row in rows:
        new_row = dict(row)
        for col in pii_columns:
            if col in new_row and new_row[col] is not None:
                val = str(new_row[col])
                if '@' in val: # Email masking
                    parts = val.split('@')
                    new_row[col] = f"{parts[0][0]}***@{parts[1]}" if len(parts[0]) > 0 else "***@***"
                else:
                    new_row[col] = "***"
        masked_rows.append(new_row)
    return masked_rows
