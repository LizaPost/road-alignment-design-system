/* --------------------------------------------------------------------------------
Provides information about available terrain datasets
Exposes the list of predefined terrain datasets
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.controller;

import geodesy.roadalignment.dto.response.TerrainDatasetResponse;
import geodesy.roadalignment.service.TerrainDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/terrain/datasets")
public class TerrainDatasetController {

    private final TerrainDataService terrainDataService;

    public TerrainDatasetController(TerrainDataService terrainDataService) {
        this.terrainDataService = terrainDataService;
    }

    @GetMapping
    public List<TerrainDatasetResponse> getAvailableDatasets() {

        return terrainDataService.getAvailableDatasets();
    }
}
