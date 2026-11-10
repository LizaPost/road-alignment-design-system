/* --------------------------------------------------------------------------------
Provides REST endpoints for retrieving terrain data
- accepts requests for a specific terrain dataset,
- delegates terrain processing to TerrainSurfaceService,
- returns the processed terrain data to frontend
--------------------------------------------------------------------------------  */


package geodesy.roadalignment.controller;

import geodesy.roadalignment.dto.response.TerrainSurfaceResponse;
import geodesy.roadalignment.service.TerrainSurfaceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/terrain/datasets")
public class TerrainController {

    private final TerrainSurfaceService terrainSurfaceService;

    public TerrainController(TerrainSurfaceService terrainSurfaceService) {
        this.terrainSurfaceService = terrainSurfaceService;
    }

    @GetMapping("/{datasetId}")
    public TerrainSurfaceResponse getTerrain(@PathVariable String datasetId) {

        return terrainSurfaceService.getTerrainSurface(datasetId);
    }
}
