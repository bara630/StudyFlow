package com.studyflow.api.controller;

import com.studyflow.api.model.User;
import com.studyflow.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email).matches();
    }

    // Returns the public-safe view of a user (never the password).
    private Map<String, Object> publicUser(User user) {
        Map<String, Object> safe = new HashMap<>();
        safe.put("id", user.getId());
        safe.put("username", user.getUsername());
        safe.put("email", user.getEmail());
        safe.put("name", user.getName());
        return safe;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (request.username == null || request.username.trim().length() < 3) {
            response.put("success", false);
            response.put("message", "Username must be at least 3 characters");
            return response;
        }

        if (!isValidEmail(request.email)) {
            response.put("success", false);
            response.put("message", "Invalid email format");
            return response;
        }

        if (request.password == null || request.password.length() < 6) {
            response.put("success", false);
            response.put("message", "Password must be at least 6 characters");
            return response;
        }

        String username = request.username.trim();
        if (userRepository.existsByUsername(username)) {
            response.put("success", false);
            response.put("message", "Username already taken");
            return response;
        }

        if (userRepository.existsByEmail(request.email.trim())) {
            response.put("success", false);
            response.put("message", "An account with that email already exists");
            return response;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(request.email.trim());
        user.setName(request.name != null && !request.name.trim().isEmpty() ? request.name.trim() : username);
        user.setPassword(request.password);

        User savedUser = userRepository.save(user);
        response.put("success", true);
        response.put("user", publicUser(savedUser));
        response.put("message", "Registration successful");
        return response;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (request.username == null || request.username.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Username is required");
            return response;
        }

        if (request.password == null || request.password.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Password is required");
            return response;
        }

        Optional<User> user = userRepository.findByUsername(request.username.trim());

        // Same generic message whether the user is missing or the password is wrong,
        // so attackers can't tell which usernames exist.
        if (user.isPresent() && request.password.equals(user.get().getPassword())) {
            response.put("success", true);
            response.put("user", publicUser(user.get()));
            response.put("message", "Login successful");
        } else {
            response.put("success", false);
            response.put("message", "Invalid username or password");
        }

        return response;
    }

    static class RegisterRequest {
        public String username;
        public String email;
        public String name;
        public String password;
    }

    static class LoginRequest {
        public String username;
        public String password;
    }
}
