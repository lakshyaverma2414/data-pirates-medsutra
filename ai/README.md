# ai-triage-service

Standalone FastAPI triage service that mirrors the MedLink Spring Boot AI module pattern:
- gather hospital/resource context from PostgreSQL
- use low-temperature Ollama (`llama3.2`) for reasoning
- return deterministic hospital recommendations from DB data only

## What It Preserves From The Spring AI Module

- Ollama endpoint: `http://localhost:11434/api/generate`
- Model: `llama3.2`
- Low-temperature inference (`0.2`)
- Direct PostgreSQL reads from the MedLink schema
- Prompt-driven reasoning plus deterministic recommendation logic

## Service Structure

```text
ai-triage-service/
  app/
    __init__.py
    main.py
    config.py
    models.py
    triage_engine.py
    hospital_selector.py
    ollama_client.py
    utils.py
  requirements.txt
  README.md
```

## Install

```powershell
cd D:\medsutra\ai-triage-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```powershell
cd D:\medsutra\ai-triage-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API

### `POST /triage`

Request:

```json
{
  "emergencyType": "cardiac",
  "description": "patient unconscious with chest pain",
  "patientAge": 58,
  "userLat": 28.6129,
  "userLng": 77.2295
}
```

Response:

```json
{
  "severity": "critical",
  "specialization": "cardiology",
  "stabilizationHospital": {
    "name": "Nearest Stabilization Hospital",
    "phone": "9000000001",
    "email": "stabilize@hospital.com",
    "address": "Near patient location",
    "lat": 28.6139,
    "lng": 77.209
  },
  "transferHospital": {
    "name": "Best Cardiac Hospital",
    "phone": "9000000002",
    "email": "apollo@hospital.com",
    "address": "Advanced specialty center",
    "lat": 28.6201,
    "lng": 77.215
  }
}
```

## Configuration

Environment variables:

```env
SERVICE_NAME=ai-triage-service
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.2
OLLAMA_TEMPERATURE=0.2
DATABASE_URL=postgresql://localhost:5432/medlink
DB_USER=postgres
DB_PASSWORD=2405
REQUEST_TIMEOUT_SECONDS=8
MAX_CANDIDATE_DISTANCE_KM=150
```

## Database Integration Notes

The service reads directly from PostgreSQL tables:

- `Hospital`
- `Resource`
- `BloodStock`
- `FeatureEmergency`
- `FeatureTransfer`
- `Doctor` if present

## How Selection Works

1. Analyze the emergency with Ollama.
2. Normalize severity to `low`, `moderate`, or `critical`.
3. Infer required capabilities such as `cardiology`, `icu`, `emergency`, or `orthopedics`.
4. Load hospitals and resources from PostgreSQL.
5. Compute distance using the Haversine formula.
6. For critical cases, pick the nearest stabilization hospital first.
7. Then choose the best transfer hospital with stronger matching resources.
8. For non-critical cases, return the best matching hospital directly.

## Lightweight Validation

After installing dependencies you can do a syntax/import smoke test with:

```powershell
python -m compileall app
```
