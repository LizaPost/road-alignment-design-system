package geodesy.roadalignment.model;

public record AlignmentPoint(
        double station,
        double x,
        double y,
        double terrainElevation,
        double designElevation
) {
}
