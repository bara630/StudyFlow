package com.studyflow.api.service;

import com.studyflow.api.model.Exam;
import com.studyflow.api.model.Task;
import com.studyflow.api.model.User;
import com.studyflow.api.repository.ExamRepository;
import com.studyflow.api.repository.TaskRepository;
import com.studyflow.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DailyReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyReminderScheduler.class);

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ExamRepository examRepository;

    @Value("${studyflow.reminders.enabled:true}")
    private boolean remindersEnabled;

    /** Runs every day at 8:00 AM (server time). Override with studyflow.reminders.cron. */
    @Scheduled(cron = "${studyflow.reminders.cron:0 0 8 * * *}")
    public void sendMorningDigests() {
        if (!remindersEnabled) {
            return;
        }
        if (!emailService.isConfigured()) {
            log.debug("Daily reminders skipped — email not configured");
            return;
        }
        log.info("Running daily StudyFlow email digest");
        int sent = 0;
        for (User user : userRepository.findAll()) {
            if (sendDigestForUser(user)) {
                sent++;
            }
        }
        log.info("Daily digest complete — {} email(s) sent", sent);
    }

    /** Send today's digest to one user. Returns true if an email was sent. */
    public boolean sendDigestForUser(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return false;
        }

        LocalDate today = LocalDate.now();
        String todayKey = today.toString();

        List<Task> tasksDue = taskRepository
            .findByUserIdAndCompletedFalseAndDueDateStartingWith(user.getId(), todayKey);

        List<Exam> examsToday = new ArrayList<>();
        for (Exam exam : examRepository.findByUserId(user.getId())) {
            if (exam.getExamDate() != null && exam.getExamDate().toLocalDate().equals(today)) {
                examsToday.add(exam);
            }
        }

        if (tasksDue.isEmpty() && examsToday.isEmpty()) {
            return false;
        }

        String body = buildDigestBody(today, tasksDue, examsToday);
        emailService.sendDailyDigest(user.getEmail(), user.getName(), body);
        return true;
    }

    private String buildDigestBody(LocalDate today, List<Task> tasks, List<Exam> exams) {
        DateTimeFormatter pretty = DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy", Locale.ENGLISH);
        StringBuilder sb = new StringBuilder();
        sb.append("Here's what's on your plate for ").append(today.format(pretty)).append(":\n\n");

        if (!tasks.isEmpty()) {
            sb.append("TASKS DUE TODAY:\n");
            for (Task task : tasks) {
                sb.append("  • ").append(task.getTitle()).append("\n");
            }
            sb.append("\n");
        }

        if (!exams.isEmpty()) {
            sb.append("EXAMS TODAY:\n");
            for (Exam exam : exams) {
                sb.append("  • ").append(exam.getCourseName()).append("\n");
            }
            sb.append("\n");
        }

        return sb.toString().trim();
    }
}
