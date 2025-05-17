from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb://localhost:27017")
db = client["productivity"]
collection = db["person_logs"]

def store_productivity_data(person_id, zone_times, movement_times):
    record = {
        "person_id": person_id,
        "zone_times": zone_times,
        "movement_times": movement_times,
        "timestamp": datetime.now()
    }
    collection.insert_one(record)
