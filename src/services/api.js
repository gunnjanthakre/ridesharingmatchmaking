import mockData from "../data/mockData";
import { getLocationByName } from "../data/locationCatalog";

export const USE_MOCK = false;
const CONFIGURED_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const DEFAULT_BASE_URLS = ["http://localhost:8080", "http://localhost:8081"];
const LOCAL_TRIPS_KEY = "ridesharing_local_trips_cache";
const LOCAL_REQUESTS_KEY = "ridesharing_local_requests_cache";
const LOCAL_BOOKED_MATCHES_KEY = "ridesharing_local_booked_matches";

function getBaseUrls() {
  const candidates = CONFIGURED_BASE_URL ? [CONFIGURED_BASE_URL, ...DEFAULT_BASE_URLS] : DEFAULT_BASE_URLS;
  return [...new Set(candidates.filter(Boolean))];
}

function resolveCoordinates(locationName, lat, lng) {
  if (lat !== undefined && lat !== "" && lng !== undefined && lng !== "") {
    return {
      lat: Number(lat),
      lng: Number(lng)
    };
  }

  const resolved = getLocationByName(locationName);
  if (!resolved) {
    throw new Error(`Unknown location "${locationName}". Please choose one of the listed areas.`);
  }

  return {
    lat: resolved.lat,
    lng: resolved.lng
  };
}

function delay(ms = 350) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;
  if (payload.validationErrors) {
    const firstEntry = Object.values(payload.validationErrors)[0];
    if (firstEntry) return firstEntry;
  }
  return fallback;
}

async function parseError(response, fallback) {
  try {
    const payload = await response.json();
    throw new Error(getErrorMessage(payload, fallback));
  } catch (error) {
    if (error instanceof Error && error.message !== "Unexpected end of JSON input") {
      throw error;
    }
    throw new Error(fallback);
  }
}

async function request(path, options = {}) {
  const baseUrls = getBaseUrls();
  let lastError = null;

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        ...options
      });

      if (!response.ok) {
        await parseError(response, `Request failed with status ${response.status}`);
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.name !== "TypeError") {
        throw error;
      }
    }
  }

  if (lastError instanceof Error && lastError.name === "TypeError") {
    throw new Error(
      "Could not reach the backend. Start Spring Boot on localhost:8080 or localhost:8081, or set VITE_API_BASE_URL explicitly."
    );
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed.");
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    lat: user.lat ?? user.latitude,
    lng: user.lng ?? user.longitude
  };
}

function normalizeDriver(driver) {
  if (!driver) return null;
  return {
    id: driver.id,
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    lat: driver.lat ?? driver.latitude,
    lng: driver.lng ?? driver.longitude,
    seats: driver.seats ?? driver.availableSeats
  };
}

function normalizeTrip(trip) {
  if (!trip) return null;
  return {
    id: trip.id,
    driver: trip.driver ? { id: trip.driver.id, name: trip.driver.name } : null,
    startLoc: trip.startLoc ?? trip.startLocation,
    endLoc: trip.endLoc ?? trip.endLocation,
    startLat: trip.startLat,
    startLng: trip.startLng,
    endLat: trip.endLat,
    endLng: trip.endLng,
    startTime: trip.startTime,
    endTime: trip.endTime,
    seats: trip.seats ?? trip.availableSeats,
    status: trip.status
  };
}

function normalizeRideRequest(rideRequest) {
  if (!rideRequest) return null;
  return {
    id: rideRequest.id,
    user: rideRequest.user ? { id: rideRequest.user.id, name: rideRequest.user.name } : null,
    startLoc: rideRequest.startLoc ?? rideRequest.startLocation,
    endLoc: rideRequest.endLoc ?? rideRequest.endLocation,
    startLat: rideRequest.startLat,
    startLng: rideRequest.startLng,
    endLat: rideRequest.endLat,
    endLng: rideRequest.endLng,
    time: rideRequest.time ?? rideRequest.requestedTime,
    seats: rideRequest.seats ?? rideRequest.requiredSeats,
    status: rideRequest.status
  };
}

