package geodesy.roadalignment.model;

public record ContourSegment(
        double elevation,
        ContourPoint start,
        ContourPoint end
) { }
