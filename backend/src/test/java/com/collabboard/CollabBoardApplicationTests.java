package com.collabboard;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Context load test that requires Docker (Testcontainers).
 * Skipped when Docker is not available.
 */
@EnabledIf("isDockerAvailable")
class CollabBoardApplicationTests extends AbstractIntegrationTest {

    @Test
    void contextLoads() {
        assertNotNull(mockMvc);
        assertNotNull(objectMapper);
    }

    static boolean isDockerAvailable() {
        try {
            return org.testcontainers.DockerClientFactory.instance().isDockerAvailable();
        } catch (Exception e) {
            return false;
        }
    }
}
