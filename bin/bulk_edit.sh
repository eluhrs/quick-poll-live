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

# Ensure container is running
if ! docker ps | grep -q poll_backend; then
    echo "Error: Backend container 'poll_backend' is not running."
    echo "Please run 'docker compose up -d' first."
    exit 1
fi

# Embedded Python Script
# We store it in a variable to allow passing it via -c argument
# This allows us to use stdin for data piping instead of script source
PY_SCRIPT=$(cat << 'PYTHON_EOF'
import sys
import json
import argparse
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
import os

# Helper to read/write
def write_output(data, filename):
    # Always print to stdout if no filename or explicit "-"
    # The shell wrapper handles redirection to actual file on host
    if not filename or filename == "-":
        print(json.dumps(data, indent=4))
    else:
        # Fallback if run manually inside container
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        sys.stderr.write(f"Successfully exported to {filename}\n")

def read_input(filename):
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
PYTHON_EOF
)

# Helper function to execute python script via docker exec using -c
run_python() {
    # arguments passed to this function are passed to python script
    docker exec -i -e PYTHONPATH=/app poll_backend python -c "$PY_SCRIPT" "$@"
}

CMD=$1
arg2=$2
arg3=$3

if [ "$CMD" == "export" ]; then
    if [ -z "$arg2" ]; then
        echo "Error: export requires a poll slug."
        echo "Usage: $0 export <slug> [filename.json]"
        exit 1
    fi
    
    # Check if filename is provided (arg3)
    if [ -n "$arg3" ]; then
        # Run python export with no filename arg (prints to stdout)
        # Capture stdout to host file
        # Note: We pass "-" as filename arg just in case, or omit it. 
        # Python script says nargs="?", so verifying we pass NO arg for filename.
        run_python export "$arg2" > "$arg3"
    else
        # No filename, just output to stdout
        run_python export "$arg2"
    fi

elif [ "$CMD" == "import" ]; then
    if [ -z "$arg2" ]; then
        echo "Error: import requires a filename."
        echo "Usage: $0 import <filename.json>"
        exit 1
    fi

    # Check if file exists on host
    if [ ! -f "$arg2" ]; then
        echo "Error: File '$arg2' not found on host."
        exit 1
    fi

    # Read host file and pipe to python, passing "-" as filename argument
    cat "$arg2" | run_python import -

else
    # Allow other commands or help
    run_python "$@"
fi
