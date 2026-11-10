/* --------------------------------------------------------------------------------
Represents a two-dimensional (x, y) coordinate received from frontend
(note) elevation (z) is excluded here because it is calculated by backend
according to the selected terrain surface
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record CoordinateRequest(

        @NotNull(message = "X coordinate is required")
        @DecimalMin(value = "-1000000.00")
        @DecimalMax(value = "1000000.00")
        Double x,

        @NotNull(message = "Y coordinate is required")
        @DecimalMin(value = "-1000000.00")
        @DecimalMax(value = "1000000.00")
        Double y
) {}
