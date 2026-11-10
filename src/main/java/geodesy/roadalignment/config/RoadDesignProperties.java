/* --------------------------------------------------------------------------------
Configuration properties for road design
Stores engineering design parameters used in road calculations;
Values are loaded from application.properties and validated at startup.
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "road-alignment.road")
public record RoadDesignProperties (

        @Positive(message = "Road width must be greater than zero")
        @DecimalMax(value = "50.0", message = "Road width must not exceed 50 meters")
        double roadWidth
) {}
