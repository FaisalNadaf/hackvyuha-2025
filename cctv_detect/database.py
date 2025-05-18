from pymongo import MongoClient
from datetime import datetime
import random
import string

client = MongoClient("mongodb://localhost:27017")
db = client["productivity"]
collection = db["person_logs"]

def generate_unique_person_id():
    while True:
        new_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if not collection.find_one({"person_id": new_id}):
            return new_id

def store_productivity_data(person_id, zone_times, movement_times):
    # Check if person_id already exists
    if collection.find_one({"person_id": person_id}):
        print(f"person_id '{person_id}' already exists. Generating a new one.")
        person_id = generate_unique_person_id()
    
    record = {
        "person_id": person_id,
        "zone_times": zone_times,
        "movement_times": movement_times,
        "timestamp": datetime.now()
    }
    collection.insert_one(record)
    print(f"Data inserted with person_id: {person_id}")
