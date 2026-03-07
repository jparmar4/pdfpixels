#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MODEL_DIR="$ROOT_DIR/models/face"
MODEL_PATH="$MODEL_DIR/ultraface-rfb-320.onnx"
URL="https://github.com/onnx/models/raw/main/validated/vision/body_analysis/ultraface/models/version-RFB-320.onnx"

mkdir -p "$MODEL_DIR"

echo "Downloading UltraFace model..."
curl -L "$URL" -o "$MODEL_PATH"

echo "Saved: $MODEL_PATH"
echo "Set env: FACE_ONNX_MODEL_PATH=$MODEL_PATH"
echo "Optional: FACE_ONNX_MODEL_TYPE=ultraface"
