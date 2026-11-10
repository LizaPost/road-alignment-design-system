// Frontend:  http://localhost:5500
// Backend:   http://localhost:8080
// Backend: run from RoadAlignmentDesignSystemApplication.java
// The backend will be available at: http://localhost:8080
//verify it with: http://localhost:8080/api/points
// Frontend: in terminal navigate to frontend folder: 'cd path\to\RoadAlignmentDesignSystem\frontend'
// run 'python -m http.server 5500'
package geodesy.roadalignment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {

            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:5500")
                        .allowedMethods("GET", "POST", "OPTIONS");
            }
        };
    }
}
