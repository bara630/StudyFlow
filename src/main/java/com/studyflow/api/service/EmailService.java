package com.studyflow.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    // True only when a Gmail address + app password have been provided via env vars.
    public boolean isConfigured() {
        return fromAddress != null && !fromAddress.isBlank();
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException(
                "Email is not configured. Set the MAIL_USERNAME and MAIL_PASSWORD environment "
                + "variables (use a Gmail App Password) and restart the backend.");
        }
    }

    private void send(String toEmail, String subject, String body) {
        requireConfigured();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendTaskReminder(String toEmail, String taskTitle, String dueDate) {
        send(toEmail, "StudyFlow Task Reminder",
            "Don't forget to complete your task: " + taskTitle
            + "\nDue date: " + dueDate
            + "\n\nStay focused and keep up the great work!");
    }

    public void sendExamReminder(String toEmail, String courseName, String examDate) {
        send(toEmail, "StudyFlow Exam Reminder",
            "Upcoming exam alert: " + courseName
            + "\nExam date: " + examDate
            + "\n\nMake sure to review your materials and prepare well!");
    }

    public void sendWorkloadAlert(String toEmail, String messageContent) {
        send(toEmail, "StudyFlow Workload Alert", messageContent);
    }

    public void sendDailyDigest(String toEmail, String displayName, String body) {
        String greeting = (displayName != null && !displayName.isBlank()) ? displayName : "there";
        send(toEmail, "StudyFlow — Your day ahead",
            "Good morning, " + greeting + "!\n\n" + body
            + "\n\nLog in to StudyFlow to check things off. You've got this!\n"
            + "— StudyFlow");
    }
}
