/* --------------------------------------------------------------------------------
Represents processed terrain surface returned to frontend
Contains original survey points, TIN, generated contour polylines
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.dto.response;

import geodesy.roadalignment.model.ContourPolyline;
import geodesy.roadalignment.model.TerrainPoint;
import geodesy.roadalignment.model.Triangle;

import java.util.List;

public record TerrainSurfaceResponse(String datasetId,
                                     List<TerrainPoint> points,
                                     List<Triangle> triangles,
                                     List<ContourPolyline> contours) {

    // creates immutable snapshot of terrain data
    public TerrainSurfaceResponse {
        points = List.copyOf(points);
        triangles = List.copyOf(triangles);
        contours = List.copyOf(contours);
    }
}
