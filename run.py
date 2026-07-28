# run.py
import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app import create_app

app = create_app()

if __name__ == '__main__':
    # ===== تنظیم IP و پورت =====
    host = '10.86.109.205'  # ← IP ثابت
    port = 5000  # ← پورت Backend
    
    print(f'🚀 Avan Platform running on http://{host}:{port}')
    print(f'📊 Phase: 15 - Production Ready')
    
    app.run(
        host=host,
        port=port,
        debug=False  # ← در Production False باشد
    )