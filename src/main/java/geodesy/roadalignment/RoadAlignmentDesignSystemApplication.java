/*  */

package geodesy.roadalignment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RoadAlignmentDesignSystemApplication {

    public static void main(String[] args) {

        SpringApplication.run(RoadAlignmentDesignSystemApplication.class, args);
    }

}
