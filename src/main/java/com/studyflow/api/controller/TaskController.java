package com.studyflow.api.controller;

import com.studyflow.api.model.Task;
import com.studyflow.api.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Task> getTasksByUserId(@PathVariable Long userId) {
        return taskRepository.findByUserId(userId);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskRepository.save(task);
    }

    @PutMapping("/{id}/toggle")
    public Task toggleTaskComplete(@PathVariable Long id) {
        Task task = taskRepository.findById(id).orElse(null);
        if (task != null) {
            task.setCompleted(!task.getCompleted());
            return taskRepository.save(task);
        }
        return null;
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task updated) {
        Task task = taskRepository.findById(id).orElse(null);
        if (task == null) {
            return null;
        }
        if (updated.getTitle() != null) {
            task.setTitle(updated.getTitle());
        }
        // dueDate is updatable to anything, including being cleared.
        task.setDueDate(updated.getDueDate());
        return taskRepository.save(task);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }
}