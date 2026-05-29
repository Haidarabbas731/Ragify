#!/usr/bin/env python3
"""
Start Milvus Lite server once and write its URI to a file.
Keeps running so the server stays alive for the API + ARQ worker processes.
"""
import os
import signal
import sys

data_dir = sys.argv[1] if len(sys.argv) > 1 else "./milvus_data/ragify.db"
uri_file = sys.argv[2] if len(sys.argv) > 2 else "/tmp/milvus_lite_uri"

os.makedirs(data_dir, exist_ok=True)

from milvus_lite.server_manager import server_manager_instance  # noqa: E402

uri = server_manager_instance.start_and_get_uri(data_dir)

with open(uri_file, "w") as f:
    f.write(uri)

print(f"Milvus Lite server started at: {uri}", flush=True)

# Keep process alive — server runs in background threads within this process
try:
    signal.pause()
except (KeyboardInterrupt, SystemExit):
    pass
