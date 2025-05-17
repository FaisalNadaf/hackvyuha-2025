import cv2
import time
import numpy as np
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from zones import get_zones
from database import store_productivity_data

# Load model and tracker
model = YOLO("yolov8n.pt")  # for better accuracy, use 'yolov8x.pt'
tracker = DeepSort(max_age=30)

# Constants
MOVEMENT_THRESHOLD = 5
MOVEMENT_WINDOW = 1.0
ZONES = get_zones()

person_zone_timers = {}
person_sitting_states = {}

def is_inside_polygon(point, polygon):
    return cv2.pointPolygonTest(np.array(polygon, dtype=np.int32), point, False) >= 0

def draw_text(img, text, pos, color=(255, 255, 255)):
    cv2.putText(img, text, pos, cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

def draw_zones(frame):
    for name, data in ZONES.items():
        pts = np.array(data["points"], np.int32).reshape((-1, 1, 2))
        cv2.polylines(frame, [pts], isClosed=True, color=(255, 0, 0), thickness=2)
        cv2.putText(frame, name, data["points"][0], cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

def main():
    cap = cv2.VideoCapture('/home/faisal/Videos/demo4.mp4')
    if not cap.isOpened():
        print("Error: Cannot open video")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model.predict(frame, verbose=False, conf=0.25)[0]
        detections = []

        for box, conf, cls in zip(results.boxes.xyxy, results.boxes.conf, results.boxes.cls):
            if int(cls) == 0 and conf > 0.25:  # person class
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

            # Initialize tracking dicts
            if track_id not in person_zone_timers:
                person_zone_timers[track_id] = {
                    name: {'entry_time': 0, 'total_time': 0, 'in_zone': False}
                    for name in ZONES
                }
            if track_id not in person_sitting_states:
                person_sitting_states[track_id] = {
                    'position_history': [],
                    'state_entry_time': current_time,
                    'total_sitting': 0
                }

            sitting = person_sitting_states[track_id]
            sitting['position_history'].append((cx, cy, current_time))
            sitting['position_history'] = [
                entry for entry in sitting['position_history']
                if current_time - entry[2] <= MOVEMENT_WINDOW
            ]

            # Calculate speed to detect movement
            speed = 0
            if len(sitting['position_history']) >= 2:
                oldest = sitting['position_history'][0]
                newest = sitting['position_history'][-1]
                dx, dy = newest[0] - oldest[0], newest[1] - oldest[1]
                dist = (dx ** 2 + dy ** 2) ** 0.5
                t_diff = newest[2] - oldest[2]
                if t_diff > 0:
                    speed = dist / t_diff

            # Consider person sitting if speed below threshold
            if speed <= MOVEMENT_THRESHOLD:
                elapsed = current_time - sitting['state_entry_time']
                sitting['total_sitting'] += elapsed
                sitting['state_entry_time'] = current_time
                sitting_state = 'Sitting'
            else:
                sitting['state_entry_time'] = current_time
                sitting_state = 'Moving'

            # Zone presence logic
            label_lines = []
            for name, data in ZONES.items():
                zone = person_zone_timers[track_id][name]
                inside = is_inside_polygon((cx, cy), data["points"])

                if inside and not zone['in_zone']:
                    zone['entry_time'] = current_time
                    zone['in_zone'] = True
                elif not inside and zone['in_zone']:
                    zone['total_time'] += current_time - zone['entry_time']
                    zone['in_zone'] = False

                total_time = zone['total_time']
                if zone['in_zone']:
                    total_time += current_time - zone['entry_time']

                if inside:
                    label_lines.append(f"{name}: {int(total_time)}s")

            label_lines.append(f"{sitting_state}: {int(sitting['total_sitting'])}s")

            # Draw bounding box and labels
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            y_text = y1 - 10
            for line in label_lines:
                draw_text(frame, f"ID {track_id} - {line}", (x1, y_text), (0, 255, 255))
                y_text -= 20

        draw_zones(frame)
        cv2.imshow("Productivity Tracker - Sitting Only", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    print("\nFinal Productivity Summary (Sitting Only):")
    for track_id in person_zone_timers:
        print(f"\nPerson ID {track_id}:")
        zone_times = {}
        for name, data in person_zone_timers[track_id].items():
            total = data['total_time']
            if data['in_zone']:
                total += time.time() - data['entry_time']
            print(f"  {name}: {int(total)} seconds")
            zone_times[name] = int(total)

        sitting = person_sitting_states[track_id]
        print(f"  Sitting: {int(sitting['total_sitting'])}s")

        store_productivity_data(track_id, zone_times, int(sitting['total_sitting']))

if __name__ == "__main__":
    main()
