/*
Generates alternatives between two selected points
*/

package geodesy.roadalignment.service;

import geodesy.roadalignment.config.AlignmentProperties;
import geodesy.roadalignment.model.ProjectPoint;
import geodesy.roadalignment.model.Triangle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AlignmentRouteGenerationService {

    private static final Logger logger = LoggerFactory.getLogger(AlignmentRouteGenerationService.class);

    private static final double COLLINEARITY_TOLERANCE = 1e-9;

    private final TerrainRoutingGraphService routingGraphService;
    private final AlignmentPathfinderService pathfinderService;
    private final AlignmentProperties alignmentProperties;

    public AlignmentRouteGenerationService(TerrainRoutingGraphService routingGraphService,
                                           AlignmentPathfinderService pathfinderService,
                                           AlignmentProperties alignmentProperties) {
        this.routingGraphService = routingGraphService;
        this.pathfinderService = pathfinderService;
        this.alignmentProperties = alignmentProperties;
    }

    public List<List<ProjectPoint>> generateAlternatives(ProjectPoint start, ProjectPoint end, List<Triangle> triangles) {

        validateEndpoints(start, end);

        if (distance2D(start, end) <= alignmentProperties.samePointTolerance()) {
            throw new IllegalArgumentException("The start and end points must be different.");
        }

        TerrainRoutingGraph graph = routingGraphService.buildRoutingGraph(triangles);

        int startId = graph.addNode(start);
        int endId = graph.addNode(end);

        connectEndpointToGrid(graph, startId);
        connectEndpointToGrid(graph, endId);

        if (distance2D(start, end) <= graph.getGridSpacing() * 2.0) {
            graph.addUndirectedEdge(startId, endId);
        }

        List<List<ProjectPoint>> alternatives = new ArrayList<>();

        Set<String> signatures = new HashSet<>();
        Map<Long, Integer> edgeUsage = new HashMap<>();

        for (int attempt = 0;
             attempt < alignmentProperties.maxSearchAttempts()
                     && alternatives.size() < alignmentProperties.maxAlternatives();
             attempt++) {

            List<Integer> path = pathfinderService.findPath(graph, startId, endId, start, end, edgeUsage);

            if (path.isEmpty()) {
                break;
            }

            List<ProjectPoint> route = simplifyPath(convertPathToPoints(graph, path, start, end));

            String signature = createRouteSignature(route);

            // accept each geometrically unique route only once
            if (signatures.add(signature)) {
                alternatives.add(route);
            }

            // penalize every edge from the attempted path.
            for (int i = 0; i < path.size() - 1; i++) {
                long key = TerrainRoutingGraph.edgeKey(
                        path.get(i),
                        path.get(i + 1)
                );

                edgeUsage.merge(key, 1, Integer::sum);
            }
        }

        logger.debug("Alignment route generation completed: {} alternative(s) found after a maximum of {} search attempts.",
                alternatives.size(), alignmentProperties.maxSearchAttempts());

        return alternatives.stream().map(List::copyOf).toList();
    }

    // validates the selected endpoints coordinates
    private void validateEndpoints(ProjectPoint start, ProjectPoint end) {

        if (start == null || end == null) {
            throw new IllegalArgumentException("Start and end points are required.");
        }

        if (!Double.isFinite(start.x())
                || !Double.isFinite(start.y())
                || !Double.isFinite(start.z())
                || !Double.isFinite(end.x())
                || !Double.isFinite(end.y())
                || !Double.isFinite(end.z())) {

            throw new IllegalArgumentException("Start and end coordinates must be finite.");
        }
    }

    //
    private void connectEndpointToGrid(TerrainRoutingGraph graph, int endpointId) {

        ProjectPoint endpoint = graph.getNode(endpointId);

        List<Integer> candidates = new ArrayList<>();

        // search only terrain nodes, excluding virtual endpoint nodes
        for (int nodeId = 0; nodeId < graph.getGridNodeCount(); nodeId++) {
            ProjectPoint candidate = graph.getNode(nodeId);

            if (distance2D(endpoint, candidate) <= graph.getGridSpacing() * 2.0) {
                candidates.add(nodeId);
            }
        }

        candidates.sort(Comparator.comparingDouble(nodeId -> distance2D(endpoint, graph.getNode(nodeId))));

        int limit = Math.min(alignmentProperties.maxEndpointConnections(), candidates.size());

        for (int i = 0; i < limit; i++) {
            graph.addUndirectedEdge(endpointId, candidates.get(i));
        }
    }

    // converts graph nodes identifiers into route coordinates
    private List<ProjectPoint> convertPathToPoints(TerrainRoutingGraph graph, List<Integer> path, ProjectPoint start, ProjectPoint end) {

        List<ProjectPoint> points = new ArrayList<>();
        points.add(start);

        for (int i = 1; i < path.size() - 1; i++) {
            points.add(graph.getNode(path.get(i)));
        }

        points.add(end);

        return points;
    }

    // removes points that do not change the route direction
    private List<ProjectPoint> simplifyPath(List<ProjectPoint> points) {

        if (points.size() <= 2) {
            return points;
        }

        List<ProjectPoint> simplified = new ArrayList<>();
        simplified.add(points.getFirst());

        for (int i = 1; i < points.size() - 1; i++) {
            ProjectPoint previous = simplified.getLast();
            ProjectPoint current = points.get(i);
            ProjectPoint next = points.get(i + 1);

            double firstDx = current.x() - previous.x();
            double firstDy = current.y() - previous.y();

            double secondDx = next.x() - current.x();
            double secondDy = next.y() - current.y();

            double cross = firstDx * secondDy - firstDy * secondDx;
            double dot = firstDx * secondDx + firstDy * secondDy;

            double firstLength = Math.hypot(firstDx, firstDy);
            double secondLength = Math.hypot(secondDx, secondDy);

            boolean hasNonZeroSegments = firstLength > 0.0 && secondLength > 0.0;

            boolean isCollinear = hasNonZeroSegments && Math.abs(cross) <= COLLINEARITY_TOLERANCE * firstLength * secondLength;

            if (!isCollinear || dot < 0.0) {
                simplified.add(current);
            }
        }

        simplified.add(points.getLast());

        return simplified;
    }

    // creates a signature to identify duplicate routes
    private String createRouteSignature(List<ProjectPoint> route) {

        StringBuilder signature = new StringBuilder();

        for (ProjectPoint point : route) {
            signature.append(Math.round(point.x() * 1000))
                    .append(',')
                    .append(Math.round(point.y() * 1000))
                    .append(';');
        }

        return signature.toString();
    }

    private double distance2D(ProjectPoint first, ProjectPoint second) {
        return Math.hypot(
                first.x() - second.x(),
                first.y() - second.y()
        );
    }
}
