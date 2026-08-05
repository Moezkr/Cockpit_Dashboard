package com.dynamicdashboard.cockpit.identity.controller;
import com.dynamicdashboard.cockpit.identity.application.IdentityApplicationService;
import com.dynamicdashboard.cockpit.identity.application.dto.UserAccountDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
@RestController
@RequestMapping("/api/identity")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IdentityController {
    private final IdentityApplicationService identityApplicationService;
    @GetMapping("/me")
    public ResponseEntity<UserAccountDto> getCurrentUser() {
        return ResponseEntity.ok(identityApplicationService.getCurrentUser());
    }
    @GetMapping("/users")
    public ResponseEntity<List<UserAccountDto>> getAllUsers() {
        return ResponseEntity.ok(identityApplicationService.getAllUsers());
    }
}
