package com.cropflow;

import com.cropflow.auth.passwordreset.PasswordResetProperties;
import com.cropflow.security.RefreshCookieProperties;
import com.cropflow.security.jwt.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        JwtProperties.class,
        RefreshCookieProperties.class,
        PasswordResetProperties.class
})
public class CropflowApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(CropflowApiApplication.class, args);
    }
}