function normalizeMatch(match) {
  if (!match) return null;
  if (match.matchId) return { ...match };
  return {
    matchId: match.id,
    tripId: match.trip?.id,
    driverId: match.trip?.driver?.id,
    driverName: match.trip?.driver?.name,
    rideRequestId: match.rideRequest?.id,
    overlapPercentage: match.overlapPercentage,
    detourDistance: match.detourDistance,
    timeCompatibility: match.timeCompatibility,
    score: match.score,
    status: match.status
  };
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function readLocalJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function upsertLocalRecord(key, item) {
  const current = readLocalJson(key, []);
  const next = [item, ...current.filter((entry) => Number(entry.id) !== Number(item.id))];
  writeLocalJson(key, next);
}

function updateLocalTrip(tripId, updater) {
  const current = readLocalJson(LOCAL_TRIPS_KEY, []);
  const next = current.map((entry) => {
    if (Number(entry.id) !== Number(tripId)) {
      return entry;
    }

    const normalized = normalizeTrip(entry);
    return updater(normalized);
  });

  writeLocalJson(LOCAL_TRIPS_KEY, next);
}

function updateLocalRideRequest(requestId, updater) {
  const current = readLocalJson(LOCAL_REQUESTS_KEY, []);
  const next = current.map((entry) => {
    if (Number(entry.id) !== Number(requestId)) {
      return entry;
    }

    const normalized = normalizeRideRequest(entry);
    return updater(normalized);
  });

  writeLocalJson(LOCAL_REQUESTS_KEY, next);
}

function getCachedTrips() {
  return readLocalJson(LOCAL_TRIPS_KEY, []).map(normalizeTrip).filter(Boolean);
}

function getCachedRequests() {
  return readLocalJson(LOCAL_REQUESTS_KEY, []).map(normalizeRideRequest).filter(Boolean);
}

function getCachedRequestById(requestId) {
  return getCachedRequests().find((item) => Number(item.id) === Number(requestId)) || null;
}

function getBookedLocalMatches() {
  return readLocalJson(LOCAL_BOOKED_MATCHES_KEY, {});
}

function setBookedLocalMatch(matchId, status) {
  const booked = getBookedLocalMatches();
  booked[String(matchId)] = status;
  writeLocalJson(LOCAL_BOOKED_MATCHES_KEY, booked);
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function calculateTimeCompatibility(driverStart, driverEnd, riderRequest) {
  const start = new Date(driverStart);
  const end = new Date(driverEnd);
  const request = new Date(riderRequest);

  if (request < start || request > end) {
    return 0;
  }

  const totalMinutes = Math.max((end.getTime() - start.getTime()) / 60000, 0);
  const waitMinutes = Math.max((request.getTime() - start.getTime()) / 60000, 0);

  if (totalMinutes === 0) {
    return 100;
  }

  return Math.max(0, Math.round((1 - waitMinutes / totalMinutes) * 100));
}

function calculateRouteOverlap(driverRoute, riderRoute) {
  if (!driverRoute.length || !riderRoute.length) {
    return { hasOverlap: false, overlapPercentage: 0 };
  }

  const driverStops = new Set(driverRoute);
  const hasOverlap = riderRoute.some((stop) => driverStops.has(stop));

  if (!hasOverlap) {
    return { hasOverlap: false, overlapPercentage: 0 };
  }

  let maxOverlap = 0;

  for (let index = 0; index < driverRoute.length; index += 1) {
    let overlap = 0;

    for (let riderIndex = 0; riderIndex < riderRoute.length && index + riderIndex < driverRoute.length; riderIndex += 1) {
      if (driverRoute[index + riderIndex] === riderRoute[riderIndex]) {
        overlap += 1;
      } else {
        break;
      }
    }

    maxOverlap = Math.max(maxOverlap, overlap);
  }

  return {
    hasOverlap: true,
    overlapPercentage: (maxOverlap / riderRoute.length) * 100
  };
}

function createSyntheticMatchId(requestId, tripId) {
  return -1 * (Number(requestId) * 100000 + Number(tripId));
}

function getSyntheticIds(matchId) {
  const absolute = Math.abs(Number(matchId));
  return {
    requestId: Math.floor(absolute / 100000),
    tripId: absolute % 100000
  };
}

function buildLocalMatches(requestId) {
  const rideRequest = getCachedRequestById(requestId);

  if (!rideRequest) {
    return [];
  }

  const bookedStatuses = getBookedLocalMatches();

  return getCachedTrips()
    .filter((trip) => trip.status === "CREATED" || trip.status === "MATCHED")
    .filter((trip) => Number(trip.seats) >= Number(rideRequest.seats))
    .map((trip) => {
      const { hasOverlap, overlapPercentage } = calculateRouteOverlap(
        [trip.startLoc, trip.endLoc],
        [rideRequest.startLoc, rideRequest.endLoc]
      );

      if (!hasOverlap) {
        return null;
      }

      const timeCompatibility = calculateTimeCompatibility(trip.startTime, trip.endTime, rideRequest.time);

      if (timeCompatibility === 0) {
        return null;
      }

      const detourDistance = calculateDistanceKm(
        Number(rideRequest.startLat),
        Number(rideRequest.startLng),
        Number(trip.startLat),
        Number(trip.startLng)
      );

      const score = overlapPercentage / 100 * 0.5 + (timeCompatibility / 100) * 0.3 + (1 / (1 + detourDistance)) * 0.2;
      const matchId = createSyntheticMatchId(rideRequest.id, trip.id);

      return {
        matchId,
        tripId: trip.id,
        driverId: trip.driver?.id,
        driverName: trip.driver?.name || "Driver",
        rideRequestId: rideRequest.id,
        overlapPercentage,
        detourDistance,
        timeCompatibility,
        score,
        status: bookedStatuses[String(matchId)] || "SUGGESTED",
        synthetic: true
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

async function withMock(factory) {
  await delay();
  return clone(factory());
}

function findMockMatches(requestId) {
  return mockData.matchResponses[requestId] || [];
}

export async function registerUser(payload) {
  const coordinates = resolveCoordinates(payload.location, payload.lat, payload.lng);

  if (USE_MOCK) {
    return withMock(() => ({
      id: Date.now(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      lat: coordinates.lat,
      lng: coordinates.lng
    }));
  }

  const data = await request("/api/users/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      lat: coordinates.lat,
      lng: coordinates.lng
    })
  });

  return normalizeUser(data);
}

export async function getUser(userId) {
  if (USE_MOCK) {
    return withMock(() => {
      const user = mockData.riders.find((item) => Number(item.id) === Number(userId));
      if (!user) throw new Error("Rider not found.");
      return user;
    });
  }

  return normalizeUser(await request(`/api/users/${userId}`));
}

export async function registerDriver(payload) {
  const coordinates = resolveCoordinates(payload.location, payload.lat, payload.lng);

  if (USE_MOCK) {
    return withMock(() => ({
      id: Date.now(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      lat: coordinates.lat,
      lng: coordinates.lng,
      seats: Number(payload.seats)
    }));
  }

  const data = await request("/api/drivers/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      lat: coordinates.lat,
      lng: coordinates.lng,
      seats: Number(payload.seats)
    })
  });

  return normalizeDriver(data);
}

export async function getDriver(driverId) {
  if (USE_MOCK) {
    return withMock(() => {
      const driver = mockData.drivers.find((item) => Number(item.id) === Number(driverId));
      if (!driver) throw new Error("Driver not found.");
      return driver;
    });
  }

  return normalizeDriver(await request(`/api/drivers/${driverId}`));
}

export async function getDriverTrips(driverId) {
  if (USE_MOCK) {
    return withMock(() =>
      mockData.trips.filter((trip) => Number(trip.driver.id) === Number(driverId)).map(normalizeTrip)
    );
  }

  try {
    const trips = await request(`/api/drivers/${driverId}/trips`);
    const normalized = trips.map(normalizeTrip);
    normalized.forEach((trip) => upsertLocalRecord(LOCAL_TRIPS_KEY, trip));
    return normalized;
  } catch (error) {
    const localTrips = getCachedTrips().filter((trip) => Number(trip.driver?.id) === Number(driverId));

    if (localTrips.length > 0) {
      return localTrips;
    }

    throw error;
  }
}

export async function createTrip(payload) {
  const startCoordinates = resolveCoordinates(payload.startLocation, payload.startLat, payload.startLng);
  const endCoordinates = resolveCoordinates(payload.endLocation, payload.endLat, payload.endLng);
  const requestBody = {
    driverId: Number(payload.driverId),
    startLoc: payload.startLocation,
    endLoc: payload.endLocation,
    startLat: startCoordinates.lat,
    startLng: startCoordinates.lng,
    endLat: endCoordinates.lat,
    endLng: endCoordinates.lng,
    startTime: payload.startTime,
    endTime: payload.endTime,
    seats: Number(payload.seats)
  };

  if (USE_MOCK) {
    return withMock(() => ({
      id: Date.now(),
      driver: {
        id: Number(payload.driverId),
        name: mockData.drivers.find((driver) => Number(driver.id) === Number(payload.driverId))?.name || "Driver"
      },
      startLoc: requestBody.startLoc,
      endLoc: requestBody.endLoc,
      startLat: requestBody.startLat,
      startLng: requestBody.startLng,
      endLat: requestBody.endLat,
      endLng: requestBody.endLng,
      startTime: requestBody.startTime,
      endTime: requestBody.endTime,
      seats: requestBody.seats,
      status: "CREATED"
    }));
  }

  const createdTrip = normalizeTrip(
    await request("/api/drivers/addTrip", {
      method: "POST",
      body: JSON.stringify(requestBody)
    })
  );

  upsertLocalRecord(LOCAL_TRIPS_KEY, createdTrip);
  return createdTrip;
}

export async function createRideRequest(payload) {
  const startCoordinates = resolveCoordinates(payload.startLocation, payload.startLat, payload.startLng);
  const endCoordinates = resolveCoordinates(payload.endLocation, payload.endLat, payload.endLng);
  const requestBody = {
    userId: Number(payload.userId),
    startLoc: payload.startLocation,
    endLoc: payload.endLocation,
    startLat: startCoordinates.lat,
    startLng: startCoordinates.lng,
    endLat: endCoordinates.lat,
    endLng: endCoordinates.lng,
    time: payload.time,
    seats: Number(payload.seats)
  };

  if (USE_MOCK) {
    return withMock(() => ({
      id: Date.now(),
      user: {
        id: Number(payload.userId),
        name: mockData.riders.find((rider) => Number(rider.id) === Number(payload.userId))?.name || "Rider"
      },
      startLoc: requestBody.startLoc,
      endLoc: requestBody.endLoc,
      startLat: requestBody.startLat,
      startLng: requestBody.startLng,
      endLat: requestBody.endLat,
      endLng: requestBody.endLng,
      time: requestBody.time,
      seats: requestBody.seats,
      status: "PENDING"
    }));
  }

  const createdRequest = normalizeRideRequest(
    await request("/api/rides/request", {
      method: "POST",
      body: JSON.stringify(requestBody)
    })
  );

  upsertLocalRecord(LOCAL_REQUESTS_KEY, createdRequest);
  return createdRequest;
}

export async function getRideRequest(requestId) {
  if (USE_MOCK) {
    return withMock(() => {
      const requestItem = mockData.rideRequests.find((item) => Number(item.id) === Number(requestId));
      if (!requestItem) throw new Error("Ride request not found.");
      return requestItem;
    });
  }

  try {
    const rideRequest = normalizeRideRequest(await request(`/api/rides/requests/${requestId}`));
    upsertLocalRecord(LOCAL_REQUESTS_KEY, rideRequest);
    return rideRequest;
  } catch (error) {
    const cached = getCachedRequestById(requestId);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

export async function findRides(requestId) {
  if (USE_MOCK) {
    return withMock(() => findMockMatches(Number(requestId)).map(normalizeMatch));
  }

  try {
    const matches = await request(`/api/rides/findRides?requestId=${requestId}`);
    const normalizedMatches = matches.map(normalizeMatch);

    if (normalizedMatches.length > 0) {
      return normalizedMatches;
    }

    return buildLocalMatches(requestId);
  } catch (error) {
    const localMatches = buildLocalMatches(requestId);

    if (localMatches.length > 0) {
      return localMatches;
    }

    throw error;
  }
}

export async function bookRide(matchId) {
  if (Number(matchId) < 0) {
    setBookedLocalMatch(matchId, "ACCEPTED");
    const { requestId, tripId } = getSyntheticIds(matchId);
    const request = getCachedRequestById(requestId);

    updateLocalTrip(tripId, (trip) => ({
      ...trip,
      seats: Math.max(0, Number(trip.seats) - Number(request?.seats || 0)),
      status: "MATCHED"
    }));

    updateLocalRideRequest(requestId, (rideRequest) => ({
      ...rideRequest,
      status: "BOOKED"
    }));

    return {
      matchId: Number(matchId),
      tripId,
      rideRequestId: requestId,
      status: "ACCEPTED",
      synthetic: true
    };
  }

  if (USE_MOCK) {
    return withMock(() => {
      const allMatches = Object.values(mockData.matchResponses).flat();
      const found = allMatches.find((match) => Number(match.matchId) === Number(matchId));
      if (!found) throw new Error("Match not found.");
      return {
        ...found,
        status: "ACCEPTED"
      };
    });
  }

  const bookedMatch = normalizeMatch(
    await request("/api/rides/bookRide", {
      method: "POST",
      body: JSON.stringify({ matchId: Number(matchId) })
    })
  );

  setBookedLocalMatch(matchId, "ACCEPTED");

  if (bookedMatch?.tripId) {
    const relatedRequest = bookedMatch.rideRequestId ? getCachedRequestById(bookedMatch.rideRequestId) : null;

    updateLocalTrip(bookedMatch.tripId, (trip) => ({
      ...trip,
      seats: Math.max(0, Number(trip.seats) - Number(relatedRequest?.seats || 0)),
      status: "MATCHED"
    }));
  }

  if (bookedMatch?.rideRequestId) {
    updateLocalRideRequest(bookedMatch.rideRequestId, (rideRequest) => ({
      ...rideRequest,
      status: "BOOKED"
    }));
  }

  return bookedMatch;
}

export async function getRequestMatches(requestId) {
  if (USE_MOCK) {
    return withMock(() => findMockMatches(Number(requestId)).map(normalizeMatch));
  }

  try {
    const matches = await request(`/api/rides/requests/${requestId}/matches`);
    const normalizedMatches = matches.map(normalizeMatch);

    if (normalizedMatches.length > 0) {
      return normalizedMatches;
    }

    return buildLocalMatches(requestId);
  } catch (error) {
    const localMatches = buildLocalMatches(requestId);

    if (localMatches.length > 0) {
      return localMatches;
    }

    throw error;
  }
}

export async function getTripsDirectory() {
  const localTrips = getCachedTrips();

  if (localTrips.length > 0) {
    return localTrips.sort((left, right) => new Date(right.startTime).getTime() - new Date(left.startTime).getTime());
  }

  return withMock(() => mockData.trips.map(normalizeTrip));
}

export async function getDriversDirectory() {
  return withMock(() => mockData.drivers.map(normalizeDriver));
}
