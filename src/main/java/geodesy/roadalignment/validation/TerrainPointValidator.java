/* --------------------------------------------------------------------------------
Validates survey points before they are used in terrain processing;
Checks that:
- collection contains at least 3 points,
- points have valid IDs and finite coordinates,
- all point IDs are unique,
- there are no duplicate XY coordinates
--------------------------------------------------------------------------------  */


package geodesy.roadalignment.validation;

import geodesy.roadalignment.config.TerrainProperties;
import geodesy.roadalignment.model.TerrainPoint;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class TerrainPointValidator {

    private final double coordinateTolerance;

    public TerrainPointValidator(TerrainProperties terrainProperties) {
        this.coordinateTolerance = terrainProperties.coordinateTolerance();
    }

    public void validatePoints (List<TerrainPoint> points) {
        // no points
        if (points == null) {
            throw new IllegalArgumentException("Terrain points cannot be null.");
        }

        // less than 3 points
        if (points.size() < 3) {
            throw new IllegalArgumentException("At least 3 points are required to create a TIN.");
        }

        validateIndividualPoints(points);
        validateUniqueIds(points);
        validateUniqueCoordinates(points);
    }

    private void validateIndividualPoints (List<TerrainPoint> points) {

        for (TerrainPoint point : points) {
            // in case if any point is null
            if (point == null) {
                throw new IllegalArgumentException("Terrain point cannot be null.");
            }
            // in case if point id is missing
            if (point.id() == null || point.id().isBlank()) {
                throw new IllegalArgumentException("Terrain point ID cannot be null or blank.");
            }
            // in case if any coordinate is infinite
            if (!Double.isFinite(point.x()) || !Double.isFinite(point.y()) || !Double.isFinite(point.z())) {
                throw new IllegalArgumentException("Terrain point coordinates must be finite: " + point.id());
            }
        }
    }

    private void validateUniqueIds (List<TerrainPoint> points) {

        Set<String> pointsIds = new HashSet<>();

        for (TerrainPoint point : points) {
            if (!pointsIds.add(point.id())) {
                throw new IllegalArgumentException("Duplicate terrain point ID: " + point.id());
            }
        }
    }

    private void validateUniqueCoordinates(List<TerrainPoint> points) {

        for (int i = 0; i < points.size(); i++) {
            TerrainPoint first = points.get(i);
            for (int j = i + 1; j < points.size(); j++) {
                TerrainPoint second = points.get(j);
                if (sameCoordinates(first, second)) {
                    throw new IllegalArgumentException("Duplicate coordinates for points: " + first.id() + " and " + second.id());
                }
            }
        }
    }

    private boolean sameCoordinates(TerrainPoint first, TerrainPoint second) {
        return Math.abs(first.x() - second.x()) < coordinateTolerance &&
                Math.abs(first.y() - second.y()) < coordinateTolerance;
    }
}
