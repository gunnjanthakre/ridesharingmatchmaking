package com.example.ridesharing.dsa;

import java.util.*;

public class Graph {
    private final Map<String, List<Edge>> adjacencyList;

    public Graph() {
        this.adjacencyList = new HashMap<>();
    }

    public void addNode(String node) {
        adjacencyList.putIfAbsent(node, new ArrayList<>());
    }

    public void addEdge(String from, String to, double weight) {
        adjacencyList.putIfAbsent(from, new ArrayList<>());
        adjacencyList.putIfAbsent(to, new ArrayList<>());
        adjacencyList.get(from).add(new Edge(to, weight));
        adjacencyList.get(to).add(new Edge(from, weight)); // undirected
    }

    public Map<String, Double> dijkstra(String start) {
        Map<String, Double> distances = new HashMap<>();
        PriorityQueue<Node> pq = new PriorityQueue<>(
            Comparator.comparingDouble((Node n) -> n.distance).thenComparing(n -> n.name)
        );
        Set<String> visited = new HashSet<>();

        if (!adjacencyList.containsKey(start)) {
            return distances;
        }

        for (String node : adjacencyList.keySet()) {
            distances.put(node, Double.MAX_VALUE);
        }
        distances.put(start, 0.0);
        pq.add(new Node(start, 0.0));

        while (!pq.isEmpty()) {
            Node current = pq.poll();
            if (visited.contains(current.name)) continue;
            visited.add(current.name);

            for (Edge edge : adjacencyList.get(current.name)) {
                if (!visited.contains(edge.to)) {
                    double newDist = current.distance + edge.weight;
                    if (newDist < distances.get(edge.to)) {
                        distances.put(edge.to, newDist);
                        pq.add(new Node(edge.to, newDist));
                    }
                }
            }
        }
        return distances;
    }

    public List<String> getShortestPath(String start, String end) {
        if (!adjacencyList.containsKey(start) || !adjacencyList.containsKey(end)) {
            return Collections.emptyList();
        }

        if (start.equals(end)) {
            return List.of(start);
        }

        Map<String, Double> distances = new HashMap<>();
        Map<String, String> previous = new HashMap<>();
        PriorityQueue<Node> pq = new PriorityQueue<>(
            Comparator.comparingDouble((Node n) -> n.distance).thenComparing(n -> n.name)
        );
        Set<String> visited = new HashSet<>();

        for (String node : adjacencyList.keySet()) {
            distances.put(node, Double.MAX_VALUE);
        }

        distances.put(start, 0.0);
        pq.add(new Node(start, 0.0));

        while (!pq.isEmpty()) {
            Node current = pq.poll();
            if (!visited.add(current.name)) {
                continue;
            }

            if (current.name.equals(end)) {
                break;
            }

            for (Edge edge : adjacencyList.getOrDefault(current.name, Collections.emptyList())) {
                if (visited.contains(edge.to)) {
                    continue;
                }

                double newDist = current.distance + edge.weight;
                if (newDist < distances.get(edge.to)) {
                    distances.put(edge.to, newDist);
                    previous.put(edge.to, current.name);
                    pq.add(new Node(edge.to, newDist));
                }
            }
        }

        if (distances.get(end) == Double.MAX_VALUE) {
            return Collections.emptyList();
        }

        LinkedList<String> path = new LinkedList<>();
        String cursor = end;
        while (cursor != null) {
            path.addFirst(cursor);
            cursor = previous.get(cursor);
        }
        return path;
    }

    private static class Edge {
        String to;
        double weight;

        Edge(String to, double weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    private static class Node {
        String name;
        double distance;

        Node(String name, double distance) {
            this.name = name;
            this.distance = distance;
        }
    }
}
