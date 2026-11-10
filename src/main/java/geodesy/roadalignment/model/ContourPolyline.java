package geodesy.roadalignment.model;

import java.util.List;

public record ContourPolyline (
        double elevation,
        List<ContourPoint> points
) {
    public ContourPolyline {
        points = List.copyOf(points);
    }
}
