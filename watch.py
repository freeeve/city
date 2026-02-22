"""File watcher that restarts server and client on code changes."""
import subprocess
import sys
import time
import os

WATCH_DIR = os.path.dirname(os.path.abspath(__file__))
EXTENSIONS = {'.py'}
IGNORE = {'watch.py', '__pycache__'}

def get_mtimes():
    mtimes = {}
    for f in os.listdir(WATCH_DIR):
        if f in IGNORE or not any(f.endswith(ext) for ext in EXTENSIONS):
            continue
        path = os.path.join(WATCH_DIR, f)
        if os.path.isfile(path):
            mtimes[path] = os.path.getmtime(path)
    return mtimes

def kill_proc(proc):
    if proc and proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

def main():
    server_proc = None
    client_proc = None

    run_client = '--no-client' not in sys.argv

    def start():
        nonlocal server_proc, client_proc
        print("Starting server...")
        server_proc = subprocess.Popen([sys.executable, os.path.join(WATCH_DIR, 'server.py')])
        if run_client:
            time.sleep(0.5)
            print("Starting client...")
            client_proc = subprocess.Popen([sys.executable, os.path.join(WATCH_DIR, 'client.py')])

    def restart():
        nonlocal server_proc, client_proc
        print("\nFile changed — restarting...")
        kill_proc(client_proc)
        kill_proc(server_proc)
        time.sleep(0.5)
        start()

    start()
    last_mtimes = get_mtimes()

    try:
        while True:
            time.sleep(1)
            current = get_mtimes()
            if current != last_mtimes:
                changed = [os.path.basename(f) for f in current
                           if current.get(f) != last_mtimes.get(f)]
                if changed:
                    print(f"Changed: {', '.join(changed)}")
                last_mtimes = current
                restart()
    except KeyboardInterrupt:
        print("\nStopping...")
        kill_proc(client_proc)
        kill_proc(server_proc)

if __name__ == '__main__':
    main()
