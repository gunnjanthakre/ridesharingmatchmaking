package com.example.ridesharing.controller;

import com.example.ridesharing.exception.GlobalExceptionHandler;
import com.example.ridesharing.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerTest {

    @Test
    void registerReturnsBadRequestForInvalidPayload() throws Exception {
        UserController controller = new UserController();
        ReflectionTestUtils.setField(controller, "userService", new UserService());

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .setValidator(validator)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();

        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "",
                      "email": "not-an-email",
                      "phone": "",
                      "lat": 200,
                      "lng": 500
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Request validation failed"))
            .andExpect(jsonPath("$.validationErrors.name").exists())
            .andExpect(jsonPath("$.validationErrors.email").exists())
            .andExpect(jsonPath("$.validationErrors.lat").exists())
            .andExpect(jsonPath("$.validationErrors.lng").exists());
    }
}
