/* --------------------------------------------------------------------------------
Interpolation
Calculates terrain elevations using barycentric interpolation;
Checks each triangle until it finds one containing the requested point,
barycentric coordinates are then used to interpolate its elevation;

- finds TIN triangle containing a given XY coordinate,
- calculates elevation at that coordinate using triangle's vertices
--------------------------------------------------------------------------------  */


package geodesy.roadalignment.service;

import geodesy.roadalignment.config.TerrainProperties;
import geodesy.roadalignment.model.TerrainPoint;
import geodesy.roadalignment.model.Triangle;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TerrainService {

    private final double coordinateTolerance;
    private final double barycentricTolerance;

    public TerrainService(TerrainProperties terrainProperties) {
        this.coordinateTolerance = terrainProperties.coordinateTolerance();
        this.barycentricTolerance = terrainProperties.barycentricTolerance();
    }

    // finds elevation at specified XY coordinates
    public double getElevation(double x, double y, List<Triangle> triangles) {

        if (!Double.isFinite(x) || !Double.isFinite(y)) {
            throw new IllegalArgumentException("Point coordinates must be finite.");
        }

        if (triangles == null || triangles.isEmpty()) {
            throw new IllegalArgumentException("TIN triangles cannot be null or empty.");
        }

        for (Triangle triangle : triangles) {

            if (triangle == null) {
                throw new IllegalArgumentException("TIN cannot contain null triangles.");
            }

            // calculate barycentric coordinates only once for each triangle
            BarycentricCoordinates coordinates = calculateBarycentricCoordinates(x, y, triangle);

            if (coordinates.containsPoint(barycentricTolerance)) {
                return interpolateElevation(triangle, coordinates);
            }
        }
        throw new IllegalArgumentException("Point (" + x + ", " + y + ") is outside the terrain surface.");
    }

    // calculates barycentric coordinates of a point relative to a triangle
    // alpha, beta and gamma represent a relative contribution of each triangle vertex to the interpolated elevation
    private BarycentricCoordinates calculateBarycentricCoordinates(double x, double y, Triangle triangle) {
        TerrainPoint a = triangle.a();
        TerrainPoint b = triangle.b();
        TerrainPoint c = triangle.c();

        double denominator = calculateDenominator(a, b, c);

        // find the longest triangle side to establish a scale-aware threshold
        // for detecting degenerate triangles
        double maxEdgeLength = Math.max(Math.hypot(a.x() - b.x(), a.y() - b.y()),
                                        Math.max(Math.hypot(b.x() - c.x(), b.y() - c.y()), Math.hypot(c.x() - a.x(), c.y() - a.y())));

        if (Math.abs(denominator) <= coordinateTolerance * maxEdgeLength) {
            throw new IllegalStateException("TIN contains a degenerate triangle.");
        }

        double alpha = ((b.y() - c.y()) * (x - c.x()) + (c.x() - b.x()) * (y - c.y())) / denominator;
        double beta = ((c.y() - a.y()) * (x - c.x()) + (a.x() - c.x()) * (y - c.y())) / denominator;
        double gamma = 1.0 - alpha - beta;

        return new BarycentricCoordinates(alpha, beta, gamma);
    }

    // interpolates elevations using barycentric coordinates
    private double interpolateElevation(Triangle triangle, BarycentricCoordinates coordinates) {

        TerrainPoint a = triangle.a();
        TerrainPoint b = triangle.b();
        TerrainPoint c = triangle.c();

        return coordinates.alpha() * a.z() + coordinates.beta() * b.z() + coordinates.gamma() * c.z();
    }

    // calculates a denominator used in barycentric coordinate calculations
    private double calculateDenominator(TerrainPoint a, TerrainPoint b, TerrainPoint c) {

        return (b.y() - c.y()) * (a.x() - c.x()) + (c.x() - b.x()) * (a.y() - c.y());
    }

    // stores barycentric coordinates and determines if corresponding point belongs to the triangle
    private record BarycentricCoordinates(double alpha, double beta, double gamma) {

        private boolean containsPoint(double tolerance) {
            return alpha >= -tolerance && beta >= -tolerance && gamma >= -tolerance;
        }
    }
}
