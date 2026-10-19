# Informes · Supabase

Función `draft-report` (Edge Function) del proyecto de Supabase **Automatic Reports**: recibe la solicitud de la página y redacta el borrador con Claude.

- Secreto necesario en el proyecto: `ANTHROPIC_API_KEY` (Edge Functions › Secrets). No va en el repositorio.
- Solo responde a usuarios con sesión iniciada y correo `@fluidra.com` (Authentication › Email, enlace de acceso).
- En `../index.html`, `SUPA` lleva la URL del proyecto y la clave publicable (son públicas; el acceso lo controla el inicio de sesión).
