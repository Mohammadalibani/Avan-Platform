# run.py
import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app import create_app

# Create application instance
app = create_app()

if __name__ == '__main__':
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f'🚀 Avan Platform running on http://{host}:{port}')
    print(f'📊 Phase: 8 - Complete REST API')
    
    app.run(
        host=host,
        port=port,
        debug=debug
    )