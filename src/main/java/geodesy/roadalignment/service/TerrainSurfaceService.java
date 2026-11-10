/* --------------------------------------------------------------------------------
Coordinates the processing required to prepare a terrain surface
- loads the requested terrain dataset,
- generates its TIN,
- generates contour polylines from the TIN,
- combines results into a TerrainSurfaceResponse
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.service;

import geodesy.roadalignment.config.TerrainProperties;
import geodesy.roadalignment.dto.response.TerrainSurfaceResponse;
import geodesy.roadalignment.model.TerrainPoint;
import geodesy.roadalignment.model.Triangle;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TerrainSurfaceService {

    private final TerrainDataService terrainDataService;
    private final TinService tinService;
    private final ContourService contourService;
    private final TerrainProperties terrainProperties;

    public TerrainSurfaceService(TerrainDataService terrainDataService, TinService tinService, ContourService contourService, TerrainProperties terrainProperties) {

        this.terrainDataService = terrainDataService;
        this.tinService = tinService;
        this.contourService = contourService;
        this.terrainProperties = terrainProperties;
    }

    // loads and processes a terrain dataset
    public TerrainSurfaceResponse getTerrainSurface(String datasetId) {

        // load and validate requested survey points
        List<TerrainPoint> points = terrainDataService.loadDataset(datasetId);

        // generate TIN once for given terrain dataset
        List<Triangle> triangles = tinService.triangulate(points);

        // generate all contours
        var contours = contourService.generateAllContours(triangles, terrainProperties.contourInterval());

        return new TerrainSurfaceResponse(datasetId, points, triangles, contours);
    }
}
