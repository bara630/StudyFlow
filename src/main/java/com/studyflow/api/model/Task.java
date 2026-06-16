package com.studyflow.api.model;

import jakarta.persistence.*;

// Explicit getters/setters are used instead of Lombok because Lombok's
// annotation processor does not run on this JDK, which previously left
// fields like dueDate without a setter (so they were never saved).
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "due_date")
    private String dueDate;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column(name = "estimated_pomodoros")
    private Integer estimatedPomodoros;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    public Integer getEstimatedPomodoros() {
        return estimatedPomodoros;
    }

    public void setEstimatedPomodoros(Integer estimatedPomodoros) {
        this.estimatedPomodoros = estimatedPomodoros;
    }
}
