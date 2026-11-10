package geodesy.roadalignment.importer;

import geodesy.roadalignment.model.TerrainPoint;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;

@Component
public class CsvTerrainPointReader {

    public List<TerrainPoint> read(Reader reader) throws IOException {

        List<TerrainPoint> points = new ArrayList<>();

        try (BufferedReader bufferedReader = new BufferedReader(reader)) {

            String line = bufferedReader.readLine();

            // empty file
            if (line == null) {
                return points;
            }

            // skip header
            while ((line = bufferedReader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                String[] values = line.split(",");

                if (values.length != 4) {
                    throw new IllegalArgumentException("Each csv row must contain exactly 4 values: id, x, y, z.");
                }

                String id = values[0].trim();
                double x = Double.parseDouble(values[1].trim());
                double y = Double.parseDouble(values[2].trim());
                double z = Double.parseDouble(values[3].trim());

                points.add(new TerrainPoint(id, x, y, z));
            }
        }
        return points;
    }
}
