import os
from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import io
# Removed tensorflow and tensorflow_hub imports as we're switching to Ultralytics YOLO
from ultralytics import YOLO # NEW: Import YOLO from ultralytics
import logging
import asyncio # For running async model loading

# Suppress most logging from ultralytics and other libraries to keep console clean
logging.getLogger('ultralytics').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
# logging.getLogger('tensorflow').setLevel(logging.ERROR) # In case any TF dependency tries to log

app = Flask(__name__)

# Global variable to hold the loaded YOLOv8 model
yolo_model = None

# --- Model Loading Function ---
async def load_yolo_model():
    global yolo_model
    try:
        # Load a pre-trained YOLOv8n model (YOLOv8 nano - smallest, fastest)
        # This will download the model weights (e.g., yolov8n.pt) the first time.
        # You can experiment with 'yolov8s.pt' (small), 'yolov8m.pt' (medium) etc. for more accuracy,
        # but they will be larger and slower. 'n' is good for testing balance.
        yolo_model = YOLO('yolov8n.pt')
        app.logger.info("YOLOv8n model loaded successfully!")
    except Exception as e:
        app.logger.error(f"Failed to load YOLOv8 model: {e}", exc_info=True)
        # Exit or raise error if model cannot be loaded

# --- API Endpoint for Image Analysis ---
@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if yolo_model is None:
        return jsonify({'message': 'AI model is not loaded yet. Please try again in a moment.'}), 503

    if 'image' not in request.files:
        return jsonify({'message': 'No image file provided in the request.'}), 400

    image_file = request.files['image']
    if not image_file.filename:
        return jsonify({'message': 'No image file provided.'}), 400

    try:
        # Read image file into bytes
        img_bytes = io.BytesIO(image_file.read()).getvalue() # Get value to ensure bytes format

        # --- RE-ADDED: Open bytes as PIL Image and convert to RGB ---
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        # -------------------------------------------------------------

        # Perform inference using the loaded YOLO model
        # source=img: Pass the PIL Image object directly to YOLO
        results = yolo_model(source=img, conf=0.5, iou=0.7, imgsz=640, verbose=False)

        final_detections = []
        # YOLOv8 returns a list of Results objects (one per image in batch)
        for r in results:
            # Iterate through each detected box
            for box in r.boxes:
                class_id = int(box.cls[0]) # Class ID (e.g., 0 for person, 1 for bicycle)
                confidence = float(box.conf[0]) # Confidence score
                # Bounding box coordinates in pixels, format xmin, ymin, xmax, ymax
                # box.xyxy[0].tolist() gives [xmin, ymin, xmax, ymax]
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # Filter by a confidence threshold
                if confidence > 0.5: # Only include detections with over 50% confidence
                    final_detections.append({
                        'className': yolo_model.names[class_id], # Get human-readable label using model's names attribute
                        'probability': confidence,
                        'box': {
                            'left': float(x1),
                            'top': float(y1),
                            'right': float(x2),
                            'bottom': float(y2)
                        }
                    })

        app.logger.info(f"Image analyzed by Python AI. Detections: {len(final_detections)}")

        return jsonify({
            'message': 'Image analyzed successfully by Python AI (YOLOv8 Object Detection)!',
            'detections': final_detections,
            'fileName': image_file.filename
        })

    except Exception as e:
        app.logger.error(f"Error processing image or making prediction in Python AI: {e}", exc_info=True)
        return jsonify({'message': f'Failed to analyze image with Python AI. Error: {e}'}), 500

# --- Main execution block ---
if __name__ == '__main__':
    # Use asyncio to load the model because model loading can be an async operation
    asyncio.run(load_yolo_model())
    app.run(host='0.0.0.0', port=5001, debug=True)