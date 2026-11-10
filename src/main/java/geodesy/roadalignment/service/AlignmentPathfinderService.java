/*
Finds paths through a terrain routing graph
*/

package geodesy.roadalignment.service;

import geodesy.roadalignment.config.AlignmentProperties;
import geodesy.roadalignment.model.ProjectPoint;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AlignmentPathfinderService {

    private final AlignmentProperties alignmentProperties;

    public AlignmentPathfinderService(AlignmentProperties alignmentProperties) {
        this.alignmentProperties = alignmentProperties;
    }

    // finds the lowest-cost path between 2 graph nodes
    public List<Integer> findPath(TerrainRoutingGraph graph,
                                  int startId,
                                  int endId,
                                  ProjectPoint start,
                                  ProjectPoint end,
                                  Map<Long, Integer> edgeUsage) {

        int nodeCount = graph.getNodeCount();

        double[] costs = new double[nodeCount];
        int[] previous = new int[nodeCount];
        boolean[] visited = new boolean[nodeCount];

        Arrays.fill(costs, Double.POSITIVE_INFINITY);
        Arrays.fill(previous, -1);

        PriorityQueue<SearchState> open = new PriorityQueue<>(Comparator.comparingDouble(SearchState::estimatedTotalCost));

        costs[startId] = 0.0;

        open.add(new SearchState(startId, 0.0, heuristic(graph.getNode(startId), graph.getNode(endId))));

        while (!open.isEmpty()) {
            SearchState state = open.poll();
            int currentId = state.nodeId();

            if (Double.compare(state.costSoFar(), costs[currentId]) > 0) {
                continue;
            }

            if (visited[currentId]) {
                continue;
            }

            if (currentId == endId) {
                return reconstructPath(previous, endId);
            }

            visited[currentId] = true;

            ProjectPoint current = graph.getNode(currentId);

            for (int neighborId : graph.getNeighbors(currentId)) {
                if (visited[neighborId]) {
                    continue;
                }

                ProjectPoint neighbor = graph.getNode(neighborId);

                double edgeCost = calculateEdgeCost(current, neighbor, start, end);

                if (!Double.isFinite(edgeCost) || edgeCost < 0.0) {
                    continue;
                }

                int uses = edgeUsage.getOrDefault(TerrainRoutingGraph.edgeKey(currentId, neighborId), 0);

                if (uses > 0) {
                    double reusePenalty = Math.pow(alignmentProperties.reusedEdgePenalty(), uses);

                    if (!Double.isFinite(reusePenalty)) {
                        continue;
                    }

                    edgeCost *= reusePenalty;

                    if (!Double.isFinite(edgeCost)) {
                        continue;
                    }
                }

                double tentativeCost = costs[currentId] + edgeCost;

                if (!Double.isFinite(tentativeCost)) {
                    continue;
                }

                if (tentativeCost < costs[neighborId]) {
                    costs[neighborId] = tentativeCost;
                    previous[neighborId] = currentId;

                    double estimatedTotal = tentativeCost + heuristic(neighbor, graph.getNode(endId));

                    if (!Double.isFinite(estimatedTotal)) {
                        continue;
                    }

                    open.add(new SearchState(neighborId, tentativeCost, estimatedTotal));
                }
            }
        }

        return Collections.emptyList();
    }

    // calculates
    private double calculateEdgeCost(
            ProjectPoint first,
            ProjectPoint second,
            ProjectPoint start,
            ProjectPoint end) {

        double length = distance2D(first, second);

        if (length < alignmentProperties.samePointTolerance()) {
            return 0.0;
        }

        double slope = Math.abs(second.z() - first.z()) / length;

        double referenceAverage = (referenceElevation(first, start, end) + referenceElevation(second, start, end)) / 2.0;

        double terrainAverage = (first.z() + second.z()) / 2.0;

        double excessElevation = Math.max(0.0, terrainAverage - referenceAverage);

        double normalizedExcess = excessElevation / alignmentProperties.elevationScale();

        double slopePenalty = alignmentProperties.slopeWeight() * slope * slope;

        double elevationPenalty = alignmentProperties.elevationWeight()
                * normalizedExcess * normalizedExcess;

        double cost = length * (1.0 + slopePenalty + elevationPenalty);

        return Double.isFinite(cost) ? cost : Double.POSITIVE_INFINITY;
    }

    // calculates interpolated reference elevation at a point
    private double referenceElevation(ProjectPoint point, ProjectPoint start, ProjectPoint end) {

        double dx = end.x() - start.x();
        double dy = end.y() - start.y();

        double length = Math.hypot(dx, dy);

        if (length < alignmentProperties.samePointTolerance()) {
            return start.z();
        }

        double unitX = dx / length;
        double unitY = dy / length;

        double projectionDistance = ((point.x() - start.x()) * unitX + (point.y() - start.y()) * unitY);

        double fraction = projectionDistance / length;

        fraction = Math.max(0.0, Math.min(1.0, fraction));

        return start.z() + fraction * (end.z() - start.z());
    }

    // estimates the remaining cost using horizontal Euclidean distance
    private double heuristic(ProjectPoint first, ProjectPoint second) {

        return distance2D(first, second);
    }

    // reconstructs the path
    private List<Integer> reconstructPath(int[] previous, int endId) {

        List<Integer> path = new ArrayList<>();
        int current = endId;

        while (current != -1) {
            path.add(current);
            current = previous[current];
        }

        Collections.reverse(path);
        return path;
    }

    // calculates horizontal Euclidean distance between 2 points
    private double distance2D(ProjectPoint first, ProjectPoint second) {

        return Math.hypot(first.x() - second.x(), first.y() - second.y());
    }

    // represents a node currently considered by algorithm
    private record SearchState(
            int nodeId,
            double costSoFar,
            double estimatedTotalCost
    ) {
    }
}
