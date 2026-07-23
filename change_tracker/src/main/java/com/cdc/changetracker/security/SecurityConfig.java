package com.cdc.changetracker.security; // Kendi paket dizinine göre kontrol et

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Kural: Kimlerin hangi sayfalara gireceğini belirliyoruz
                .authorizeHttpRequests(auth -> auth
                        // CDC verilerini sunduğumuz REST API uç noktamızı korumaya alıyoruz
                        .requestMatchers("/api/cdc/**").authenticated()
                        // Geri kalan diğer isteklere (şimdilik) izin veriyoruz
                        .anyRequest().permitAll()
                )
                // 2. Kural: Gelen isteklerdeki Keycloak (JWT) biletini kontrol et
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> {}) // Gelen Token'ı application.properties'deki adrese sorup doğrulayacak
                );

        return http.build();
    }
}