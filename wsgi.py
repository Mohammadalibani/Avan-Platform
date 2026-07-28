# wsgi.py
"""
WSGI entry point for production servers (Gunicorn, uWSGI, etc.)
Usage: gunicorn wsgi:app
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()