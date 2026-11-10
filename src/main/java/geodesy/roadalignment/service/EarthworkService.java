package geodesy.roadalignment.service;

import geodesy.roadalignment.model.AlignmentPoint;
import geodesy.roadalignment.model.EarthworkResult;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EarthworkService {

    private static final double ROAD_WIDTH = 8.0;

    public double getRoadWidth() {
        return ROAD_WIDTH;
    }

    public EarthworkResult calculate(List<AlignmentPoint> points) {

        double cutVolume = 0.0;
        double fillVolume = 0.0;

        for (int i = 0; i < points.size() - 1; i++) {
            AlignmentPoint first = points.get(i);
            AlignmentPoint second = points.get(i + 1);

            double stationDistance = second.station() - first.station();

            if (stationDistance <= 0) {
                continue;
            }

            // positive difference means cut, negative means fill
            double difference1 = first.terrainElevation() - first.designElevation();
            double difference2 = second.terrainElevation() - second.designElevation();

            // both points are in cut
            if (difference1 >= 0 && difference2 >= 0) {
                cutVolume += averageVolume(difference1, difference2, stationDistance);
            }

            // both points are in fill
            else if (difference1 <= 0 && difference2 <= 0) {
                fillVolume += averageVolume(-difference1, -difference2, stationDistance);
            }

            // the segment changes between cut and fill
            else {
                double fraction = Math.abs(difference1) / (Math.abs(difference1) + Math.abs(difference2));
                double firstSegmentDistance = stationDistance * fraction;
                double secondSegmentDistance = stationDistance - firstSegmentDistance;

                if (difference1 > 0) {
                    // cut at first point, fill at the second
                    cutVolume += averageVolume(difference1, 0, firstSegmentDistance);
                    fillVolume += averageVolume(0, -difference2, secondSegmentDistance);
                } else {
                    // fill at the first point, cut at the second
                    fillVolume += averageVolume(-difference1, 0, firstSegmentDistance);
                    cutVolume += averageVolume(0, difference2, secondSegmentDistance);
                }
            }
        }
        return new EarthworkResult(cutVolume, fillVolume, cutVolume - fillVolume);
    }

    private double averageVolume(double depth1, double depth2, double distance) {
        double area1 = depth1 * EarthworkService.ROAD_WIDTH;
        double area2 = depth2 * EarthworkService.ROAD_WIDTH;

        return ((area1 + area2) / 2.0) * distance;
    }
}
