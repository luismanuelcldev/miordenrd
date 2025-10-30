# Política de seguridad

Agradecemos la colaboración responsable para mantener seguro este proyecto.

## Versiones soportadas
Este repositorio es activo en la rama por defecto (master/main). Se aceptan reportes sobre dicha rama.

## Reportar una vulnerabilidad
- No abras un issue público.
- Usa la opción "Report a vulnerability" en la pestaña Security del repositorio para crear un Security Advisory privado.
- Incluye pasos para reproducir, impacto, alcance y, si es posible, propuesta de mitigación.
- El equipo evaluará el reporte y responderá en un plazo razonable con pasos a seguir y tiempos estimados.

## Manejo de secretos
- No commitear `.env` ni credenciales. Están ignorados por `.gitignore`.
- Backend: usa `.env` locales y GitHub Secrets en CI/CD.
- Frontend: expón sólo variables con prefijo `VITE_` estrictamente necesarias (nunca secretos de backend).
- Certificados/llaves (nginx/ssl, *.key, *.crt, *.pem, *.pfx) están ignorados y no deben subirse.

## Dependencias
- Dependabot está habilitado para backend, frontend y GitHub Actions (ver `.github/dependabot.yml`).
- Se ejecuta un escaneo de dependencias en cada PR (Dependency Review) y análisis CodeQL semanal.

## Divulgación
Seguimos una política de divulgación responsable. Por favor, espera coordinación antes de publicar detalles técnicos.
