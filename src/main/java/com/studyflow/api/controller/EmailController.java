package com.studyflow.api.controller;

import com.studyflow.api.repository.UserRepository;
import com.studyflow.api.service.DailyReminderScheduler;
import com.studyflow.api.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "http://localhost:5173")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private DailyReminderScheduler dailyReminderScheduler;

    @Autowired
    private UserRepository userRepository;

    private Map<String, Object> result(boolean success, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", success);
        body.put("message", message);
        return body;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return result(emailService.isConfigured(),
            emailService.isConfigured() ? "Email is configured" : "Email is not configured");
    }

    @PostMapping("/task-reminder")
    public Map<String, Object> sendTaskReminder(@RequestBody EmailRequest request) {
        try {
            emailService.sendTaskReminder(request.toEmail, request.taskTitle, request.dueDate);
            return result(true, "Task reminder sent to " + request.toEmail);
        } catch (Exception e) {
            return result(false, "Failed to send task reminder: " + e.getMessage());
        }
    }

    @PostMapping("/exam-reminder")
    public Map<String, Object> sendExamReminder(@RequestBody EmailRequest request) {
        try {
            emailService.sendExamReminder(request.toEmail, request.courseName, request.examDate);
            return result(true, "Exam reminder sent to " + request.toEmail);
        } catch (Exception e) {
            return result(false, "Failed to send exam reminder: " + e.getMessage());
        }
    }

    @PostMapping("/workload-alert")
    public Map<String, Object> sendWorkloadAlert(@RequestBody EmailRequest request) {
        try {
            emailService.sendWorkloadAlert(request.toEmail, request.message);
            return result(true, "Workload alert sent to " + request.toEmail);
        } catch (Exception e) {
            return result(false, "Failed to send workload alert: " + e.getMessage());
        }
    }

    /** Manually trigger today's digest for a user (testing or "send me today's summary"). */
    @PostMapping("/daily-digest")
    public Map<String, Object> sendDailyDigest(@RequestBody DailyDigestRequest request) {
        try {
            if (request.userId == null) {
                return result(false, "userId is required");
            }
            var user = userRepository.findById(request.userId).orElse(null);
            if (user == null) {
                return result(false, "User not found");
            }
            boolean sent = dailyReminderScheduler.sendDigestForUser(user);
            if (sent) {
                return result(true, "Daily digest sent to " + user.getEmail());
            }
            return result(true, "Nothing due today — no email sent");
        } catch (Exception e) {
            return result(false, "Failed to send daily digest: " + e.getMessage());
        }
    }

    static class DailyDigestRequest {
        public Long userId;
    }

    static class EmailRequest {
        public String toEmail;
        public String taskTitle;
        public String dueDate;
        public String courseName;
        public String examDate;
        public String message;
    }
}
