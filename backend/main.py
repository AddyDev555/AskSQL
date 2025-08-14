from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import google.generativeai as genai
import os
import re
import sqlite3
import tempfile
import uuid
import json

app = Flask(__name__)
CORS(app)

def extract_schema(sql):
    # Remove code fences and leading/trailing whitespace
    sql = re.sub(r"```(?:sql)?", "", sql, flags=re.IGNORECASE).strip()
    # Extract database name
    db_match = re.search(r'CREATE DATABASE\s+([^\s;]+)', sql, re.IGNORECASE | re.MULTILINE)
    db_name = db_match.group(1) if db_match else None

    # Extract tables and columns with dtypes
    tables = []
    columns = {}
    for table_match in re.finditer(r'CREATE TABLE (\w+)\s*\((.*?)\);', sql, re.DOTALL | re.IGNORECASE):
        table_name = table_match.group(1)
        col_defs = table_match.group(2)
        col_list = []
        for col_line in col_defs.split(','):
            col_line = col_line.strip()
            if not col_line or col_line.upper().startswith(('PRIMARY', 'FOREIGN', 'UNIQUE', 'KEY', 'CONSTRAINT')):
                continue
            # Split by space to get column name and dtype
            parts = col_line.split()
            if len(parts) >= 2:
                col_name = parts[0]
                col_dtype = parts[1]
                col_list.append({'name': col_name, 'dtype': col_dtype})
        tables.append(table_name)
        columns[table_name] = col_list

    return [
        {
            'name': db_name,
            'tables': tables,
            'columns': columns
        }
    ]

def create_sqlite_db(sql_schema, db_name=None):
    # Remove all code fences and 'sql' tags
    cleaned_sql = re.sub(r"```(?:sql)?", "", sql_schema, flags=re.IGNORECASE).strip()
    
    # Remove CREATE DATABASE and USE statements
    cleaned_sql = re.sub(r'CREATE DATABASE.*?;', '', cleaned_sql, flags=re.IGNORECASE | re.DOTALL)
    cleaned_sql = re.sub(r'USE .*?;', '', cleaned_sql, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove comments and blank lines
    cleaned_sql = re.sub(r'--.*', '', cleaned_sql)  # Remove single-line comments
    cleaned_sql = re.sub(r'/\*.*?\*/', '', cleaned_sql, flags=re.DOTALL)  # Remove multi-line comments
    
    # Split into individual statements and clean each one
    statements = []
    current_statement = []
    
    for line in cleaned_sql.splitlines():
        line = line.strip()
        if not line:
            continue
            
        current_statement.append(line)
        if line.endswith(';'):
            full_statement = ' '.join(current_statement)
            # Only keep complete CREATE TABLE and valid INSERT statements
            if (full_statement.upper().startswith('CREATE TABLE') or 
                (full_statement.upper().startswith('INSERT INTO') and 
                 full_statement.count("'") % 2 == 0)):  # Check for balanced quotes
                statements.append(full_statement)
            current_statement = []

    # Join valid statements back together
    cleaned_sql = '\n'.join(statements)

    # Create new database file
    if db_name is None:
        db_name = f"{uuid.uuid4().hex}.db"
    db_path = os.path.join(tempfile.gettempdir(), db_name)
    
    # Remove existing file if it exists
    if os.path.exists(db_path):
        os.remove(db_path)

    # Create and populate database
    conn = sqlite3.connect(db_path)
    try:
        if cleaned_sql.strip():  # Only execute if we have SQL statements
            conn.executescript(cleaned_sql)
            conn.commit()
        else:
            print("Warning: No valid SQL statements to execute")
    except sqlite3.Error as e:
        print(f"SQLite Error: {e}")
        print(f"Failed SQL: {cleaned_sql}")
        raise
    finally:
        conn.close()

    return db_path

def gem(prompt):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash")
    response1 = model.generate_content(f"Provide a brief knowledge of the schema that will be developed here. prompt: {prompt}")    
    response = model.generate_content(f'''Generate SQL schema for: {prompt} (Note: Only provide the db schema also AUTO_INCREMENT = AUTO INCREMENT)''')
    output = response.text
    output_text = response1.text
    return output, output_text

@app.route("/process_prompt", methods=['POST'])
def process_prompt():
    data = request.get_json()
    try:
        if data.get('prompt'):
            output, output_text = gem(data['prompt'])
            schema = extract_schema(output)
            # Remove all code fences and 'sql' tags
            cleaned_output = re.sub(r"```(?:sql)?", "", output, flags=re.IGNORECASE).strip()
            db_file_path = create_sqlite_db(cleaned_output)

            # --- Store prompt and result in a local SQLite DB ---
            # Create a 'db' directory if it doesn't exist
            db_directory = os.path.join(os.path.dirname(__file__), 'db')
            if not os.path.exists(db_directory):
                os.makedirs(db_directory)

            # Use a permanent path for the logs database
            log_db_path = os.path.join(db_directory, "prompt_logs.db")
            conn = sqlite3.connect(log_db_path)
            try:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS prompt_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        token TEXT,
                        prompt TEXT,
                        gemini_message TEXT,
                        schema TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Convert token to string to avoid datatype issues
                token_value = str(data.get('token', '')) if data.get('token') is not None else ''
                
                # Convert schema to JSON string for better storage
                schema_json = json.dumps(schema) if schema else ''
                
                conn.execute(
                    "INSERT INTO prompt_logs (token, prompt, gemini_message, schema) VALUES (?, ?, ?, ?)",
                    (token_value, data['prompt'], output_text, schema_json)
                )
                conn.commit()
            except sqlite3.Error as db_error:
                print(f"Database error: {db_error}")
                # Log the error but don't fail the entire request
            finally:
                conn.close()
            # ---------------------------------------------------

            return jsonify({
                "data": {
                    "db_structure": schema,
                    "prompt": data['prompt'],
                    "gemini_message": output_text,
                    "db_file_path": db_file_path,
                    "schema": schema
                }
            })
        else:
            return jsonify({"error": "No prompt provided"}), 400
    except Exception as e:
        print(f"Error in process_prompt: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/download_db", methods=['GET'])
def download_db():
    db_file_path = request.args.get("path")
    if not db_file_path or not os.path.exists(db_file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(db_file_path, as_attachment=True, download_name="generated_schema.db")

# Add fetch-logs endpoint for specific token
@app.route("/fetch-logs", methods=['POST'])
def fetch_logs():
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({"error": "Token is required"}), 400
            
        db_directory = os.path.join(os.path.dirname(__file__), 'db')
        log_db_path = os.path.join(db_directory, "prompt_logs.db")
        
        if not os.path.exists(log_db_path):
            return jsonify({"logs": []})
        
        conn = sqlite3.connect(log_db_path)
        try:
            # Fetch logs for specific token
            cursor = conn.execute(
                "SELECT id, token, prompt, gemini_message, schema, created_at FROM prompt_logs WHERE token = ? ORDER BY created_at DESC", 
                (str(token),)
            )
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries for better JSON response
            logs = []
            for row in rows:
                log_entry = {
                    "id": row[0],
                    "token": row[1],
                    "prompt": row[2],
                    "gemini_message": row[3],
                    "schema": json.loads(row[4]) if row[4] else None,
                    "created_at": row[5]
                }
                logs.append(log_entry)
            
            return jsonify({"logs": logs, "count": len(logs)})
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Error in fetch_logs: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)