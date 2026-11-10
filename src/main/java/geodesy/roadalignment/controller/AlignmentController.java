/* --------------------------------------------------------------------------------
Provides REST endpoints for road alignment generation
- accepts alignment generation requests
- delegates the generation workflow to AlignmentGenerationService
- returns generated alignment alternatives
--------------------------------------------------------------------------------  */

package geodesy.roadalignment.controller;

import geodesy.roadalignment.dto.request.AlignmentRequest;
import geodesy.roadalignment.model.*;
import geodesy.roadalignment.service.AlignmentGenerationService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/alignments")
public class AlignmentController {

    private final AlignmentGenerationService generationService;

    public AlignmentController(AlignmentGenerationService generationService) {
        this.generationService = generationService;
    }

    // generates alignment alternatives for selected terrain dataset
    @PostMapping("/generate")
    public List<AlignmentAlternative> generateAlignments(@Valid @RequestBody AlignmentRequest request) {
        return generationService.generate(request);
    }
}
