import cv2
import numpy as np

def is_inside_polygon(point, polygon):
    return cv2.pointPolygonTest(np.array(polygon, dtype=np.int32), point, False) >= 0

def draw_text(img, text, pos, color=(255, 255, 255)):
    cv2.putText(img, text, pos, cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

def draw_zones(frame, zones):
    for desk_name, points in zones.items():
        pts = np.array(points, np.int32).reshape((-1, 1, 2))
        cv2.polylines(frame, [pts], isClosed=True, color=(255, 0, 0), thickness=2)
        cv2.putText(frame, desk_name, points[0], cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
