package com.example.ridesharing.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI rideSharingOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Ride Sharing Matchmaking API")
                .description("Backend API for registering users and drivers, managing trips, running the DSA-based matching engine, and booking rides.")
                .version("1.0.0")
                .contact(new Contact().name("Ride Sharing Backend").email("support@ridesharing.local"))
                .license(new License().name("MIT")))
            .servers(List.of(new Server().url("http://localhost:8080").description("Local development")));
    }
}
