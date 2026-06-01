package com.edra;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EdraApplication {
    public static void main(String[] args) {
        SpringApplication.run(EdraApplication.class, args);
    }
}
