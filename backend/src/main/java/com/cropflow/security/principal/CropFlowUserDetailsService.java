package com.cropflow.security.principal;

import com.cropflow.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CropFlowUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CropFlowUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        return userRepository.findByEmail(username.trim().toLowerCase())
                .map(CropFlowUserPrincipal::new)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Invalid authentication credentials."
                        )
                );
    }
}