/**/

package geodesy.roadalignment.service;

import geodesy.roadalignment.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AlignmentAnalysisService {

    //private final AlignmentGeneratorService generatorService;
    private final AlignmentService alignmentService;
    private final ProfileService profileService;
    private final EarthworkService earthworkService;

    public AlignmentAnalysisService (/*AlignmentGeneratorService generatorService,*/
                                     AlignmentService alignmentService,
                                     ProfileService profileService,
                                     EarthworkService earthworkService) {
        //this.generatorService = generatorService;
        this.alignmentService = alignmentService;
        this.profileService = profileService;
        this.earthworkService = earthworkService;
    }

    public List<AlignmentAlternative> analyze (List<List<ProjectPoint>> routes, List<Triangle> triangles) {

        //List<List<ProjectPoint>> routes = generatorService.generateAlternatives(start, end, triangles);
        List<AlignmentAlternative> alternatives = new ArrayList<>(routes.size());

        for (int i = 0; i < routes.size(); i++) {

            String id = "ALT-" + String.format("%02d", i + 1);
            Alignment alignment = alignmentService.createAlignment(id, routes.get(i), triangles);
            List<ProfilePoint> profile = profileService.createProfile(alignment);
            Alignment updatedAlignment = alignmentService.applyDesignProfile(alignment, profile);
            double maximumGrade = profileService.calculateMaximumGrade(profile);
            EarthworkResult earthwork = earthworkService.calculate(updatedAlignment.points());

            alternatives.add(new AlignmentAlternative(id, updatedAlignment.points(), profile, updatedAlignment.length(), maximumGrade, earthwork, earthworkService.getRoadWidth()));
        }
        return List.copyOf(alternatives);
    }

    /*public List<AlignmentAlternative> analyze (ProjectPoint start, ProjectPoint end, List<Triangle> triangles) {

        List<List<ProjectPoint>> routes = generatorService.generateAlternatives(start, end, triangles);
        List<AlignmentAlternative> alternatives = new ArrayList<>(routes.size());

        for (int i = 0; i < routes.size(); i++) {

            String id = "ALT-" + String.format("%02d", i + 1);
            Alignment alignment = alignmentService.createAlignment(id, routes.get(i), triangles);
            List<ProfilePoint> profile = profileService.createProfile(alignment);
            Alignment updatedAlignment = alignmentService.applyDesignProfile(alignment, profile);
            double maximumGrade = profileService.calculateMaximumGrade(profile);
            EarthworkResult earthwork = earthworkService.calculate(updatedAlignment.points());

            alternatives.add(new AlignmentAlternative(id, updatedAlignment.points(), profile, updatedAlignment.length(), maximumGrade, earthwork, earthworkService.getRoadWidth()));
        }
        return List.copyOf(alternatives);
    }*/
}
