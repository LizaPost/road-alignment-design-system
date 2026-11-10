/* --------------------------------------------------------------------------------
Configuration properties for terrain processing;
Defines numerical tolerances for geometric calculations, TIN construction, contour generation;
Values are loaded from application.properties and validated at startup.
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "road-alignment.terrain")
public record TerrainProperties (

        @Positive(message = "Coordinate tolerance must be greater than zero")
        double coordinateTolerance,                                          // for identifying survey points with duplicate XY coordinates

        @Positive(message = "Barycentric tolerance must be greater than zero")
        double barycentricTolerance,

        @Positive(message = "Circumcircle tolerance must be greater than zero")
        double circumcircleTolerance,                                        //

        @DecimalMin(value = "1.0", inclusive = false, message = "Super-triangle multiplier must be greater than one")
        double superTriangleMultiplier,                                      //

        @Positive(message = "Contour interval must be greater than zero")
        double contourInterval                //
) {}
