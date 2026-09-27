#!/bin/bash
# Compilation script for Smart Grid Load Balancer Java components
set -e

echo "[GridFlow Java Build] Compiling Java source files..."
mkdir -p bin
javac -d bin src/com/smartgrid/*.java
echo "[GridFlow Java Build] Compilation successful! Class files located in ./bin"
