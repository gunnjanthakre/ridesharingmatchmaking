export const mockData = {
  riders: [
    {
      id: 101,
      name: "Gunjan Patel",
      email: "gunjan.patel@example.com",
      phone: "+91 9876543210",
      lat: 12.9352,
      lng: 77.6245
    },
    {
      id: 102,
      name: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "+91 9988776655",
      lat: 12.9719,
      lng: 77.6412
    }
  ],
  drivers: [
    {
      id: 201,
      name: "Aman Verma",
      email: "aman.verma@example.com",
      phone: "+91 9123456780",
      lat: 12.9279,
      lng: 77.6271,
      seats: 3
    },
    {
      id: 202,
      name: "Riya Sharma",
      email: "riya.sharma@example.com",
      phone: "+91 9012345678",
      lat: 12.9784,
      lng: 77.6408,
      seats: 2
    },
    {
      id: 203,
      name: "Kunal Mehta",
      email: "kunal.mehta@example.com",
      phone: "+91 9234567810",
      lat: 12.9686,
      lng: 77.7014,
      seats: 4
    }
  ],
  trips: [
    {
      id: 301,
      driver: { id: 201, name: "Aman Verma" },
      startLoc: "Koramangala",
      endLoc: "Electronic City",
      startLat: 12.9352,
      startLng: 77.6245,
      endLat: 12.8399,
      endLng: 77.677,
      startTime: "2026-04-22T08:15:00",
      endTime: "2026-04-22T09:00:00",
      seats: 3,
      status: "CREATED"
    },
    {
      id: 302,
      driver: { id: 202, name: "Riya Sharma" },
      startLoc: "Indiranagar",
      endLoc: "MG Road",
      startLat: 12.9784,
      startLng: 77.6408,
      endLat: 12.9758,
      endLng: 77.6047,
      startTime: "2026-04-22T08:30:00",
      endTime: "2026-04-22T09:05:00",
      seats: 2,
      status: "MATCHED"
    },
    {
      id: 303,
      driver: { id: 203, name: "Kunal Mehta" },
      startLoc: "Whitefield",
      endLoc: "Marathahalli",
      startLat: 12.9698,
      startLng: 77.75,
      endLat: 12.9591,
      endLng: 77.6974,
      startTime: "2026-04-22T08:10:00",
      endTime: "2026-04-22T08:55:00",
      seats: 4,
      status: "ONGOING"
    }
  ],
  rideRequests: [
    {
      id: 401,
      user: { id: 101, name: "Gunjan Patel" },
      startLoc: "Koramangala",
      endLoc: "Electronic City",
      startLat: 12.9352,
      startLng: 77.6245,
      endLat: 12.8399,
      endLng: 77.677,
      time: "2026-04-22T08:20:00",
      seats: 1,
      status: "PENDING"
    },
    {
      id: 402,
      user: { id: 102, name: "Priya Nair" },
      startLoc: "Indiranagar",
      endLoc: "MG Road",
      startLat: 12.9784,
      startLng: 77.6408,
      endLat: 12.9758,
      endLng: 77.6047,
      time: "2026-04-22T08:40:00",
      seats: 1,
      status: "MATCHED"
    }
  ],
  matchResponses: {
    401: [
      {
        matchId: 501,
        tripId: 301,
        driverId: 201,
        driverName: "Aman Verma",
        rideRequestId: 401,
        overlapPercentage: 0.91,
        detourDistance: 0.8,
        timeCompatibility: 92,
        score: 0.91,
        status: "SUGGESTED"
      },
      {
        matchId: 502,
        tripId: 302,
        driverId: 202,
        driverName: "Riya Sharma",
        rideRequestId: 401,
        overlapPercentage: 0.84,
        detourDistance: 1.2,
        timeCompatibility: 81,
        score: 0.84,
        status: "SUGGESTED"
      },
      {
        matchId: 503,
        tripId: 303,
        driverId: 203,
        driverName: "Kunal Mehta",
        rideRequestId: 401,
        overlapPercentage: 0.78,
        detourDistance: 2.1,
        timeCompatibility: 74,
        score: 0.78,
        status: "REJECTED"
      }
    ],
    402: [
      {
        matchId: 504,
        tripId: 302,
        driverId: 202,
        driverName: "Riya Sharma",
        rideRequestId: 402,
        overlapPercentage: 0.9,
        detourDistance: 0.9,
        timeCompatibility: 89,
        score: 0.88,
        status: "ACCEPTED"
      }
    ]
  }
};

export default mockData;
