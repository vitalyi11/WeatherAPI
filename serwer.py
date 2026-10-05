from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "sensors.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

latest_data = {"temp": None, "pres": None, "timestamp": None}
last_db_save = None
SAVE_INTERVAL = timedelta(minutes=2)

class Measurement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    temp = db.Column(db.Float, nullable=False)
    pres = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.String(25), nullable=False)

    def to_dict(self):
        return {"id": self.id, "temp": self.temp, "pres": self.pres, "timestamp": self.timestamp}

with app.app_context():
    db.create_all()

def evaluate_conditions(temp, pres):
    if temp < 10 or temp > 26 or pres < 985 or pres > 1030:
        return {"status": "niekorzystne 😞", "level": "bad"}
    elif (10 <= temp < 18 or 22 < temp <= 26) or (985 <= pres < 1000 or 1020 < pres <= 1030):
        return {"status": "umiarkowane ⚠️", "level": "medium"}
    else:
        return {"status": "komfortowe 😊", "level": "good"}  


@app.route("/update", methods=["POST"])
def update_data():
    global latest_data, last_db_save
    
    data = request.get_json()

    if not data or "temp" not in data or "pres" not in data or "date_time" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    temp = float(data["temp"])
    pres = float(data["pres"])
    timestamp = str(data["date_time"])
    
    latest_data = {
        "temp": temp,
        "pres": pres,
        "timestamp": timestamp
    }
    
    current_time = datetime.now()
    should_save = False
    
    if last_db_save is None:
        should_save = True
    elif current_time - last_db_save >= SAVE_INTERVAL:
        should_save = True
    
    if should_save:
        new_entry = Measurement(
            temp=temp,
            pres=pres,
            timestamp=timestamp
        )
        db.session.add(new_entry)
        db.session.commit()
        last_db_save = current_time
        print(f"[ZAPIS] [{timestamp}] Temp={temp} | Pres={pres} hPa")
        return jsonify({"status": "OK", "id": new_entry.id, "saved_to_db": True}), 201
    else:
        print(f"[LIVE] [{timestamp}] Temp={temp} | Pres={pres} hPa")
        return jsonify({"status": "OK", "saved_to_db": False}), 200


@app.route("/data", methods=["GET"])
def get_latest():
    if latest_data["temp"] is not None:
        return jsonify(latest_data)

    latest = Measurement.query.order_by(Measurement.id.desc()).first()
    if not latest:
        return jsonify({"message": "No data yet"}), 404
    return jsonify(latest.to_dict())


@app.route("/history", methods=["GET"])
def get_history():
    limit = int(request.args.get("limit", 50))
    records = Measurement.query.order_by(Measurement.id.desc()).limit(limit).all()
    return jsonify([r.to_dict() for r in reversed(records)])


@app.route("/history/timerange", methods=["GET"])
def get_history_by_time():
    hours = float(request.args.get("hours", 1))  
    
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo
    
    warsaw_tz = ZoneInfo('Europe/Warsaw')
    
    time_threshold = datetime.now(warsaw_tz) - timedelta(hours=hours)
    
    all_records = Measurement.query.order_by(Measurement.id.desc()).all()
    
    filtered_records = []
    for record in all_records:
        try:
            timestamp_str = record.timestamp.strip()
            
            if 'Z' in timestamp_str:
                timestamp_str = timestamp_str.replace('Z', '+00:00')
                record_time = datetime.fromisoformat(timestamp_str)
            else:
                record_time = datetime.fromisoformat(timestamp_str)
                if record_time.tzinfo is None:
                    record_time = record_time.replace(tzinfo=warsaw_tz)
            

            if record_time.tzinfo is None:
                record_time = record_time.replace(tzinfo=warsaw_tz)
            else:
                record_time = record_time.astimezone(warsaw_tz)
            
            if record_time >= time_threshold:
                filtered_records.append(record)
        except Exception as e:
            print(f"Błąd parsowania timestamp: {record.timestamp} - {e}")
            continue
    
    return jsonify([r.to_dict() for r in reversed(filtered_records)])

@app.route("/comfort", methods=["GET"])
def comfort():
    last = Measurement.query.order_by(Measurement.id.desc()).first()
    if not last:
        return jsonify({"error": "Brak danych"}), 404

    result = evaluate_conditions(last.temp, last.pres)
    return jsonify({
        "temp": last.temp,
        "pres": last.pres,
        "comfort": result["status"]
    })

@app.route("/history/date", methods=["GET"])
def get_history_by_date():
    date_str = request.args.get("date")
    
    if not date_str:
        return jsonify({"error": "Brak parametru date"}), 400
    
    from datetime import datetime
    from zoneinfo import ZoneInfo
    
    warsaw_tz = ZoneInfo('Europe/Warsaw')
    
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
        
        all_records = Measurement.query.order_by(Measurement.id.asc()).all()
        
        filtered_records = []
        print(f"\nSzukam danych dla daty: {date_str}")
        
        for record in all_records:
            try:
                timestamp_str = record.timestamp.strip()
                
                if 'Z' in timestamp_str:
                    timestamp_str = timestamp_str.replace('Z', '+00:00')
                    record_time = datetime.fromisoformat(timestamp_str)
                else:
                    record_time = datetime.fromisoformat(timestamp_str)
                    if record_time.tzinfo is None:
                        record_time = record_time.replace(tzinfo=warsaw_tz)
                
                if record_time.tzinfo is None:
                    record_time = record_time.replace(tzinfo=warsaw_tz)
                else:
                    record_time = record_time.astimezone(warsaw_tz)
                
                if (record_time.year == target_date.year and 
                    record_time.month == target_date.month and 
                    record_time.day == target_date.day):
                    filtered_records.append(record)
                    
            except Exception as e:
                print(f"Błąd parsowania timestamp: {record.timestamp} - {e}")
                continue
        
        print(f"Znaleziono {len(filtered_records)} rekordów dla daty {date_str}")
        return jsonify([r.to_dict() for r in filtered_records])
    
    except ValueError as e:
        print(f"Błąd parsowania daty: {e}")
        return jsonify({"error": "Nieprawidłowy format daty. Użyj YYYY-MM-DD"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)