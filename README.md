# Ride Sharing Matchmaking System

A backend-only ride sharing system built with Spring Boot, MySQL, JPA, and a DSA-driven matchmaking engine.

## What the backend supports

- Rider and driver registration
- Driver trip creation and lookup
- Ride request creation and lookup
- Match generation based on route overlap, distance, time compatibility, and seats
- Ride booking with status transitions and seat deduction
- Validation, structured API errors, and Swagger documentation
- Unit tests for the DSA matcher and booking flow

## DSA used in the backend

- Dijkstra-ready graph component in `com.example.ridesharing.dsa.Graph`
- Sliding window route overlap in `RouteMatcher`
- Hash-based common stop detection in `RouteMatcher`
- Grid-based nearby driver search in `NearbyDriverSearch`
- Greedy time scoring in `TimeMatcher`
- Heap-based ranking in `MatchRanker`

## Tech stack

- Java 17
- Spring Boot 3.2.0
- Spring Web
- Spring Data JPA
- Spring Validation
- MySQL
- springdoc OpenAPI / Swagger UI
- JUnit 5 and Mockito

## Run locally

1. Create a MySQL database named `ridesharing`.
2. Update `src/main/resources/application.properties` with your MySQL username and password.
3. Run `mvn spring-boot:run`.
4. Open Swagger UI at `http://localhost:8080/swagger-ui.html`.

## Main endpoints

- `POST /api/users/register`
- `GET /api/users/{userId}`
- `POST /api/drivers/register`
- `POST /api/drivers/addTrip`
- `GET /api/drivers/{driverId}`
- `GET /api/drivers/{driverId}/trips`
- `POST /api/rides/request`
- `GET /api/rides/requests/{requestId}`
- `GET /api/rides/findRides?requestId={id}`
- `GET /api/rides/requests/{requestId}/matches`
- `POST /api/rides/bookRide`

## Sample payloads

Register user:

```json
{
  "name": "Gunjan",
  "email": "gunjan@example.com",
  "phone": "9876543210",
  "lat": 12.9716,
  "lng": 77.5946
}
```

Register driver:

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

Create trip:

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

Create ride request:

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

Book ride:

```json
{
  "matchId": 1
}
```

## Verification

- `mvn test`
- Swagger UI available at `/swagger-ui.html`
