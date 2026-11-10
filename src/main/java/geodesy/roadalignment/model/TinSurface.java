package geodesy.roadalignment.model;

import java.util.List;

public record TinSurface (
        List<TerrainPoint> points,
        List<Triangle> triangles
) {
    public TinSurface {
        points = List.copyOf(points);
        triangles = List.copyOf(triangles);
    }
}
