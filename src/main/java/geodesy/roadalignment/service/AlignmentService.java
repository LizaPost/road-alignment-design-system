package geodesy.roadalignment.service;

import geodesy.roadalignment.config.AlignmentProperties;
import geodesy.roadalignment.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AlignmentService {

    private static final Logger logger = LoggerFactory.getLogger(AlignmentService.class);

    private static final double STATION_MATCH_TOLERANCE = 1e-8;

    private final double sampleInterval;
    private final TerrainService terrainService;

    public AlignmentService (TerrainService terrainService, AlignmentProperties alignmentProperties) {

        this.terrainService = terrainService;
        this.sampleInterval = alignmentProperties.sampleInterval();
    }

    public Alignment createAlignment(String id, List<ProjectPoint> route, List<Triangle> triangles) {

        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Alignment ID cannot be blank.");
        }

        if (route == null || route.size() < 2) {
            throw new IllegalArgumentException("A route must contain at least two points.");
        }

        List<AlignmentPoint> points = new ArrayList<>();

        double stationAtSegmentStart = 0.0;

        boolean hasAddedPoint = false;

        for (int segmentIndex = 0; segmentIndex < route.size() - 1; segmentIndex++) {
            ProjectPoint start = route.get(segmentIndex);
            ProjectPoint end = route.get(segmentIndex + 1);

            if (start == null || end == null) {
                throw new IllegalArgumentException("Route cannot contain null points.");
            }

            double dx = end.x() - start.x();
            double dy = end.y() - start.y();

            double segmentLength = Math.hypot(dx, dy);

            if (segmentLength == 0.0) {
                continue;
            }

            int sampleCount = Math.max(
                    1,
                    (int) Math.ceil(segmentLength / sampleInterval));

            // Skip the first sample of subsequent segments to avoid
            // adding the shared route vertex twice.
            int firstSample = hasAddedPoint ? 1 : 0;

            for (int sampleIndex = firstSample; sampleIndex <= sampleCount; sampleIndex++) {
                double fraction = (double) sampleIndex / sampleCount;

                double x = start.x() + fraction * dx;
                double y = start.y() + fraction * dy;

                // Station is measured from the start of the entire route.
                double pointStation = stationAtSegmentStart + fraction * segmentLength;

                double terrainElevation =
                        terrainService.getElevation(x, y, triangles);

                points.add(new AlignmentPoint(
                        pointStation,
                        x,
                        y,
                        terrainElevation,
                        0.0
                ));
            }

            // Advance the starting station for the next route segment.
            stationAtSegmentStart += segmentLength;
        }

        if (points.size() < 2) {
            throw new IllegalArgumentException("The route does not contain a usable segment.");
        }

        logger.debug("Created alignment {}: {} points, total length {}.", id, points.size(), stationAtSegmentStart);

        return new Alignment(id, points, stationAtSegmentStart);
    }

    public Alignment applyDesignProfile(Alignment alignment, List<ProfilePoint> profile) {

        if (alignment == null || profile == null) {
            throw new IllegalArgumentException("Alignment and profile are required.");
        }

        if (alignment.points().size() != profile.size()) {
            throw new IllegalArgumentException("Alignment and profile must contain the same number of points.");
        }

        List<AlignmentPoint> updatedPoints = new ArrayList<>();

        for (int i = 0; i < alignment.points().size(); i++) {
            AlignmentPoint original = alignment.points().get(i);
            ProfilePoint profilePoint = profile.get(i);

            if (Math.abs(original.station() - profilePoint.station()) > STATION_MATCH_TOLERANCE) {
                throw new IllegalArgumentException("Alignment and profile stations do not match at index " + i + ".");
            }

            updatedPoints.add(new AlignmentPoint(
                                                original.station(),
                                                original.x(),
                                                original.y(),
                                                original.terrainElevation(),
                                                profilePoint.designElevation()
            ));
        }

        logger.debug("Applied design profile to alignment {} ({} points).", alignment.id(), updatedPoints.size());
        return new Alignment(alignment.id(), updatedPoints, alignment.length());
    }
}
