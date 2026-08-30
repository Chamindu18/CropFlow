@echo off
cd /d D:\projects\CropFlow\backend
.\mvnw.cmd test -Dtest=com.cropflow.security.CsrfSecurityIntegrationTest %*