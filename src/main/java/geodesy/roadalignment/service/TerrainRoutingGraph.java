/**/

package geodesy.roadalignment.service;

import geodesy.roadalignment.model.ProjectPoint;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

final class TerrainRoutingGraph {

    private final List<ProjectPoint> nodes = new ArrayList<>();
    private final List<Set<Integer>> adjacency = new ArrayList<>();

    private final double gridSpacing;

    private int gridNodeCount;

    TerrainRoutingGraph(double gridSpacing) {

        this.gridSpacing = gridSpacing;
    }

    int addNode(ProjectPoint point) {
        int id = nodes.size();

        nodes.add(point);
        adjacency.add(new HashSet<>());

        return id;
    }

    void addUndirectedEdge(int firstId, int secondId) {
        if (firstId == secondId) {
            return;
        }

        adjacency.get(firstId).add(secondId);
        adjacency.get(secondId).add(firstId);
    }

    ProjectPoint getNode(int nodeId) {
        return nodes.get(nodeId);
    }

    Set<Integer> getNeighbors(int nodeId) {
        return adjacency.get(nodeId);
    }

    int getNodeCount() {
        return nodes.size();
    }

    int getGridNodeCount() {
        return gridNodeCount;
    }

    void setGridNodeCount(int gridNodeCount) {
        this.gridNodeCount = gridNodeCount;
    }

    double getGridSpacing() {
        return gridSpacing;
    }

    static long edgeKey(int firstId, int secondId) {
        int low = Math.min(firstId, secondId);
        int high = Math.max(firstId, secondId);

        return ((long)low << 32 | (high & 0xffffffffL));
    }
}
