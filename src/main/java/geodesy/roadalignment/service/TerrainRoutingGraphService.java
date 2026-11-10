/*
Builds a routing graph over the TIN terrain surface
Creates regularly spaced nodes, obtains their elevations from terrain surface,
and connects neighboring nodes
*/

package geodesy.roadalignment.service;

import geodesy.roadalignment.config.AlignmentProperties;
import geodesy.roadalignment.model.ProjectPoint;
import geodesy.roadalignment.model.TerrainPoint;
import geodesy.roadalignment.model.Triangle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TerrainRoutingGraphService {

    private static final Logger logger = LoggerFactory.getLogger(TerrainRoutingGraphService.class);

    private static final int[][] NEIGHBOR_DIRECTIONS = {
            {-1, -1}, {0, -1}, {1, -1},
            {-1,  0},          {1,  0},
            {-1,  1}, {0,  1}, {1,  1}
    };

    private final TerrainService terrainService;
    private final AlignmentProperties alignmentProperties;

    public TerrainRoutingGraphService(TerrainService terrainService, AlignmentProperties alignmentProperties) {
        this.terrainService = terrainService;
        this.alignmentProperties = alignmentProperties;
    }

    // builds a routing graph from TIN triangles
    public TerrainRoutingGraph buildRoutingGraph(List<Triangle> triangles) {

        validateTriangles(triangles);

        double[] bounds = findTerrainBounds(triangles);

        double minX = bounds[0];
        double minY = bounds[1];
        double width = bounds[2] - minX;
        double height = bounds[3] - minY;

        double gridSpacing = chooseGridSpacing(width, height);

        int columns = (int) gridDimension(width, gridSpacing);
        int rows = (int) gridDimension(height, gridSpacing);

        long potentialNodes = (long) columns * rows;

        logger.debug("Routing grid dimensions: spacing = {}, columns = {}, rows = {}, potentialNodes = {}",
                gridSpacing, columns, rows, potentialNodes);

        TerrainRoutingGraph graph = new TerrainRoutingGraph(gridSpacing);

        Map<String, Integer> nodeByGridPosition = new HashMap<>();
        List<Integer> gridNodeIds = new ArrayList<>();

        createGridNodes(graph, triangles, minX, minY, gridSpacing, columns, rows, nodeByGridPosition, gridNodeIds);

        // record the number of terrain nodes before virtual endpoints are added
        graph.setGridNodeCount(graph.getNodeCount());

        connectNeighboringNodes(graph, gridNodeIds, nodeByGridPosition, minX, minY, gridSpacing);

        logger.debug("Terrain routing graph created: {} usable nodes from {} possible grid positions.",
                graph.getGridNodeCount(), potentialNodes);

        if (graph.getGridNodeCount() == 0) {
            throw new IllegalArgumentException("No usable grid nodes could be generated inside the terrain.");
        }

        return graph;
    }

    // checks that TIN contains valid triangles and vertices
    private void validateTriangles(List<Triangle> triangles) {

        if (triangles == null || triangles.isEmpty()) {
            throw new IllegalArgumentException("Terrain triangles are required.");
        }

        for (Triangle triangle : triangles) {
            if (triangle == null || triangle.a() == null || triangle.b() == null || triangle.c() == null) {
                throw new IllegalArgumentException("Terrain triangles must contain three valid vertices.");
            }
        }
    }

    // determines the min and max x/y coordinates of the TIN
    private double[] findTerrainBounds(List<Triangle> triangles) {

        double minX = Double.POSITIVE_INFINITY;
        double minY = Double.POSITIVE_INFINITY;
        double maxX = Double.NEGATIVE_INFINITY;
        double maxY = Double.NEGATIVE_INFINITY;

        // Find the bounding rectangle of the terrain TIN.
        for (Triangle triangle : triangles) {
            TerrainPoint[] vertices = {
                    triangle.a(),
                    triangle.b(),
                    triangle.c()
            };

            for (TerrainPoint point : vertices) {
                minX = Math.min(minX, point.x());
                minY = Math.min(minY, point.y());
                maxX = Math.max(maxX, point.x());
                maxY = Math.max(maxY, point.y());
            }
        }

        return new double[]{minX, minY, maxX, maxY};
    }

    // creates regularly spaced nodes and retains only positions where terrain elevation can be interpolated
    private void createGridNodes(TerrainRoutingGraph graph,
                                 List<Triangle> triangles,
                                 double minX,
                                 double minY,
                                 double gridSpacing,
                                 int columns,
                                 int rows,
                                 Map<String, Integer> nodeByGridPosition,
                                 List<Integer> gridNodeIds) {

        for (int row = 0; row < rows; row++) {
            double y = minY + row * gridSpacing;

            for (int column = 0; column < columns; column++) {
                double x = minX + column * gridSpacing;

                try {
                    double z = terrainService.getElevation(x, y, triangles);
                    int nodeId = graph.addNode(new ProjectPoint(x, y, z));
                    gridNodeIds.add(nodeId);
                    nodeByGridPosition.put(gridKey(column, row), nodeId);

                } catch (IllegalArgumentException exception) {
                    // positions outside the TIN are not part of the routing graph
                }
            }
        }
    }

    // connects each terrain node to its possible neighboring positions
    private void connectNeighboringNodes(TerrainRoutingGraph graph,
                                         List<Integer> gridNodeIds,
                                         Map<String, Integer> nodeByGridPosition,
                                         double minX,
                                         double minY,
                                         double gridSpacing) {
        for (int nodeId : gridNodeIds) {

            ProjectPoint point = graph.getNode(nodeId);

            int column = (int) Math.round((point.x() - minX) / gridSpacing);
            int row = (int) Math.round((point.y() - minY) / gridSpacing);

            for (int[] direction : NEIGHBOR_DIRECTIONS) {
                int neighborColumn = column + direction[0];
                int neighborRow = row + direction[1];

                Integer neighborId = nodeByGridPosition.get(gridKey(neighborColumn, neighborRow));

                // adds each undirected connection only once
                if (neighborId != null && neighborId > nodeId) {
                    graph.addUndirectedEdge(nodeId, neighborId);
                }
            }
        }
    }

    // selects a grid spacing that keeps the rectangular grid within the configured maximum number of possible nodes
    private double chooseGridSpacing(double width, double height) {

        double spacing = alignmentProperties.gridSpacing();

        double columns = gridDimension(width, spacing);
        double rows = gridDimension(height, spacing);

        int maxGridNodes = alignmentProperties.maxGridNodes();

        // compare dimensions without multiplying them
        while (columns > maxGridNodes / rows) {

            spacing *= 1.25;

            if (!Double.isFinite(spacing)) {
                throw new IllegalArgumentException("A suitable terrain grid spacing could not be calculated.");
            }
            columns = gridDimension(width, spacing);
            rows = gridDimension(height, spacing);
        }
        return spacing;
    }

    // calculates the number of grid positions along one dimension
    private double gridDimension(double extent, double spacing) {

        return Math.floor(extent / spacing) + 1.0;
    }

    // creates a key identifying a grid position by its column and row
    private String gridKey(int column, int row) {

        return column + "," + row;
    }
}
