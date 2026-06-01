package com.edra.config;

import com.edra.model.ERole;
import com.edra.model.Role;
import com.edra.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        initRole(ERole.ROLE_DEVELOPER);
        initRole(ERole.ROLE_RELEASE_MANAGER);
        initRole(ERole.ROLE_ADMIN);
        log.info("✅ Roles initialized successfully.");
    }

    private void initRole(ERole eRole) {
        if (roleRepository.findByName(eRole).isEmpty()) {
            roleRepository.save(new Role(null, eRole));
            log.info("Created role: {}", eRole.name());
        }
    }
}
