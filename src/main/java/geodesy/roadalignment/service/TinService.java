/* --------------------------------------------------------------------------------
Triangulation
Generates a Delaunay Triangulated Irregular Network (TIN) from survey points;
Uses the Bowyer-Watson algorithm:
- incrementally inserts survey points,
- removes triangles whose circumcircles contain the inserted point,
- identifies the boundary of the resulting polyhonal hole,
- creates new triangles
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.service;

import geodesy.roadalignment.config.TerrainProperties;
import geodesy.roadalignment.model.TerrainPoint;
import geodesy.roadalignment.model.Triangle;
import geodesy.roadalignment.validation.TerrainPointValidator;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

@Service
public class TinService {

    private static final Logger logger = LoggerFactory.getLogger(TinService.class);

    private final TerrainPointValidator validationService;
    private final TerrainProperties terrainProperties;

    public TinService(TerrainPointValidator validationService, TerrainProperties terrainProperties) {
        this.validationService = validationService;
        this.terrainProperties = terrainProperties;
    }

    // triangulation method
    public List<Triangle> triangulate(List<TerrainPoint> points) {

        validationService.validatePoints(points);

        logger.info("Starting TIN triangulation for {} survey points.", points.size());

        validateNonCollinearPoints(points);

        List<Triangle> triangles = new ArrayList<>();

        // find coordinate boundaries
        double minX = points.stream().mapToDouble(TerrainPoint::x).min().orElseThrow();
        double maxX = points.stream().mapToDouble(TerrainPoint::x).max().orElseThrow();
        double minY = points.stream().mapToDouble(TerrainPoint::y).min().orElseThrow();
        double maxY = points.stream().mapToDouble(TerrainPoint::y).max().orElseThrow();

        double dx = maxX - minX;
        double dy = maxY - minY;
        double deltaMax = Math.max(dx, dy);

        double midX = (minX + maxX) / 2.0;
        double midY = (minY + maxY) / 2.0;

        // create a super-triangle around survey points
        double multiplier = terrainProperties.superTriangleMultiplier();
        TerrainPoint superA = new TerrainPoint("SUPER_A", midX - multiplier * deltaMax, midY - deltaMax, 0);
        TerrainPoint superB = new TerrainPoint("SUPER_B", midX, midY + multiplier * deltaMax, 0);
        TerrainPoint superC = new TerrainPoint("SUPER_C", midX + multiplier * deltaMax, midY - deltaMax, 0);

        triangles.add(new Triangle(superA, superB, superC));

        // add each survey point one at a time
        for (TerrainPoint point : points) {
            // exclude triangles outside point circumcircle
            List<Triangle> badTriangles = new ArrayList<>();
            for (Triangle triangle : triangles) {
                if (isPointInsideCircumcircle(point, triangle)) {
                    badTriangles.add(triangle);
                }
            }

            // a point must be in at least one triangle's circumcircle
            if (badTriangles.isEmpty()) {
                throw new IllegalStateException("Unable to insert terrain point into triangulation: " + point.id());
            }

            // find boundary edges for polygonal hole
            List<Edge> polygon = new ArrayList<>();
            for (Triangle triangle : badTriangles) {
                Edge edgeAB = new Edge(triangle.a(), triangle.b());
                Edge edgeBC = new Edge(triangle.b(), triangle.c());
                Edge edgeCA = new Edge(triangle.c(), triangle.a());

                addOrRemoveEdge(polygon, edgeAB);
                addOrRemoveEdge(polygon, edgeBC);
                addOrRemoveEdge(polygon, edgeCA);
            }

            triangles.removeAll(badTriangles);

            // create new triangles from the boundary
            for (Edge edge : polygon) {
                triangles.add(new Triangle(edge.a(), edge.b(), point));
            }
        }

        // remove triangles that contain one of super-triangle vertices
        triangles.removeIf(triangle ->
                triangle.a().id().startsWith("SUPER_")
                || triangle.b().id().startsWith("SUPER_")
                || triangle.c().id().startsWith("SUPER_"));

        if (triangles.isEmpty()) {
            throw new IllegalStateException("TIN triangulation produced no valid triangles.");
        }

        logger.info("TIN triangulation completed. Generated {} triangles.", triangles.size());

        return triangles;
    }

    // verifies if all survey points lie on the same straight line
    // perpendicular distance from each point to a reference line is compared with the configured coordinate tolerance
    private void validateNonCollinearPoints(List<TerrainPoint> points) {

        TerrainPoint first = points.get(0);

        // find the point farthest from the first point to define a reference line
        TerrainPoint farthest = first;
        double maximumDistanceSquared = 0.0;

        for (TerrainPoint point : points) {
            double dx = point.x() - first.x();
            double dy = point.y() - first.y();
            double distanceSquared = dx * dx + dy * dy;

            if (distanceSquared > maximumDistanceSquared) {
                maximumDistanceSquared = distanceSquared;
                farthest = point;
            }
        }

        double lineX = farthest.x() - first.x();
        double lineY = farthest.y() - first.y();
        double lineLength = Math.hypot(lineX, lineY);

        if (lineLength == 0.0) {
            throw new IllegalArgumentException("Terrain points do not define a valid two-dimentional area.");
        }

        double tolerance = terrainProperties.coordinateTolerance();

        for (TerrainPoint point : points) {

            double pointX = point.x() - first.x();
            double pointY = point.y() - first.y();

            double perpendicularDistance = Math.abs(lineX * pointY - lineY * pointX) / lineLength;

            if (perpendicularDistance > tolerance) {
                return;
            }
        }

        throw new IllegalArgumentException("Terrain points are collinear. A two-dimensional TIN cannot be created.");
    }

    // determines if a point lies inside or on the circumcircle of a triangle
    private boolean isPointInsideCircumcircle(TerrainPoint point, Triangle triangle) {
        double ax = triangle.a().x();
        double ay = triangle.a().y();

        double bx = triangle.b().x();
        double by = triangle.b().y();

        double cx = triangle.c().x();
        double cy = triangle.c().y();

        double px = point.x();
        double py = point.y();

        double denominator = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

        if (Math.abs(denominator) < 1e-10) {
            return false;
        }

        double centerX = ((ax * ax + ay * ay) * (by - cy)
                        + (bx * bx + by * by) * (cy - ay)
                        + (cx * cx + cy * cy) * (ay - by)
                        ) / denominator;

        double centerY = ((ax * ax + ay * ay) * (cx - bx)
                        + (bx * bx + by * by) * (ax - cx)
                        + (cx * cx + cy * cy) * (bx - ax)
        ) / denominator;

        double radiusSquared = Math.pow(centerX - ax, 2) + Math.pow(centerY - ay, 2);

        double distanceSquared = Math.pow(centerX - px, 2) + Math.pow(centerY - py, 2);

        return distanceSquared <= radiusSquared;
    }

    // an edge shared by two bad triangles is internal to the polygonal hole, and cannot be included in its boundary
    private void addOrRemoveEdge(List<Edge> edges, Edge edge) {
        for (int i = 0; i < edges.size(); i++) {
            Edge existing = edges.get(i);
            if (existing.sameEdge(edge)) {
                edges.remove(i);
                return;
            }
        }
        edges.add(edge);
    }

    // represents undirected edge between two terrain points
    private record Edge(TerrainPoint a, TerrainPoint b) {
        private boolean sameEdge(Edge other) {
            return (a.id().equals(other.a.id()) && b.id().equals(other.b.id())
                || (a.id().equals(other.b.id()) && b.id().equals(other.a.id())));
        }
    }
}
