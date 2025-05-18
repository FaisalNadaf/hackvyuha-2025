import cv2
import time
import numpy as np
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
from zones import get_zones
from database import store_productivity_data

# Load model and tracker
model = YOLO("yolov8x.pt")  # for better accuracy, use 'yolov8x.pt'
# Increase max_age for better track persistence
tracker = DeepSort(
    max_age=90,  # Increased from 30 to allow longer disappearances
    n_init=5,    # Requires more detections to confirm a track
    max_cosine_distance=0.3,  # More strict appearance matching
    nn_budget=100  # Store more appearance features for re-ID
)

# Constants
MOVEMENT_THRESHOLD = 5
MOVEMENT_WINDOW = 1.0
ZONES = get_zones()
MAX_PERSONS = 2  # Set the expected number of people

# Global state dictionaries
person_zone_timers = {}
person_sitting_states = {}
active_tracks = set()
track_history = {}  # To track positions for each track ID
track_confidence = {}  # To maintain confidence scores for each track

def is_inside_polygon(point, polygon):
    return cv2.pointPolygonTest(np.array(polygon, dtype=np.int32), point, False) >= 0

def draw_text(img, text, pos, color=(255, 255, 255)):
    cv2.putText(img, text, pos, cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

def draw_zones(frame):
    for name, data in ZONES.items():
        pts = np.array(data["points"], np.int32).reshape((-1, 1, 2))
        cv2.polylines(frame, [pts], isClosed=True, color=(255, 0, 0), thickness=2)
        cv2.putText(frame, name, data["points"][0], cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

def calculate_iou(box1, box2):
    """Calculate IoU between two bounding boxes"""
    # Extract coordinates
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    # Calculate intersection area
    x_left = max(x1_1, x1_2)
    y_top = max(y1_1, y1_2)
    x_right = min(x2_1, x2_2)
    y_bottom = min(y2_1, y2_2)
    
    if x_right < x_left or y_bottom < y_top:
        return 0.0
    
    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    
    # Calculate box areas
    box1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
    box2_area = (x2_2 - x1_2) * (y2_2 - y1_2)
    
    # Calculate IoU
    iou = intersection_area / float(box1_area + box2_area - intersection_area)
    return iou

def merge_duplicates():
    """Identify and merge duplicate tracks"""
    global active_tracks, person_zone_timers, person_sitting_states, track_history, track_confidence
    
    if len(active_tracks) <= MAX_PERSONS:
        return
    
    # Sort tracks by confidence (descending)
    sorted_tracks = sorted(track_confidence.items(), key=lambda x: x[1], reverse=True)
    
    # Keep only the MAX_PERSONS most confident tracks
    tracks_to_keep = {t[0] for t in sorted_tracks[:MAX_PERSONS]}
    tracks_to_remove = active_tracks - tracks_to_keep
    
    # Transfer data from tracks being removed to the tracks being kept
    for remove_id in tracks_to_remove:
        if remove_id in person_zone_timers:
            # Find the closest valid track to merge with
            best_match = None
            best_distance = float('inf')
            
            if remove_id in track_history:
                remove_pos = track_history[remove_id][-1] if track_history[remove_id] else None
                
                for keep_id in tracks_to_keep:
                    if keep_id in track_history and track_history[keep_id]:
                        keep_pos = track_history[keep_id][-1]
                        if remove_pos and keep_pos:
                            distance = ((remove_pos[0] - keep_pos[0])**2 + 
                                      (remove_pos[1] - keep_pos[1])**2)**0.5
                            if distance < best_distance:
                                best_distance = distance
                                best_match = keep_id
            
            # If we found a match within reasonable distance
            if best_match is not None and best_distance < 300:  # Threshold distance
                # Merge zone timers
                for zone_name, zone_data in person_zone_timers[remove_id].items():
                    if zone_data['total_time'] > 0:
                        person_zone_timers[best_match][zone_name]['total_time'] += zone_data['total_time']
                
                # Merge sitting states
                if remove_id in person_sitting_states and best_match in person_sitting_states:
                    person_sitting_states[best_match]['total_sitting'] += person_sitting_states[remove_id]['total_sitting']
            
            # Remove the data for the track being removed
            del person_zone_timers[remove_id]
            if remove_id in person_sitting_states:
                del person_sitting_states[remove_id]
            if remove_id in track_history:
                del track_history[remove_id]
            if remove_id in track_confidence:
                del track_confidence[remove_id]

def main():
    global active_tracks
    
    # cap = cv2.VideoCapture('/home/faisal/Videos/demo8.mp4')
    cap = cv2.VideoCapture('/home/faisal/Videos/cctv1.mp4')

    if not cap.isOpened():
        print("Error: Cannot open video")
        return

    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Reset active tracks for this frame
        active_tracks.clear()

        # Run YOLOv8 detection
        results = model.predict(frame, verbose=False, conf=0.25)[0]
        detections = []

        # Process detections with higher confidence threshold for stability
        for box, conf, cls in zip(results.boxes.xyxy, results.boxes.conf, results.boxes.cls):
            if int(cls) == 0 and conf > 0.35:  # person class with higher confidence
                x1, y1, x2, y2 = map(int, box)
                detections.append(([x1, y1, x2 - x1, y2 - y1], float(conf), 'person'))

        # Update tracks with new detections
        tracks = tracker.update_tracks(detections, frame=frame)
        current_time = time.time()

        # Process confirmed tracks
        for track in tracks:
            if not track.is_confirmed():
                continue

            track_id = track.track_id
            x1, y1, x2, y2 = map(int, track.to_ltrb())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            active_tracks.add(track_id)
            
            # Store position history for this track
            if track_id not in track_history:
                track_history[track_id] = []
            track_history[track_id].append((cx, cy))
            
            # Limit history length
            if len(track_history[track_id]) > 30:
                track_history[track_id] = track_history[track_id][-30:]
            
            # Update track confidence
            # The Track object doesn't have detection_confidence attribute
            # Instead, we can use the current detection's confidence if available
            detection_conf = None
            for det in detections:
                box, conf, _ = det
                det_x1, det_y1 = box[0], box[1]
                det_x2, det_y2 = det_x1 + box[2], det_y1 + box[3]
                # Check if this detection overlaps with current track
                if calculate_iou((x1, y1, x2, y2), (det_x1, det_y1, det_x2, det_y2)) > 0.5:
                    detection_conf = conf
                    break
                    
            # If we found a matching detection, use its confidence; otherwise maintain previous value
            if detection_conf is not None:
                track_confidence[track_id] = detection_conf
            elif track_id not in track_confidence:
                track_confidence[track_id] = 0.5  # Default confidence

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

        # Merge duplicate tracks when we have more than MAX_PERSONS
        if frame_count % 30 == 0:  # Check periodically, not every frame
            merge_duplicates()
        
        # Draw debug info - active tracks
        draw_text(frame, f"Active Tracks: {len(active_tracks)}", (10, 30), (0, 0, 255))
        
        # Draw zones
        draw_zones(frame)
        
        cv2.imshow("Productivity Tracker - Fixed", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    print("\nFinal Productivity Summary:")
    # Process only the highest confidence tracks
    if len(track_confidence) > MAX_PERSONS:
        top_tracks = sorted(track_confidence.items(), key=lambda x: x[1], reverse=True)[:MAX_PERSONS]
        track_ids = [t[0] for t in top_tracks]
    else:
        track_ids = list(person_zone_timers.keys())
    
    for track_id in track_ids:
        if track_id not in person_zone_timers:
            continue
            
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