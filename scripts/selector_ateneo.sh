#!/bin/bash
# =============================================================
# selector_ateneo.sh — Valencianismo Radio
# Invoca al selector dinámico en Python
# =============================================================

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Ejecutar el selector de Python
python3 "$SCRIPT_DIR/selector_ateneo.py" "$@"
