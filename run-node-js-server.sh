#!/bin/bash
# Set the path to your Node.js server file and log file
NODE_SERVER="/home/dathh/public_html/nodejs-azure-pod-remote-cli/server.js"
LOG_FILE="/home/dathh/public_html/nodejs-azure-pod-remote-cli/server.log"

# Change directory to where the Node.js server is located
cd "$(dirname "$NODE_SERVER")" || exit

# Start the Node.js server in the background, redirecting output to the log file
node "$(basename "$NODE_SERVER")" > "$LOG_FILE" 2>&1 &

# (Optional) Save the process ID of the Node.js server
echo $! > node_server.pid

# Monitor the log file in real time
tail -f "$LOG_FILE"

