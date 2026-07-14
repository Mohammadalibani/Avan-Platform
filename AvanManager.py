#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
import socket
import threading
import time
import json
import sqlite3
import shutil
import webbrowser
from datetime import datetime

# تنظیم UTF-8 برای ویندوز
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

CONFIG_FILE = "avan_config.json"
DB_PATH = "instance/avan_system.db"
LOG_FILE = "logs/avan_manager.log"

# ترجمه منو به انگلیسی و فارسی مختلط
MENU_TEXTS = {
    'title': '===> Avan Personnel Management System <===',
    'status_on': '[ RUNNING ]',
    'status_off': '[ STOPPED ]',
    'start': '[1] START - Run System',
    'stop': '[2] STOP - Stop System',
    'restart': '[3] RESTART - Restart System',
    'change_ip': '[4] CHANGE IP - Change IP Address',
    'change_port': '[5] CHANGE PORT - Change Port',
    'status': '[6] STATUS - Show Status',
    'browser': '[7] BROWSER - Open in Browser',
    'log': '[8] LOG - View Log',
    'backup': '[9] BACKUP - Manual Backup',
    'exit': '[0] EXIT - Exit',
    'select': 'Select option (0-9): '
}

class AvanManager:
    def __init__(self):
        self.process = None
        self.is_running = False
        self.config = self.load_config()
        self.create_required_folders()
    
    def create_required_folders(self):
        folders = ["logs", "instance", "backups", "static/uploads"]
        for folder in folders:
            if not os.path.exists(folder):
                os.makedirs(folder)
    
    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "base_url": self.get_local_ip(),
            "port": 5000,
            "debug": False,
            "auto_start": False,
            "python_path": "venv\\Scripts\\python.exe" if os.name == 'nt' else "venv/bin/python"
        }
    
    def save_config(self):
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)
    
    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def update_ip_in_database(self, new_ip):
        try:
            if os.path.exists(DB_PATH):
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("UPDATE settings SET value = ? WHERE key = 'base_url'", (new_ip,))
                if cursor.rowcount == 0:
                    cursor.execute("INSERT INTO settings (key, value) VALUES ('base_url', ?)", (new_ip,))
                conn.commit()
                conn.close()
                return True
        except Exception as e:
            self.log(f"DB update error: {e}")
        return False
    
    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_msg = f"[{timestamp}] {message}"
        print(log_msg)
        try:
            with open(LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(log_msg + "\n")
        except:
            pass
    
    def start_server(self):
        if self.is_running:
            self.log("[OK] Server is already running!")
            return False
        
        if os.path.exists(self.config["python_path"]):
            python_exe = self.config["python_path"]
        else:
            python_exe = "python"
        
        try:
            self.process = subprocess.Popen(
                [python_exe, "run_production.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0,
                text=True
            )
            
            time.sleep(2)
            
            if self.process.poll() is None:
                self.is_running = True
                self.log(f"[OK] Server started successfully!")
                self.log(f"[URL] http://{self.config['base_url']}:{self.config['port']}")
                return True
            else:
                stderr = self.process.stderr.read()
                self.log(f"[ERROR] Failed to start: {stderr}")
                return False
                
        except Exception as e:
            self.log(f"[ERROR] {e}")
            return False
    
    def stop_server(self):
        if not self.is_running or self.process is None:
            self.log("[WARN] Server is not running!")
            return False
        
        try:
            self.process.terminate()
            for _ in range(10):
                if self.process.poll() is not None:
                    break
                time.sleep(0.5)
            
            if self.process.poll() is None:
                self.process.kill()
            
            self.is_running = False
            self.process = None
            self.log("[OK] Server stopped")
            return True
            
        except Exception as e:
            self.log(f"[ERROR] {e}")
            return False
    
    def change_ip(self, new_ip):
        if not new_ip:
            self.log("[ERROR] Invalid IP!")
            return False
        
        old_ip = self.config["base_url"]
        self.config["base_url"] = new_ip
        self.save_config()
        self.update_ip_in_database(new_ip)
        
        self.log(f"[OK] IP changed from {old_ip} to {new_ip}")
        
        if self.is_running:
            self.log("[WARN] Restart server to apply changes")
        
        return True
    
    def change_port(self, new_port):
        try:
            new_port = int(new_port)
            if new_port < 1 or new_port > 65535:
                self.log("[ERROR] Port must be 1-65535")
                return False
        except:
            self.log("[ERROR] Invalid port!")
            return False
        
        old_port = self.config["port"]
        self.config["port"] = new_port
        self.save_config()
        
        self.log(f"[OK] Port changed from {old_port} to {new_port}")
        
        if self.is_running:
            self.log("[WARN] Restart server to apply changes")
        
        return True
    
    def show_status(self):
        status = "RUNNING" if self.is_running else "STOPPED"
        self.log(f"Status: {status}")
        self.log(f"IP: {self.config['base_url']}")
        self.log(f"Port: {self.config['port']}")
        
        if self.is_running:
            self.log(f"URL: http://{self.config['base_url']}:{self.config['port']}")
    
    def open_browser(self):
        if self.is_running:
            url = f"http://{self.config['base_url']}:{self.config['port']}"
            webbrowser.open(url)
            self.log(f"[OK] Browser opened: {url}")
        else:
            self.log("[WARN] Start server first!")
    
    def show_log(self):
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print("\n" + "="*50)
                print("Last 20 log entries:")
                print("="*50)
                for line in lines[-20:]:
                    print(line.strip())
        else:
            print("No log file found")
    
    def create_backup(self):
        if os.path.exists(DB_PATH):
            backup_name = f"backups/avan_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
            shutil.copy2(DB_PATH, backup_name)
            self.log(f"[OK] Backup created: {backup_name}")
        else:
            self.log("[ERROR] Database not found")
    
    def show_menu(self):
        os.system('cls' if os.name == 'nt' else 'clear')
        print("=" * 50)
        print("     Avan Personnel Management System")
        print("=" * 50)
        
        status_symbol = "[RUNNING]" if self.is_running else "[STOPPED]"
        print(f" Status: {status_symbol}")
        print(f" IP: {self.config['base_url']}")
        print(f" Port: {self.config['port']}")
        print(f" URL: http://{self.config['base_url']}:{self.config['port']}")
        print("=" * 50)
        print(" [1] START - Run System")
        print(" [2] STOP - Stop System")
        print(" [3] RESTART - Restart System")
        print(" [4] CHANGE IP - Change IP Address")
        print(" [5] CHANGE PORT - Change Port")
        print(" [6] STATUS - Show Status")
        print(" [7] BROWSER - Open in Browser")
        print(" [8] LOG - View Log")
        print(" [9] BACKUP - Manual Backup")
        print(" [0] EXIT")
        print("=" * 50)

def main():
    manager = AvanManager()
    
    while True:
        try:
            manager.show_menu()
            choice = input("\n Select option (0-9): ").strip()
            
            if choice == '1':
                manager.start_server()
            elif choice == '2':
                manager.stop_server()
            elif choice == '3':
                manager.stop_server()
                time.sleep(1)
                manager.start_server()
            elif choice == '4':
                print("\n" + "="*40)
                print("Change IP Address")
                print("="*40)
                new_ip = input(f" New IP (Enter for {manager.get_local_ip()}): ").strip()
                if not new_ip:
                    new_ip = manager.get_local_ip()
                manager.change_ip(new_ip)
                input("\n Press Enter to continue...")
            elif choice == '5':
                print("\n" + "="*40)
                print("Change Port")
                print("="*40)
                new_port = input(" New port (default 5000): ").strip()
                if not new_port:
                    new_port = "5000"
                manager.change_port(new_port)
                input("\n Press Enter to continue...")
            elif choice == '6':
                manager.show_status()
                input("\n Press Enter to continue...")
            elif choice == '7':
                manager.open_browser()
                input("\n Press Enter to continue...")
            elif choice == '8':
                manager.show_log()
                input("\n Press Enter to continue...")
            elif choice == '9':
                manager.create_backup()
                input("\n Press Enter to continue...")
            elif choice == '0':
                if manager.is_running:
                    print("\nStopping server...")
                    manager.stop_server()
                print("\nGoodbye!")
                break
            else:
                print("\n[ERROR] Invalid option!")
                time.sleep(1)
                
        except KeyboardInterrupt:
            if manager.is_running:
                manager.stop_server()
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"\n[ERROR] {e}")
            time.sleep(2)

if __name__ == "__main__":
    main()