package com.studyflow.api.controller;

import com.studyflow.api.model.Exam;
import com.studyflow.api.repository.ExamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@CrossOrigin(origins = "http://localhost:5173")
public class ExamController {

    @Autowired
    private ExamRepository examRepository;

    @GetMapping
    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Exam> getExamsByUserId(@PathVariable Long userId) {
        return examRepository.findByUserId(userId);
    }

    @PostMapping
    public Exam createExam(@RequestBody Exam exam) {
        return examRepository.save(exam);
    }

    @PutMapping("/{id}")
    public Exam updateExam(@PathVariable Long id, @RequestBody Exam updated) {
        Exam exam = examRepository.findById(id).orElse(null);
        if (exam == null) {
            return null;
        }
        if (updated.getCourseName() != null) {
            exam.setCourseName(updated.getCourseName());
        }
        if (updated.getExamDate() != null) {
            exam.setExamDate(updated.getExamDate());
        }
        return examRepository.save(exam);
    }

    @DeleteMapping("/{id}")
    public void deleteExam(@PathVariable Long id) {
        examRepository.deleteById(id);
    }
}
