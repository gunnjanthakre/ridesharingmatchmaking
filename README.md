# Ride Sharing Matchmaking System

A full-stack ride sharing app. Riders post ride requests, drivers post trips, and a DSA-driven matchmaking engine finds and ranks the best matches.

- **Backend:** Spring Boot 3.2, Spring Data JPA, H2 / MySQL, Swagger UI
- **Frontend:** React 18 + Vite + React Router

## Features

- Rider and driver registration
- Driver trip creation and lookup
- Ride request creation and lookup
- Match generation based on route overlap, distance, time compatibility and seats
- Ride booking with status transitions and seat deduction
- Validation, structured API errors and Swagger documentation
- Unit tests for the DSA matcher and the booking flow

## DSA used

| Technique | Where |
|---|---|
| Dijkstra-ready graph | `dsa/Graph.java` |
| Sliding window route overlap | `dsa/RouteMatcher.java` |
| Hash-based common stop detection | `dsa/RouteMatcher.java` |
| Grid-based nearby driver search | `dsa/NearbyDriverSearch.java` |
| Greedy time scoring | `dsa/TimeMatcher.java` |
| Heap-based ranking | `dsa/MatchRanker.java` |

## Prerequisites

- Java 17 or newer
- Maven 3.8+
- Node.js 18+ and npm
- MySQL 8 (optional, only if you don't want the in-memory H2 database)

## Project structure

```
daaproject/
├── src/main/java/...      Spring Boot backend
├── src/main/resources/    application.properties (MySQL), application-local.properties (H2)
├── src/test/java/...      JUnit tests
├── src/                   React frontend (pages, components, services)
├── pom.xml                Maven config
├── package.json           Frontend config
└── vite.config.js
```

## Run locally

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Start the backend

**Option A: in-memory H2 database (easiest, no setup)**

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Data is reset every time the app restarts.

**Option B: MySQL**

1. Create the database:
   ```sql
   CREATE DATABASE ridesharing;
   ```
2. Set your MySQL username and password in `src/main/resources/application.properties`.
3. Run:
   ```bash
   mvn spring-boot:run
   ```

The backend runs on http://localhost:8080.

| URL | What it is |
|---|---|
| http://localhost:8080/swagger-ui.html | Swagger UI, to try every endpoint |
| http://localhost:8080/h2-console | H2 console (JDBC URL `jdbc:h2:mem:ridesharing`, user `sa`, empty password; local profile only) |

### 3. Start the frontend

In a second terminal, from the project root:

```bash
npm install
npm run dev
```

Open http://localhost:5173.

If the frontend can't reach the backend, make sure the backend is running on port 8080. You can also point it elsewhere by setting `VITE_API_BASE_URL` in a `.env` file.

## Run the tests

```bash
mvn test
```

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Register a rider |
| GET | `/api/users/{userId}` | Get a rider |
| POST | `/api/drivers/register` | Register a driver |
| POST | `/api/drivers/addTrip` | Create a trip |
| GET | `/api/drivers/{driverId}` | Get a driver |
| GET | `/api/drivers/{driverId}/trips` | List a driver's trips |
| POST | `/api/rides/request` | Create a ride request |
| GET | `/api/rides/requests/{requestId}` | Get a ride request |
| GET | `/api/rides/findRides?requestId={id}` | Find and rank matches |
| GET | `/api/rides/requests/{requestId}/matches` | List matches for a request |
| POST | `/api/rides/bookRide` | Book a match |

## Try it in Swagger

Run these in order at http://localhost:8080/swagger-ui.html.

**1. Register user** (`POST /api/users/register`)

```json
{
  "name": "Gunjan",
  "email": "gunjan@example.com",
  "phone": "9876543210",
  "lat": 12.9716,
  "lng": 77.5946
}
```

**2. Register driver** (`POST /api/drivers/register`)

```json
{
  "name": "Aman",
  "email": "aman@example.com",
  "phone": "9876501234",
  "lat": 12.9721,
  "lng": 77.5930,
  "seats": 3
}
```

**3. Create trip** (`POST /api/drivers/addTrip`)

```json
{
  "driverId": 1,
  "startLoc": "B",
  "endLoc": "D",
  "startLat": 12.9721,
  "startLng": 77.5930,
  "endLat": 12.9352,
  "endLng": 77.6245,
  "startTime": "2026-04-21T10:00:00",
  "endTime": "2026-04-21T11:00:00",
  "seats": 2
}
```

**4. Create ride request** (`POST /api/rides/request`)

```json
{
  "userId": 1,
  "startLoc": "B",
  "endLoc": "C",
  "startLat": 12.9716,
  "startLng": 77.5946,
  "endLat": 12.9352,
  "endLng": 77.6245,
  "time": "2026-04-21T10:30:00",
  "seats": 1
}
```

**5. Find matches** (`GET /api/rides/findRides?requestId=1`)

**6. Book ride** (`POST /api/rides/bookRide`)

```json
{
  "matchId": 1
}
```

## Notes

- The CORS config in `WebConfig.java` only allows `http://localhost:5173`. Add your own origin if you deploy the frontend elsewhere.
- Never commit real database passwords. The values in `application.properties` are placeholders.
