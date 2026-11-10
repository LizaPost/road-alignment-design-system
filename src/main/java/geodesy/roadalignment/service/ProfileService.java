package geodesy.roadalignment.service;

import geodesy.roadalignment.model.Alignment;
import geodesy.roadalignment.model.AlignmentPoint;
import geodesy.roadalignment.model.ProfilePoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProfileService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileService.class);

    private static final double STATION_TOLERANCE = 1e-8;

    public List<ProfilePoint> createProfile(Alignment alignment) {

        List<AlignmentPoint> alignmentPoints = alignment.points();

        if (alignmentPoints.isEmpty()) {
            return List.of();
        }

        double startElevation = alignmentPoints.get(0).terrainElevation();
        double endElevation = alignmentPoints.get(alignmentPoints.size() - 1).terrainElevation();
        double totalLength = alignment.length();

        List<ProfilePoint> profile = new ArrayList<>();

        for (AlignmentPoint point : alignmentPoints) {
            double fraction = totalLength == 0 ? 0 : point.station() / totalLength;
            double designElevation = startElevation + (endElevation - startElevation) * fraction;

            profile.add(new ProfilePoint(point.station(), point.terrainElevation(), designElevation));
        }

        logger.debug("Created preliminary profile: {} points, length {}, start elevation {}, end elevation {}.",
                profile.size(), totalLength, startElevation, endElevation);

        return List.copyOf(profile);
    }

    public double calculateMaximumGrade(List<ProfilePoint> profile) {

        double maximumGrade = 0.0;

        for (int i = 0; i < profile.size() - 1; i++) {
            ProfilePoint first = profile.get(i);
            ProfilePoint second = profile.get(i + 1);

            double stationDifference = second.station() - first.station();

            if (stationDifference <= 0) {
                continue;
            }

            double elevationDifference = second.designElevation() - first.designElevation();
            double grade = Math.abs(elevationDifference / stationDifference);
            maximumGrade = Math.max(maximumGrade, grade);
        }
        logger.debug("Calculated maximum absolute profile grade: {}%", maximumGrade * 100);

        return maximumGrade * 100.00;
    }
}
