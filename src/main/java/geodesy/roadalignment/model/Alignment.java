package geodesy.roadalignment.model;

import java.util.List;

public record Alignment(
        String id,
        List<AlignmentPoint> points,
        double length
) {
    public Alignment {

        points = List.copyOf(points);

        if(!Double.isFinite(length) || length < 0.0) {
            throw new IllegalArgumentException("Alignment length must be finite and non-negative.");
        }
    }
}
