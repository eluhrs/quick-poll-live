import sys
import json
import argparse
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def export_poll(slug: str, filename: str):
    db: Session = SessionLocal()
    try:
        poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
        if not poll:
            print(f"Error: Poll with slug '{slug}' not found.")
            return

        data = {
            "id": poll.id,
            "title": poll.title,
            "slug": poll.slug,
            "questions": []
        }

        # Sort questions by order
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

        if not filename:
            filename = f"{slug}_export.json"

        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        
        print(f"Successfully exported poll '{slug}' to {filename}")

    finally:
        db.close()

def import_poll(filename: str):
    db: Session = SessionLocal()
    try:
        with open(filename, 'r') as f:
            data = json.load(f)

        slug = data.get("slug")
        if not slug:
            print("Error: Invalid JSON format. Missing 'slug'.")
            return

        poll = db.query(models.Poll).filter(models.Poll.slug == slug).first()
        if not poll:
            print(f"Error: Poll with slug '{slug}' not found in database. Cannot update.")
            return

        print(f"Updating Poll: {poll.title} -> {data.get('title')}")
        poll.title = data.get("title", poll.title)

        existing_questions = {q.id: q for q in poll.questions}
        
        for q_data in data.get("questions", []):
            q_id = q_data.get("id")
            if q_id and q_id in existing_questions:
                # Update existing question
                question = existing_questions[q_id]
                question.text = q_data.get("text", question.text)
                question.question_type = q_data.get("type", question.question_type) # Be careful with type changes if they affect options
                question.order = q_data.get("order", question.order)
                
                # Update Options
                existing_options = {opt.id: opt for opt in question.options}
                for opt_data in q_data.get("options", []):
                    opt_id = opt_data.get("id")
                    if opt_id and opt_id in existing_options:
                        # Update existing option
                        option = existing_options[opt_id]
                        option.text = opt_data.get("text", option.text)
                    else:
                        # Create new option (if desired, though usually this script is for editing existing text)
                        print(f"Warning: Found new option in JSON (text: {opt_data.get('text')}) without ID. Skipping creation to be safe.")
            else:
                 print(f"Warning: Question ID {q_id} not found in database. Skipping.")

        db.commit()
        print(f"Successfully imported updates for poll '{slug}'")

    except Exception as e:
        db.rollback()
        print(f"Error during import: {e}")
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
