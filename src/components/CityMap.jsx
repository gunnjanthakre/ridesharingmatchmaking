import { useEffect, useMemo, useRef, useState } from "react";
import "./CityMap.css";

const GRID_SIZE = 30;
const CELL_SIZE = 25;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const DOT_RADIUS = 1.5;
const LOCATION_HIT_RADIUS = 14;
const FADE_DURATION = 300;
const TRACE_DURATION = 600;
const PULSE_DURATION = 150;

export const LOCATIONS = [
  { id: "koramangala", name: "Koramangala", x: 8, y: 22, color: "#4f8ef7" },
  { id: "indiranagar", name: "Indiranagar", x: 18, y: 20, color: "#4f8ef7" },
  { id: "mg_road", name: "MG Road", x: 15, y: 14, color: "#4f8ef7" },
  { id: "whitefield", name: "Whitefield", x: 26, y: 18, color: "#4f8ef7" },
  { id: "electronic_city", name: "Electronic City", x: 12, y: 28, color: "#4f8ef7" },
  { id: "marathahalli", name: "Marathahalli", x: 22, y: 16, color: "#4f8ef7" },
  { id: "hsr_layout", name: "HSR Layout", x: 10, y: 26, color: "#4f8ef7" },
  { id: "jp_nagar", name: "JP Nagar", x: 6, y: 25, color: "#4f8ef7" },
  { id: "jayanagar", name: "Jayanagar", x: 10, y: 20, color: "#4f8ef7" },
  { id: "btm_layout", name: "BTM Layout", x: 13, y: 24, color: "#4f8ef7" },
  { id: "silk_board", name: "Silk Board", x: 16, y: 24, color: "#4f8ef7" },
  { id: "hebbal", name: "Hebbal", x: 14, y: 4, color: "#4f8ef7" },
  { id: "yeshwanthpur", name: "Yeshwanthpur", x: 7, y: 8, color: "#4f8ef7" },
  { id: "rajajinagar", name: "Rajajinagar", x: 5, y: 12, color: "#4f8ef7" },
  { id: "malleswaram", name: "Malleswaram", x: 9, y: 10, color: "#4f8ef7" },
  { id: "cunningham", name: "Cunningham Rd", x: 12, y: 10, color: "#4f8ef7" },
  { id: "ulsoor", name: "Ulsoor", x: 18, y: 14, color: "#4f8ef7" },
  { id: "kr_puram", name: "KR Puram", x: 24, y: 10, color: "#4f8ef7" },
  { id: "bannerghatta", name: "Bannerghatta", x: 8, y: 28, color: "#4f8ef7" },
  { id: "sarjapur", name: "Sarjapur", x: 24, y: 26, color: "#4f8ef7" }
];

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map((location) => [location.id, location]));
export const LOCATION_BY_NAME = Object.fromEntries(LOCATIONS.map((location) => [location.name, location]));

function nodeIdFor(x, y) {
  return y * GRID_SIZE + x;
}

function coordsForNode(nodeId) {
  return {
    x: nodeId % GRID_SIZE,
    y: Math.floor(nodeId / GRID_SIZE)
  };
}

function canvasPointForGrid(x, y) {
  return {
    x: x * CELL_SIZE,
    y: y * CELL_SIZE
  };
}

function buildGraph() {
  const graph = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => []);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const nodeId = nodeIdFor(x, y);

      if (x > 0) graph[nodeId].push(nodeIdFor(x - 1, y));
      if (x < GRID_SIZE - 1) graph[nodeId].push(nodeIdFor(x + 1, y));
      if (y > 0) graph[nodeId].push(nodeIdFor(x, y - 1));
      if (y < GRID_SIZE - 1) graph[nodeId].push(nodeIdFor(x, y + 1));
    }
  }

  return graph;
}

export function buildCityGraph() {
  return buildGraph();
}

