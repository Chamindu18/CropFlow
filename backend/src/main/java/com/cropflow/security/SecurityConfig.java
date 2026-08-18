package com.cropflow.security;

import com.cropflow.security.jwt.JwtAuthenticationFilter;
import com.cropflow.security.principal.CropFlowUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CropFlowUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CropFlowUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                /*
                 * CropFlow is currently using stateless bearer-token
                 * authentication. We will revisit CSRF when the
                 * HttpOnly refresh-token cookie is introduced.
                 */
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth
                        // Public authentication endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // Public health endpoint
                        .requestMatchers("/actuator/health").permitAll()

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )

                /*
                 * Process the JWT before Spring's username/password
                 * authentication filter.
                 */
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /**
     * Authentication provider backed by CropFlow's database users.
     *
     * Spring Security's DaoAuthenticationProvider loads a UserDetails
     * and verifies the supplied password with the configured PasswordEncoder.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    /**
     * Explicit AuthenticationManager used by AuthService.login().
     */
    @Bean
    public AuthenticationManager authenticationManager(
            DaoAuthenticationProvider authenticationProvider
    ) {
        return new ProviderManager(authenticationProvider);
    }
}