package geodesy.roadalignment.service;

import geodesy.roadalignment.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ContourService {

    private static final double POINT_TOLERANCE = 1e-7;
    private static final double ELEVATION_TOLERANCE = 1e-10;

    public List<ContourSegment> generateContours(List<Triangle> triangles, double elevation) {
        List<ContourSegment> segments = new ArrayList<>();
        for (Triangle triangle : triangles) {
            List<ContourPoint> intersections = new ArrayList<>();
            // check all 3 edges of triangle
            checkEdge(triangle.a(), triangle.b(), elevation, intersections);
            checkEdge(triangle.b(), triangle.c(), elevation, intersections);
            checkEdge(triangle.c(), triangle.a(), elevation, intersections);

            // each contour should intersect a triangle twice (via two edges)
            if (intersections.size() == 2) {
                ContourPoint start = intersections.get(0);
                ContourPoint end = intersections.get(1);

                segments.add(new ContourSegment(elevation, start, end));
            }
        }
        return segments;
    }

    public List<ContourPolyline> generateAllContours (List<Triangle> triangles, double contourInterval) {

        List<ContourPolyline> polylines = new ArrayList<>();

        if (triangles.isEmpty() || contourInterval <= 0) {
            return polylines;
        }

        double minElevation = Double.POSITIVE_INFINITY;
        double maxElevation = Double.NEGATIVE_INFINITY;

        // find the elevation range of TIN
        for (Triangle triangle : triangles) {
            minElevation = Math.min(
                    minElevation,
                    Math.min(
                            triangle.a().z(),
                            Math.min(
                                    triangle.b().z(),
                                    triangle.c().z()
                            )
                    )
            );

            maxElevation = Math.max(
                    maxElevation,
                    Math.max(
                            triangle.a().z(),
                            Math.max(
                                    triangle.b().z(),
                                    triangle.c().z()
                            )
                    )
            );

        }

        // start at the first contour elevation above the minimum terrain elevation
        double firstElevation = Math.ceil(minElevation / contourInterval) * contourInterval;

        for (double elevation = firstElevation; elevation <= maxElevation + ELEVATION_TOLERANCE; elevation += contourInterval) {
            List<ContourSegment> segments = generateContours(triangles, elevation);
            List<ContourPolyline> connected = connectSegments(segments);
            polylines.addAll(connected);
        }
        return polylines;
    }

    private void checkEdge(TerrainPoint p1, TerrainPoint p2, double elevation, List<ContourPoint> intersections) {
        double z1 = p1.z();
        double z2 = p2.z();

        // horizontal edge doesn't define a unique contour intersection
        if (Math.abs(z2 - z1) < ELEVATION_TOLERANCE) {
            return;
        }

        // half-open interval rule
        boolean crossesContour = (z1 < elevation && z2 >= elevation)
                              || (z2 < elevation && z1 >= elevation);

        if (!crossesContour) {
            return;
        }

        double t = (elevation - z1) / (z2 - z1);
        double x = p1.x() + t * (p2.x() - p1.x());
        double y = p1.y() + t * (p2.y() - p1.y());

        intersections.add(new ContourPoint(x, y));
    }

    public List<ContourPolyline> connectSegments (List<ContourSegment> segments) {

        List<ContourPolyline> polylines = new ArrayList<>();
        List<ContourSegment> remaining = new ArrayList<>(segments);

        while (!remaining.isEmpty()) {
            ContourSegment first = remaining.remove(0);
            List<ContourPoint> points = new ArrayList<>();
            points.add(first.start());
            points.add(first.end());

            boolean extended = true;

            while (extended) {
                extended = false;
                for (int i = 0; i < remaining.size(); i++) {
                    ContourSegment segment = remaining.get(i);
                    ContourPoint start = points.get(0);
                    ContourPoint end = points.get(points.size() - 1);

                    if (samePoint(end, segment.start())) {
                        points.add(segment.end());
                        remaining.remove(i);
                        extended = true;
                        break;
                    }

                    if (samePoint(end, segment.end())) {
                        points.add(segment.start());
                        remaining.remove(i);
                        extended = true;
                        break;
                    }

                    if (samePoint(start, segment.start())) {
                        points.add(0, segment.end());
                        remaining.remove(i);
                        extended = true;
                        break;
                    }

                    if (samePoint(start, segment.end())) {
                        points.add(0, segment.start());
                        remaining.remove(i);
                        extended = true;
                        break;
                    }
                }
            }

            polylines.add(new ContourPolyline(first.elevation(), points));
        }
        return polylines;
    }

    private boolean samePoint(ContourPoint first, ContourPoint second) {
        return Math.abs(first.x() - second.x()) < POINT_TOLERANCE && Math.abs(first.y() - second.y()) < POINT_TOLERANCE;
    }
}