export function dijkstra(graph, startNode, endNode) {
  if (startNode === endNode) {
    return { path: [startNode], distance: 0 };
  }

  const totalNodes = graph.length;
  const distances = Array(totalNodes).fill(Infinity);
  const previous = Array(totalNodes).fill(-1);
  const visited = Array(totalNodes).fill(false);

  distances[startNode] = 0;

  for (let step = 0; step < totalNodes; step += 1) {
    let currentNode = -1;
    let currentDistance = Infinity;

    for (let nodeId = 0; nodeId < totalNodes; nodeId += 1) {
      if (!visited[nodeId] && distances[nodeId] < currentDistance) {
        currentDistance = distances[nodeId];
        currentNode = nodeId;
      }
    }

    if (currentNode === -1 || currentNode === endNode) {
      break;
    }

    visited[currentNode] = true;

    for (const neighbor of graph[currentNode]) {
      if (visited[neighbor]) continue;
      const candidateDistance = distances[currentNode] + 1;

      if (candidateDistance < distances[neighbor]) {
        distances[neighbor] = candidateDistance;
        previous[neighbor] = currentNode;
      }
    }
  }

  if (!Number.isFinite(distances[endNode])) {
    return { path: [], distance: Infinity };
  }

  const path = [];
  let cursor = endNode;

  while (cursor !== -1) {
    path.unshift(cursor);
    cursor = previous[cursor];
  }

  return {
    path,
    distance: distances[endNode]
  };
}

export function getLocationByName(name) {
  return LOCATION_BY_NAME[name] || null;
}

export function buildRouteFromLocations(graph, startName, endName) {
  const start = getLocationByName(startName);
  const end = getLocationByName(endName);

  if (!start || !end) {
    return null;
  }

  const result = dijkstra(graph, nodeIdFor(start.x, start.y), nodeIdFor(end.x, end.y));

  return {
    start,
    end,
    path: result.path,
    distance: result.distance
  };
}

function getOverlapNodes(pathA = [], pathB = []) {
  if (!pathA.length || !pathB.length) return [];
  const pathBSet = new Set(pathB);
  return pathA.filter((nodeId) => pathBSet.has(nodeId));
}

function getOverlapSegments(pathA = [], pathB = []) {
  if (pathA.length < 2 || pathB.length < 2) return [];
  const pathBSegments = new Set();

  for (let index = 0; index < pathB.length - 1; index += 1) {
    const from = pathB[index];
    const to = pathB[index + 1];
    const key = from < to ? `${from}-${to}` : `${to}-${from}`;
    pathBSegments.add(key);
  }

  const overlap = [];

  for (let index = 0; index < pathA.length - 1; index += 1) {
    const from = pathA[index];
    const to = pathA[index + 1];
    const key = from < to ? `${from}-${to}` : `${to}-${from}`;

    if (pathBSegments.has(key)) {
      overlap.push([from, to]);
    }
  }

  return overlap;
}

function getLocationStatus({ location, pickup, drop, driverStart, driverEnd, hoveredLocation }) {
  if (pickup?.id === location.id) {
    return { fill: "#22c97a", glow: "rgba(34, 201, 122, 0.35)", badge: "Pickup" };
  }

  if (drop?.id === location.id) {
    return { fill: "#fb7185", glow: "rgba(251, 113, 133, 0.35)", badge: "Drop" };
  }

  if (driverStart?.id === location.id) {
    return { fill: "#22c97a", glow: "rgba(34, 201, 122, 0.35)", badge: "Start" };
  }

  if (driverEnd?.id === location.id) {
    return { fill: "#f59e0b", glow: "rgba(245, 158, 11, 0.35)", badge: "End" };
  }

  if (hoveredLocation?.id === location.id) {
    return { fill: location.color, glow: "rgba(79, 142, 247, 0.28)", badge: "" };
  }

  return { fill: location.color, glow: "transparent", badge: "" };
}

function getVisiblePath(path, progress) {
  if (!path?.length) return [];
  if (path.length === 1) return path;
  const visibleSegments = Math.max(0, Math.floor(progress * (path.length - 1)));
  return path.slice(0, visibleSegments + 1);
}

function drawGrid(ctx) {
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  for (let index = 0; index < GRID_SIZE; index += 1) {
    const offset = index * CELL_SIZE;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, CANVAS_SIZE - CELL_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(CANVAS_SIZE - CELL_SIZE, offset);
    ctx.stroke();
  }
}

