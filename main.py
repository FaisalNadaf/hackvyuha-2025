import cv2
import time
import numpy as np
from pymongo import MongoClient
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from desk_zones import get_desk_zones
from utils import is_inside_polygon, draw_text, draw_zones
import datetime

# Load YOLOv8 model
model = YOLO("yolov8s.pt")
tracker = DeepSort(max_age=30)

# Config
MOVEMENT_THRESHOLD = 15
MOVEMENT_WINDOW = 1.0
DESK_ZONES = get_desk_zones()

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["productivity_tracker"]
collection = db["person_data"]

# Memory tracking
person_desk_timers = {}
person_movement_states = {}

def main():
    cap = cv2.VideoCapture('/home/faisal/Videos/demo.mp4')
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame, verbose=False)[0]
        detections = []
        for box, conf, cls in zip(results.boxes.xyxy, results.boxes.conf, results.boxes.cls):
            if int(cls) == 0 and conf > 0.4:
                x1, y1, x2, y2 = map(int, box)
                detections.append(([x1, y1, x2 - x1, y2 - y1], float(conf), 'person'))

        tracks = tracker.update_tracks(detections, frame=frame)
        current_time = time.time()

        for track in tracks:
            if not track.is_confirmed():
                continue

            track_id = track.track_id
            x1, y1, x2, y2 = map(int, track.to_ltrb())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

            # Init desk data
            if track_id not in person_desk_timers:
                person_desk_timers[track_id] = {
                    desk: {'entry_time': 0, 'total_time': 0, 'in_zone': False}
                    for desk in DESK_ZONES
                }

            # Init movement data
            if track_id not in person_movement_states:
                person_movement_states[track_id] = {
                    'movement_history': [],
                    'current_state': None,
                    'state_entry_time': current_time,
                    'total_moving': 0,
                    'total_sitting': 0
                }
            movement_data = person_movement_states[track_id]

            # Movement tracking
            movement_data['movement_history'].append((cx, cy, current_time))
            movement_data['movement_history'] = [
                entry for entry in movement_data['movement_history']
                if current_time - entry[2] <= MOVEMENT_WINDOW
            ]
            speed = 0
            if len(movement_data['movement_history']) >= 2:
                dx = movement_data['movement_history'][-1][0] - movement_data['movement_history'][0][0]
                dy = movement_data['movement_history'][-1][1] - movement_data['movement_history'][0][1]
                time_diff = movement_data['movement_history'][-1][2] - movement_data['movement_history'][0][2]
                if time_diff > 0:
                    speed = (dx**2 + dy**2)**0.5 / time_diff

            new_state = 'moving' if speed > MOVEMENT_THRESHOLD else 'sitting'
            if movement_data['current_state'] != new_state:
                if movement_data['current_state'] is not None:
                    elapsed = current_time - movement_data['state_entry_time']
                    if movement_data['current_state'] == 'moving':
                        movement_data['total_moving'] += elapsed
                    else:
                        movement_data['total_sitting'] += elapsed
                movement_data['current_state'] = new_state
                movement_data['state_entry_time'] = current_time

            label_lines = []
            for desk_name, polygon in DESK_ZONES.items():
                data = person_desk_timers[track_id][desk_name]
                inside = is_inside_polygon((cx, cy), polygon)
                if inside and not data['in_zone']:
                    data['entry_time'] = current_time
                    data['in_zone'] = True
                elif not inside and data['in_zone']:
                    data['total_time'] += current_time - data['entry_time']
                    data['in_zone'] = False
                total_time = data['total_time'] + (current_time - data['entry_time'] if data['in_zone'] else 0)
                if inside:
                    label_lines.append(f"{desk_name}: {int(total_time)}s")

            if movement_data['current_state']:
                live_state_time = current_time - movement_data['state_entry_time']
                total_state_time = movement_data[f'total_{movement_data["current_state"]}'] + live_state_time
                label_lines.append(f"{movement_data['current_state'].title()}: {int(total_state_time)}s")

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            y_label = y1 - 10
            for line in label_lines:
                draw_text(frame, f"ID {track_id} - {line}", (x1, y_label), (0, 255, 255))
                y_label -= 20

        draw_zones(frame, DESK_ZONES)
        cv2.imshow("Productivity Tracker", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    # Final MongoDB Summary Save
    print("\nFinal Productivity Summary:")
    for track_id in person_desk_timers:
        summary = {
            "track_id": track_id,
            "timestamp": datetime.datetime.now(),
            "desks": {},
            "movement": {}
        }

        for desk, data in person_desk_timers[track_id].items():
            total = data['total_time']
            if data['in_zone']:
                total += time.time() - data['entry_time']
            summary["desks"][desk] = int(total)

        md = person_movement_states.get(track_id)
        moving = md['total_moving']
        sitting = md['total_sitting']
        if md['current_state'] == 'moving':
            moving += time.time() - md['state_entry_time']
        elif md['current_state'] == 'sitting':
            sitting += time.time() - md['state_entry_time']

        summary["movement"]["total_moving"] = int(moving)
        summary["movement"]["total_sitting"] = int(sitting)

        collection.insert_one(summary)
        print(f"\nPerson ID {track_id} summary saved to MongoDB.")

if __name__ == "__main__":
    main()
