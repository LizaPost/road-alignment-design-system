/* --------------------------------------------------------------------------------
Configuration properties for road alignment generation;
Stores parameters for alignment generation and geometry calculations;
Values are loaded from application.properties and validated at startup.
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.config;

import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "road-alignment.alignment")
public record AlignmentProperties (

        // alignment sampling and alternative route parameters
        @Positive(message = "Sample interval must be greater than zero")
        double sampleInterval,                                                  // distance between consecutive alignment sampling points

        @NotEmpty(message = "Alternative offsets must not be empty")
        List<Double> alternativeOffsets,                                        // lateral offsets to generate alternative alignment routes

        @Positive(message = "Same-point tolerance must be greater than zero")
        double samePointTolerance,                                             // tolerance for alignment points comparison

        @DecimalMin(value = "0.0", inclusive = false, message = "First control point fraction must be greater than zero")
        @DecimalMax(value = "1.0", inclusive = false, message = "First control point fraction must be less than one")
        double firstControlPointFraction,                                       // relative positions to define intermediate control points

        @DecimalMin(value = "0.0", inclusive = false, message = "Second control point fraction must be greater than zero")
        @DecimalMax(value = "1.0", inclusive = false, message = "Second control point fraction must be less than one")
        double secondControlPointFraction,

        // grid generation parameters
        @Positive(message = "Grid spacing must be greater than zero")
        double gridSpacing,

        @Min(value = 1, message = "Maximum grid nodes must be at least one")
        int maxGridNodes,

        // alternative route search parameters
        @Min(value = 1, message = "Maximum alternatives must be at least one")
        int maxAlternatives,

        @Min(value = 1, message = "Maximum endpoint connections must be at least one")
        int maxEndpointConnections,

        @Min(value = 1, message = "Maximum search attempts must be at least one")
        int maxSearchAttempts,

        // algorithm parameters
        @PositiveOrZero(message = "Slope weight must not be negative")
        double slopeWeight,

        @PositiveOrZero(message = "Elevation weight must not be negative")
        double elevationWeight,

        @Positive(message = "Elevation scale must be greater than zero")
        double elevationScale,

        @DecimalMin(value = "1.0", message = "Reused edge penalty must be at least one")
        double reusedEdgePenalty
) {

    // an immutable copy prevents external code from modifying values
    public AlignmentProperties {
        if (alternativeOffsets != null) {
            alternativeOffsets = Collections.unmodifiableList(new ArrayList<>(alternativeOffsets));
        }
    }

    // verifies that second control point is located after first one
    @AssertTrue(message = "Second control point fraction must be greater than first control point fraction")
    public boolean isControlPointFractionsValid() {

        return secondControlPointFraction > firstControlPointFraction;
    }

    // verifies that all floating-point configuration values are finite (to reject NaN and +/- infinity)
    @AssertTrue(message = "Alignment configuration values must be finite numbers")
    public boolean isAlignmentParametersFinite() {

        boolean offsetsAreFinite = alternativeOffsets != null
                && alternativeOffsets.stream().allMatch(value -> value != null && Double.isFinite(value));

        return Double.isFinite(sampleInterval)
                && Double.isFinite(samePointTolerance)
                && Double.isFinite(firstControlPointFraction)
                && Double.isFinite(secondControlPointFraction)
                && Double.isFinite(gridSpacing)
                && Double.isFinite(slopeWeight)
                && Double.isFinite(elevationWeight)
                && Double.isFinite(elevationScale)
                && Double.isFinite(reusedEdgePenalty)
                && offsetsAreFinite;
    }
}