function drawGridDots(ctx) {
  ctx.fillStyle = "rgba(255,255,255,0.12)";

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const point = canvasPointForGrid(x, y);
      ctx.beginPath();
      ctx.arc(point.x, point.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawNodePath(ctx, nodes, color, lineWidth, options = {}) {
  if (!nodes.length) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash(options.dashed || []);
  ctx.globalAlpha = options.opacity ?? 1;

  if (nodes.length > 1) {
    const firstPoint = canvasPointForGrid(coordsForNode(nodes[0]).x, coordsForNode(nodes[0]).y);
    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let index = 1; index < nodes.length; index += 1) {
      const pointCoords = coordsForNode(nodes[index]);
      const point = canvasPointForGrid(pointCoords.x, pointCoords.y);
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
  }

  ctx.restore();
}

function drawOverlapSegments(ctx, segments, opacity) {
  if (!segments.length || opacity <= 0) return;

  ctx.save();
  ctx.strokeStyle = "#a78bfa";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = opacity;

  for (const [from, to] of segments) {
    const fromCoords = coordsForNode(from);
    const toCoords = coordsForNode(to);
    const start = canvasPointForGrid(fromCoords.x, fromCoords.y);
    const end = canvasPointForGrid(toCoords.x, toCoords.y);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMarker(ctx, location, status, pulseScale = 1) {
  const point = canvasPointForGrid(location.x, location.y);

  if (status.glow !== "transparent") {
    ctx.save();
    ctx.fillStyle = status.glow;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 15 * pulseScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(pulseScale, pulseScale);

  ctx.fillStyle = status.fill;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawLabel(ctx, location, status) {
  const point = canvasPointForGrid(location.x, location.y);
  const badge = status.badge ? ` ${status.badge}` : "";
  const text = `${location.name}${badge}`;

  ctx.save();
  ctx.font = "600 12px 'DM Sans', sans-serif";
  ctx.textBaseline = "middle";
  const textWidth = ctx.measureText(text).width;
  const pillWidth = textWidth + 18;
  const pillHeight = 24;
  const pillX = Math.min(Math.max(point.x + 10, 10), CANVAS_SIZE - pillWidth - 10);
  const pillY = Math.min(Math.max(point.y - 24, 10), CANVAS_SIZE - pillHeight - 10);

  ctx.fillStyle = "rgba(7, 11, 17, 0.86)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 12);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 12);
  ctx.stroke();

  ctx.fillStyle = status.badge ? "#ffffff" : "rgba(239, 244, 255, 0.78)";
  ctx.fillText(text, pillX + 9, pillY + pillHeight / 2);
  ctx.restore();
}

function getResponsiveWidth() {
  if (typeof window === "undefined") {
    return CANVAS_SIZE;
  }

  if (window.innerWidth < 600) {
    return Math.max(288, Math.min(CANVAS_SIZE, window.innerWidth - 32));
  }

  return CANVAS_SIZE;
}

function createEmptyScene() {
  return {
    riderPath: [],
    riderDistance: 0,
    riderOpacity: 0,
    riderProgress: 1,
    riderPulse: 1,
    driverPath: [],
    driverDistance: 0,
    driverOpacity: 0,
    driverProgress: 1,
    driverPulse: 1,
    overlapOpacity: 0
  };
}

function CityMap({
  onRideRequest,
  onTripCreate,
  initialMode = "rider",
  existingDriverRoute,
  existingRiderPath,
  readOnly = false,
  compact = false
}) {
  const graph = useMemo(() => buildGraph(), []);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const sceneRef = useRef(createEmptyScene());
  const lastTouchRef = useRef(0);
  const [mode, setMode] = useState(initialMode);
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [driverStart, setDriverStart] = useState(null);
  const [driverEnd, setDriverEnd] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [animationFrame, setAnimationFrame] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(getResponsiveWidth);
  const [scene, setScene] = useState(createEmptyScene);
  const [riderSubmitted, setRiderSubmitted] = useState(null);
  const [driverPublished, setDriverPublished] = useState(null);

  const riderSelection = useMemo(() => {
    if (!pickup || !drop) return null;
    const result = dijkstra(graph, nodeIdFor(pickup.x, pickup.y), nodeIdFor(drop.x, drop.y));
    return {
      pickup,
      drop,
      path: result.path,
      distance: result.distance
    };
  }, [graph, pickup, drop]);

  const driverSelection = useMemo(() => {
    if (!driverStart || !driverEnd) return null;
    const result = dijkstra(graph, nodeIdFor(driverStart.x, driverStart.y), nodeIdFor(driverEnd.x, driverEnd.y));
    return {
      start: driverStart,
      end: driverEnd,
      path: result.path,
      distance: result.distance
    };
  }, [graph, driverStart, driverEnd]);

  const externalDriverRoute = useMemo(() => {
    if (!existingDriverRoute?.path?.length) return null;
    return {
      start: existingDriverRoute.startName ? getLocationByName(existingDriverRoute.startName) : null,
      end: existingDriverRoute.endName ? getLocationByName(existingDriverRoute.endName) : null,
      path: existingDriverRoute.path,
      distance: existingDriverRoute.distance ?? Math.max(existingDriverRoute.path.length - 1, 0)
    };
  }, [existingDriverRoute]);

  const externalRiderRoute = useMemo(() => {
    if (!existingRiderPath?.path?.length) return null;
    return {
      pickup: existingRiderPath.pickupName ? getLocationByName(existingRiderPath.pickupName) : null,
      drop: existingRiderPath.dropName ? getLocationByName(existingRiderPath.dropName) : null,
      path: existingRiderPath.path,
      distance: existingRiderPath.distance ?? Math.max(existingRiderPath.path.length - 1, 0)
    };
  }, [existingRiderPath]);

  const activeRiderRoute = riderSelection || externalRiderRoute;
  const activeDriverRoute = driverSelection || externalDriverRoute;

  const overlapStats = useMemo(() => {
    const riderPath = activeRiderRoute?.path || [];
    const driverPath = activeDriverRoute?.path || [];
    const overlapNodes = getOverlapNodes(riderPath, driverPath);

    return {
      overlapNodes,
      overlapHops: Math.max(overlapNodes.length - 1, 0),
      riderHops: activeRiderRoute?.distance || 0,
      percentage:
        activeRiderRoute?.distance > 0 ? ((Math.max(overlapNodes.length - 1, 0) / activeRiderRoute.distance) * 100).toFixed(1) : "0.0"
    };
  }, [activeDriverRoute, activeRiderRoute]);

  const canvasStyle = useMemo(
    () => ({
      width: `${viewportWidth}px`,
      height: `${viewportWidth}px`
    }),
    [viewportWidth]
  );

  useEffect(() => {
    function handleResize() {
      setViewportWidth(getResponsiveWidth());
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const targetScene = {
      riderPath: activeRiderRoute?.path || [],
      riderDistance: activeRiderRoute?.distance || 0,
      riderOpacity: activeRiderRoute?.path?.length ? 1 : 0,
      riderProgress: 1,
      riderPulse: 1,
      driverPath: activeDriverRoute?.path || [],
      driverDistance: activeDriverRoute?.distance || 0,
      driverOpacity: activeDriverRoute?.path?.length ? 1 : 0,
      driverProgress: 1,
      driverPulse: 1,
      overlapOpacity: activeRiderRoute?.path?.length && activeDriverRoute?.path?.length ? 1 : 0
    };

    const previous = sceneRef.current;
    const previousSignature = JSON.stringify({
      riderPath: previous.riderPath,
      driverPath: previous.driverPath
    });
    const nextSignature = JSON.stringify({
      riderPath: targetScene.riderPath,
      driverPath: targetScene.driverPath
    });

    if (previousSignature === nextSignature) {
      setScene((current) => ({
        ...current,
        riderDistance: targetScene.riderDistance,
        driverDistance: targetScene.driverDistance,
        overlapOpacity: targetScene.overlapOpacity
      }));
      return undefined;
    }

    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
    }

    function animateEntry() {
      const entryStart = performance.now();

      function step(timestamp) {
        const elapsed = timestamp - entryStart;
        const traceProgress = Math.min(elapsed / TRACE_DURATION, 1);
        const pulseWindow = Math.max(0, Math.min((elapsed - TRACE_DURATION) / PULSE_DURATION, 1));
        const pulse = pulseWindow > 0 ? 1 + 0.22 * Math.sin(pulseWindow * Math.PI) : 1;

        const next = {
          riderPath: targetScene.riderPath,
          riderDistance: targetScene.riderDistance,
          riderOpacity: targetScene.riderOpacity,
          riderProgress: targetScene.riderPath.length ? traceProgress : 1,
          riderPulse: targetScene.riderPath.length ? pulse : 1,
          driverPath: targetScene.driverPath,
          driverDistance: targetScene.driverDistance,
          driverOpacity: targetScene.driverOpacity,
          driverProgress: targetScene.driverPath.length ? traceProgress : 1,
          driverPulse: targetScene.driverPath.length ? pulse : 1,
          overlapOpacity: targetScene.overlapOpacity * traceProgress
        };

        setScene(next);

        if (elapsed < TRACE_DURATION + PULSE_DURATION) {
          animationRef.current = window.requestAnimationFrame(step);
          setAnimationFrame(animationRef.current);
        } else {
          sceneRef.current = next;
          setAnimationFrame(null);
        }
      }

      animationRef.current = window.requestAnimationFrame(step);
      setAnimationFrame(animationRef.current);
    }

    if (previous.riderPath.length || previous.driverPath.length) {
      const fadeStart = performance.now();

      function fade(timestamp) {
        const elapsed = timestamp - fadeStart;
        const fadeProgress = Math.min(elapsed / FADE_DURATION, 1);
        const opacity = 1 - fadeProgress;

        setScene({
          ...previous,
          riderOpacity: previous.riderPath.length ? opacity : 0,
          driverOpacity: previous.driverPath.length ? opacity : 0,
          overlapOpacity:
            previous.riderPath.length && previous.driverPath.length ? opacity : 0
        });

        if (fadeProgress < 1) {
          animationRef.current = window.requestAnimationFrame(fade);
          setAnimationFrame(animationRef.current);
        } else {
          animateEntry();
        }
      }

      animationRef.current = window.requestAnimationFrame(fade);
      setAnimationFrame(animationRef.current);
    } else {
      animateEntry();
    }

    return undefined;
  }, [activeDriverRoute, activeRiderRoute]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = "#0a0c10";
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawGrid(context);
    drawGridDots(context);

    const visibleDriverPath = getVisiblePath(scene.driverPath, scene.driverProgress);
    const visibleRiderPath = getVisiblePath(scene.riderPath, scene.riderProgress);

    drawNodePath(context, visibleDriverPath, "rgba(34, 201, 122, 0.7)", 5, {
      dashed: [8, 4],
      opacity: scene.driverOpacity
    });

    drawNodePath(context, visibleRiderPath, "rgba(79, 142, 247, 0.9)", 4, {
      opacity: scene.riderOpacity
    });

    const overlapSegments = getOverlapSegments(visibleRiderPath, visibleDriverPath);
    drawOverlapSegments(context, overlapSegments, scene.overlapOpacity);

    for (const location of LOCATIONS) {
      const status = getLocationStatus({
        location,
        pickup,
        drop,
        driverStart,
        driverEnd,
        hoveredLocation
      });

      let pulseScale = 1;

      if (drop?.id === location.id && scene.riderPath.length && scene.riderProgress >= 1) {
        pulseScale = scene.riderPulse;
      }

      if (driverEnd?.id === location.id && scene.driverPath.length && scene.driverProgress >= 1) {
        pulseScale = Math.max(pulseScale, scene.driverPulse);
      }

      drawMarker(context, location, status, pulseScale);
    }

    for (const location of LOCATIONS) {
      const status = getLocationStatus({
        location,
        pickup,
        drop,
        driverStart,
        driverEnd,
        hoveredLocation
      });
      drawLabel(context, location, status);
    }
  }, [drop, driverEnd, driverStart, hoveredLocation, pickup, scene]);

  function getLocationFromEvent(event) {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const client = "touches" in event && event.touches?.length ? event.touches[0] : event;
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const x = (client.clientX - rect.left) * scaleX;
    const y = (client.clientY - rect.top) * scaleY;

    return (
      LOCATIONS.find((location) => {
        const point = canvasPointForGrid(location.x, location.y);
        const distance = Math.hypot(point.x - x, point.y - y);
        return distance <= LOCATION_HIT_RADIUS;
      }) || null
    );
  }

  function handlePointerMove(event) {
    if (readOnly) return;
    const location = getLocationFromEvent(event);
    setHoveredLocation(location);

    if (canvasRef.current) {
      canvasRef.current.style.cursor = location ? "pointer" : "default";
    }
  }

  function handlePointerLeave() {
    setHoveredLocation(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default";
    }
  }

  function handleMapSelect(event) {
    if (readOnly) return;
    if ("touches" in event) {
      lastTouchRef.current = Date.now();
      event.preventDefault();
    } else if (Date.now() - lastTouchRef.current < 500) {
      return;
    }

    const location = getLocationFromEvent(event);
    if (!location) return;

    if (mode === "rider") {
      setDriverPublished(null);

      if (!pickup || (pickup && drop)) {
        setPickup(location);
        setDrop(null);
        setRiderSubmitted(null);
        return;
      }

      if (pickup.id !== location.id) {
        setDrop(location);
        setRiderSubmitted(null);
      }

      return;
    }

    setRiderSubmitted(null);

    if (!driverStart || (driverStart && driverEnd)) {
      setDriverStart(location);
      setDriverEnd(null);
      setDriverPublished(null);
      return;
    }

    if (driverStart.id !== location.id) {
      setDriverEnd(location);
      setDriverPublished(null);
    }
  }

  function switchMode(nextMode) {
    if (readOnly || nextMode === mode) return;

    setMode(nextMode);
    setHoveredLocation(null);

    if (nextMode === "rider") {
      setDriverStart(null);
      setDriverEnd(null);
      setDriverPublished(null);
    } else {
      setPickup(null);
      setDrop(null);
      setRiderSubmitted(null);
    }
  }

  function handleRideSubmit() {
    if (!riderSelection) return;

    const payload = {
      pickupId: riderSelection.pickup.id,
      dropId: riderSelection.drop.id,
      pickupName: riderSelection.pickup.name,
      dropName: riderSelection.drop.name,
      path: riderSelection.path,
      distance: riderSelection.distance
    };

    setRiderSubmitted(payload);
    onRideRequest?.(payload);
  }

  function handleTripSubmit() {
    if (!driverSelection) return;

    const payload = {
      startId: driverSelection.start.id,
      endId: driverSelection.end.id,
      startName: driverSelection.start.name,
      endName: driverSelection.end.name,
      routePath: driverSelection.path,
      distance: driverSelection.distance
    };

    setDriverPublished(payload);
    onTripCreate?.(payload);
  }

  function renderReadOnlyPanel() {
    const riderSummary = activeRiderRoute
      ? `${activeRiderRoute.pickup?.name || "Rider start"} -> ${activeRiderRoute.drop?.name || "Rider end"}`
      : "No rider path available";
    const driverSummary = activeDriverRoute
      ? `${activeDriverRoute.start?.name || "Driver start"} -> ${activeDriverRoute.end?.name || "Driver end"}`
      : "No driver route available";

    return (
      <div className="city-map__panel">
        <div className="city-map__panel-title">Match visualization</div>
        <div className="city-map__panel-copy">
          Canvas proof of the route geometry driving the score, with rider demand in blue and the matched driver route in green.
        </div>
        <div className="city-map__summary-grid">
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Rider path</span>
            <strong>{riderSummary}</strong>
          </div>
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Driver route</span>
            <strong>{driverSummary}</strong>
          </div>
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Rider hops</span>
            <strong>{activeRiderRoute?.distance ?? 0}</strong>
          </div>
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Overlap</span>
            <strong>
              {overlapStats.overlapHops} hops ({overlapStats.percentage}%)
            </strong>
          </div>
        </div>
      </div>
    );
  }

  function renderRiderPanel() {
    if (riderSubmitted) {
      return (
        <div className="city-map__panel">
          <div className="city-map__panel-title">Ride request queued</div>
          <div className="city-map__summary-grid">
            <div className="city-map__summary-item">
              <span className="city-map__summary-label">Pickup</span>
              <strong>{riderSubmitted.pickupName}</strong>
            </div>
            <div className="city-map__summary-item">
              <span className="city-map__summary-label">Drop</span>
              <strong>{riderSubmitted.dropName}</strong>
            </div>
            <div className="city-map__summary-item">
              <span className="city-map__summary-label">Path length</span>
              <strong>{riderSubmitted.distance} hops</strong>
            </div>
            <div className="city-map__summary-item">
              <span className="city-map__summary-label">ETA</span>
              <strong>{riderSubmitted.distance * 2} min</strong>
            </div>
          </div>
        </div>
      );
    }

    if (!pickup) {
      return (
        <div className="city-map__panel">
          <div className="city-map__panel-title">Rider mode</div>
          <div className="city-map__panel-copy">Click a location to set your pickup point.</div>
        </div>
      );
    }

    if (!drop) {
      return (
        <div className="city-map__panel">
          <div className="city-map__panel-title">Pickup locked</div>
          <div className="city-map__panel-copy">Pickup: {pickup.name} — now click your destination.</div>
        </div>
      );
    }

    return (
      <div className="city-map__panel">
        <div className="city-map__panel-title">Shortest path ready</div>
        <div className="city-map__summary-grid">
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Pickup</span>
            <strong>{pickup.name}</strong>
          </div>
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Drop</span>
            <strong>{drop.name}</strong>
          </div>
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Distance</span>
            <strong>{riderSelection?.distance ?? 0} hops</strong>
          </div>
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Estimated time</span>
            <strong>{(riderSelection?.distance ?? 0) * 2} minutes</strong>
          </div>
        </div>

        {activeDriverRoute?.path?.length ? (
          <div className="city-map__match-insight">
            <strong>Route overlap: {overlapStats.overlapHops} hops out of {overlapStats.riderHops} total rider hops</strong>
            <span>{overlapStats.percentage}% overlap — this is the matchmaking engine’s core route score.</span>
          </div>
        ) : null}

        <div className="city-map__actions">
          <button className="button" type="button" onClick={handleRideSubmit}>
            Submit Ride Request
          </button>
        </div>
      </div>
    );
  }

  function renderDriverPanel() {
    if (driverPublished) {
      return (
        <div className="city-map__panel">
          <div className="city-map__panel-title">Trip published</div>
          <div className="city-map__summary-grid">
            <div className="city-map__summary-item">
              <span className="city-map__summary-label">Route</span>
              <strong>
                {`${driverPublished.startName} -> ${driverPublished.endName}`}
              </strong>
            </div>
            <div className="city-map__summary-item">
              <span className="city-map__summary-label">Length</span>
              <strong>{driverPublished.distance} hops</strong>
            </div>
          </div>
        </div>
      );
    }

    if (!driverStart) {
      return (
        <div className="city-map__panel">
          <div className="city-map__panel-title">Driver mode</div>
          <div className="city-map__panel-copy">Click a location to set your route start.</div>
        </div>
      );
    }

    if (!driverEnd) {
      return (
        <div className="city-map__panel">
          <div className="city-map__panel-title">Route start locked</div>
          <div className="city-map__panel-copy">Route start: {driverStart.name} — click your destination.</div>
        </div>
      );
    }

    return (
      <div className="city-map__panel">
        <div className="city-map__panel-title">Driver route ready</div>
        <div className="city-map__summary-grid">
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Driver route</span>
            <strong>
              {`${driverStart.name} -> ${driverEnd.name}`}
            </strong>
          </div>
          <div className="city-map__summary-item">
            <span className="city-map__summary-label">Route length</span>
            <strong>{driverSelection?.distance ?? 0} hops</strong>
          </div>
        </div>
        <div className="city-map__match-insight">
          <strong>You can pick up riders anywhere along this route.</strong>
          <span>The green dashed trace is the exact graph path the matching engine can compare against rider demand.</span>
        </div>
        {activeRiderRoute?.path?.length ? (
          <div className="city-map__match-insight city-map__match-insight--accent">
            <strong>Route overlap: {overlapStats.overlapHops} hops out of {overlapStats.riderHops} total rider hops</strong>
            <span>{overlapStats.percentage}% overlap — make this obvious to drivers because it directly boosts match strength.</span>
          </div>
        ) : null}
        <div className="city-map__actions">
          <button className="button" type="button" onClick={handleTripSubmit}>
            Publish This Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className={`city-map ${compact ? "city-map--compact" : ""} ${readOnly ? "city-map--readonly" : ""}`}>
      {!readOnly ? (
        <div className="city-map__controls">
          <button
            className={`city-map__tab ${mode === "rider" ? "city-map__tab--active" : ""}`}
            type="button"
            onClick={() => switchMode("rider")}
          >
            Rider mode
          </button>
          <button
            className={`city-map__tab ${mode === "driver" ? "city-map__tab--active" : ""}`}
            type="button"
            onClick={() => switchMode("driver")}
          >
            Driver mode
          </button>
          <span className="city-map__legend">900-node grid graph · Dijkstra pathfinding · canvas animation</span>
        </div>
      ) : null}

      <div className="city-map__viewport">
        <canvas
          ref={canvasRef}
          className="city-map__canvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={canvasStyle}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          onClick={handleMapSelect}
          onTouchStart={handleMapSelect}
          aria-label="Interactive city route map"
          role="img"
        />
        {!readOnly ? (
          <div className="city-map__hud">
            <span>{hoveredLocation ? hoveredLocation.name : "Hover a node-linked location"}</span>
            <span>{animationFrame ? "Animating route..." : "Ready"}</span>
          </div>
        ) : null}
      </div>

      {readOnly ? renderReadOnlyPanel() : mode === "rider" ? renderRiderPanel() : renderDriverPanel()}
    </section>
  );
}

export default CityMap;
