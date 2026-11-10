package geodesy.roadalignment.model;

import java.util.List;

public record AlignmentAlternative(
        String id,
        List<AlignmentPoint> alignmentPoints,
        List<ProfilePoint> profile,
        double length,
        double maximumGrade,
        EarthworkResult earthwork,
        double roadWidth
) {
    public AlignmentAlternative {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Alternative ID cannot be blank.");
        }

        alignmentPoints = List.copyOf(alignmentPoints);
        profile = List.copyOf(profile);

        if (earthwork == null) {
            throw new IllegalArgumentException("Earthwork result is required.");
        }

        if (!Double.isFinite(length) || length < 0.0
                || !Double.isFinite(maximumGrade) || maximumGrade < 0.0
                || !Double.isFinite(roadWidth) || roadWidth <= 0.0) {
            throw new IllegalArgumentException("Alternative metrics must be finite and valid.");
        }
    }
}
