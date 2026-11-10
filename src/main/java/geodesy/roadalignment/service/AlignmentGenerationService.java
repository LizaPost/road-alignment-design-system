/*
Coordinates the road alignment generation workflow.

Responsibilities:
 - Loads the selected terrain dataset.
 - Generates its triangulated irregular network.
 - Determines elevations at the requested start and end coordinates.
 - Delegates alignment generation and analysis.
*/

package geodesy.roadalignment.service;

import geodesy.roadalignment.dto.request.AlignmentRequest;
import geodesy.roadalignment.model.ProjectPoint;
import geodesy.roadalignment.model.TerrainPoint;
import geodesy.roadalignment.model.Triangle;
import geodesy.roadalignment.model.AlignmentAlternative;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlignmentGenerationService {

    private final TerrainDataService terrainDataService;
    private final TinService tinService;
    private final TerrainService terrainService;
    private final AlignmentRouteGenerationService routeGenerationService;
    private final AlignmentAnalysisService analysisService;

    public AlignmentGenerationService(
            TerrainDataService terrainDataService,
            TinService tinService,
            TerrainService terrainService,
            AlignmentRouteGenerationService routeGenerationService,
            AlignmentAnalysisService analysisService
    ) {
        this.terrainDataService = terrainDataService;
        this.tinService = tinService;
        this.terrainService = terrainService;
        this.routeGenerationService = routeGenerationService;
        this.analysisService = analysisService;
    }

    public List<AlignmentAlternative> generate(AlignmentRequest request) {

        // Load the requested terrain dataset.
        List<TerrainPoint> terrainPoints = terrainDataService.loadDataset(request.datasetId());

        // Build the TIN for elevation interpolation and route generation.
        List<Triangle> triangles = tinService.triangulate(terrainPoints);

        // Determine elevations at the exact requested coordinates.
        double startElevation = terrainService.getElevation(
                request.start().x(),
                request.start().y(),
                triangles
        );

        double endElevation = terrainService.getElevation(
                request.end().x(),
                request.end().y(),
                triangles
        );

        // Create complete project points using the calculated elevations.
        ProjectPoint start = new ProjectPoint(
                request.start().x(),
                request.start().y(),
                startElevation
        );

        ProjectPoint end = new ProjectPoint(
                request.end().x(),
                request.end().y(),
                endElevation
        );

        List<List<ProjectPoint>> routes = routeGenerationService.generateAlternatives(start, end, triangles);

        //
        return analysisService.analyze(routes, triangles);
    }
}
