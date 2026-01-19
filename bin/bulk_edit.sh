#!/bin/bash

# Wrapper script to run the bulk editor (embedded python)
# Usage: ./bin/bulk_edit.sh [export|import] [args...]

if [ $# -eq 0 ]; then
    echo "Usage: $0 [export|import] [arguments...]"
    echo ""
    echo "Examples:"
    echo "  $0 export <poll_slug> <filename.json>"
    echo "  $0 import <filename.json>"
    exit 1
fi

# Determine if we should forward stdin (only for pipe operations, rarely used here but good practice)
# Actually, the user provides filenames which are HOST filenames.
# This script has a complexity: The python script expects to read/write files.
# If running inside docker, it can only see container files.
# Strategy: 
#   Export: Run python, output JSON to stdout, capture in shell.
#   Import: Read file in shell, pass to python via stdin? Or copy file?
#   The previous `bulk_editor.py` took filenames as arguments.
#   If we embed it, we must ensure file paths are handled correctly.

# Let's adjust the python script (in the HEREDOC) to support reading/writing from/to stdout/stdin if filename is "-" 
# or keep it simple: Map current directory? No, avoiding complex mounts.

# Simplified Approach for Single Script:
# 1. Export: Python prints JSON to stdout (if no filename arg or special arg). Shell redirects to file.
# 2. Import: Shell reads file, pipes to Python stdin.

# But the original script `bulk_editor.py` used args: `export slug [filename]` and `import filename`.
# To make this seamless without changing arguments too much:

# EXPORT:
# If command is export, we run python with arguments. 
# But python is running in container. It cannot write to host filesystem directly unless mounted.
# The `bin/` dir is mounted. If user writes to `bin/output.json`, it works.
# But user might want current dir.
# Solution: 
#   If exporting, instruct python to print to stdout. Capture output in bash and write to file.
#   If importing, instruct python to read from stdin. Cat file in bash and pipe to python.

# Let's Modify the Embedded Python Script slightly to handle "stdin/stdout" if filename is missing or special.

# ... Logic below updates the python script to check for stdin/stdout usage ...

# COMMAND ARGUMENT HANDLING
CMD=$1
shift
ARGS="$@"

# Execute
docker exec -i -e PYTHONPATH=/app poll_backend python - $CMD $ARGS << 'EOF'
import sys
import json
import argparse
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
import os

# Helper to read/write
def write_output(data, filename):
    # If filename is provided, try to write to it (inside container).
    # Ideally we just print to stdout if it's meant for the user on host.
    # But since we are piping this script into python, standard print() might be mixed with execution logs if we are not careful.
    # We should print JSON to stdout and logs to stderr.
    if filename:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        sys.stderr.write(f"Successfully exported to {filename} (inside container)\n")
    else:
        print(json.dumps(data, indent=4))

def read_input(filename):
    # If filename matches a file in container, read it.
    # If filename is "-", read stdin.
    if filename == "-" or not filename:
        return json.load(sys.stdin)
    with open(filename, 'r') as f:
        return json.load(f)

def export_poll(slug: str, filename: str):
    db: Session = SessionLocal()
    try:
        poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
        if not poll:
            sys.stderr.write(f"Error: Poll with slug '{slug}' not found.\n")
            return

        data = {
            "id": poll.id,
            "title": poll.title,
            "slug": poll.slug,
            "questions": []
        }

        # Sort questions
        sorted_questions = sorted(poll.questions, key=lambda q: q.order)

        for q in sorted_questions:
            q_data = {
                "id": q.id,
                "text": q.text,
                "type": q.question_type,
                "order": q.order,
                "options": []
            }
            
            for opt in q.options:
                q_data["options"].append({
                    "id": opt.id,
                    "text": opt.text
                })
            
            data["questions"].append(q_data)

        write_output(data, filename)

    finally:
        db.close()

def import_poll(filename: str):
    db: Session = SessionLocal()
    try:
        data = read_input(filename)

        slug = data.get("slug")
        if not slug:
            sys.stderr.write("Error: Invalid JSON format. Missing 'slug'.\n")
            return

        poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
        if not poll:
            sys.stderr.write(f"Error: Poll with slug '{slug}' not found.\n")
            return

        sys.stderr.write(f"Updating Poll: {poll.title} -> {data.get('title')}\n")
        poll.title = data.get("title", poll.title)

        existing_questions = {q.id: q for q in poll.questions}
        
        for q_data in data.get("questions", []):
            q_id = q_data.get("id")
            if q_id and q_id in existing_questions:
                question = existing_questions[q_id]
                question.text = q_data.get("text", question.text)
                question.question_type = q_data.get("type", question.question_type)
                question.order = q_data.get("order", question.order)
                
                existing_options = {opt.id: opt for opt in question.options}
                for opt_data in q_data.get("options", []):
                    opt_id = opt_data.get("id")
                    if opt_id and opt_id in existing_options:
                        option = existing_options[opt_id]
                        option.text = opt_data.get("text", option.text)

        db.commit()
        sys.stderr.write(f"Successfully imported updates for poll '{slug}'\n")

    except Exception as e:
        db.rollback()
        sys.stderr.write(f"Error during import: {e}\n")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk Poll Editor")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Export Command
    export_parser = subparsers.add_parser("export", help="Export a poll to JSON")
    export_parser.add_argument("slug", help="The slug of the poll to export")
    export_parser.add_argument("filename", nargs="?", help="Output filename (optional)")

    # Import Command
    import_parser = subparsers.add_parser("import", help="Import a poll from JSON")
    import_parser.add_argument("filename", help="Input filename")

    args = parser.parse_args()

    if args.command == "export":
        export_poll(args.slug, args.filename)
    elif args.command == "import":
        import_poll(args.filename)
    else:
        parser.print_help()
EOF
