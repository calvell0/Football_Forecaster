package com.football.backend.services;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;

@Service
public class ModelInitializer  {

    private final Logger LOG = LoggerFactory.getLogger(ModelInitializer.class);

    private Process subprocess;

    @PostConstruct
    public void createSubprocess() throws Exception {
        ProcessBuilder pb = new ProcessBuilder();
        Path modelPath = Path.of(System.getProperty("user.dir")).resolve("model");
        pb.command("python", "-m", "flask", "-A", "model.py", "run");

        pb.directory(modelPath.toFile());
        File log = new File(modelPath.resolve("logs/log.txt").toString());
        pb.redirectErrorStream(true);
        pb.redirectOutput(ProcessBuilder.Redirect.to(log));

        this.subprocess = pb.start();
        LOG.info("ML model subprocess started with pid: {}", this.subprocess.pid());

    }

    @EventListener(ContextClosedEvent.class)
    public void killSubprocess() {
        if (this.subprocess == null || !this.subprocess.isAlive()) {
            return;
        }
        LOG.info("Killing subprocess with pid: {}", this.subprocess.pid());
        this.subprocess.destroy();

    }
}
