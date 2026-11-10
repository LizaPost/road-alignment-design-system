/* --------------------------------------------------------------------------------
Represents a request to generate road alignment alternatives
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AlignmentRequest(

        @NotBlank(message = "Dataset ID is required")
        String datasetId,

        @NotNull(message = "Start point is required")
        @Valid
        CoordinateRequest start,

        @NotNull(message = "End point is required")
        @Valid
        CoordinateRequest end
) {
}
