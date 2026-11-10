/* --------------------------------------------------------------------------------
Provides access to predefined terrain datasets stored in app resources;

- maintains the definitions of available terrain datasets,
- reads terrain points from csv,
- validates imported terrain points before returning them

Each request explicitly identifies the dataset it needs
--------------------------------------------------------------------------------  */


package geodesy.roadalignment.service;

import geodesy.roadalignment.dto.response.TerrainDatasetResponse;
import geodesy.roadalignment.importer.CsvTerrainPointReader;
import geodesy.roadalignment.model.TerrainPoint;
import geodesy.roadalignment.validation.TerrainPointValidator;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class TerrainDataService {

    private static final String TERRAIN_RESOURCE_PATH = "terrainCoordinates/";
    private static final List<TerrainDatasetDefinition> DATASETS = List.of(
            new TerrainDatasetDefinition("rolling", "Rolling Terrain - rolling.csv", "rolling.csv"),
            new TerrainDatasetDefinition("flat", "Flat Terrain - flat.csv", "flat.csv"),
            new TerrainDatasetDefinition("hilly", "Hilly Terrain - hilly.csv", "hilly.csv"),
            new TerrainDatasetDefinition("steep-slope", "Steep Slope Terrain - steep-slope.csv", "steep-slope.csv")
    );
    private final TerrainPointValidator validator;
    private final CsvTerrainPointReader csvReader;

    public TerrainDataService(TerrainPointValidator validator, CsvTerrainPointReader csvReader) {
        this.validator = validator;
        this.csvReader = csvReader;
    }

    // returns metadata of all available terrain datasets
    public List<TerrainDatasetResponse> getAvailableDatasets() {

        return DATASETS.stream().map(dataset -> new TerrainDatasetResponse(dataset.id(), dataset.label())).toList();
    }

    // loads and validates a terrain dataset identified by its ID
    public List<TerrainPoint> loadDataset(String datasetId) {

        TerrainDatasetDefinition dataset = findDataset(datasetId);
        String resourcePath = TERRAIN_RESOURCE_PATH + dataset.filename();
        ClassPathResource resource = new ClassPathResource(resourcePath);

        try (InputStreamReader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {

            List<TerrainPoint> points = csvReader.read(reader);

            // validate complete dataset before returning it
            validator.validatePoints(points);

            return List.copyOf(points);

        } catch (IOException exception) {
            throw new IllegalStateException("Could not read terrain dataset: " + dataset.filename(), exception);
        }
    }

    // finds a dataset definition by ID
    private TerrainDatasetDefinition findDataset(String datasetId) {

        return DATASETS.stream()
                .filter(dataset -> dataset.id().equals(datasetId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown terrain dataset: " + datasetId));
    }

    // internal definition of a terrain dataset
    private record TerrainDatasetDefinition(String id, String label, String filename) {}

}
