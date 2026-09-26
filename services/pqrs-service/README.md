# PQRS Domain Microservice

Domain microservice responsible for:
- Managing PQRS requests lifecycle (CRUD operations).
- Ingesting incoming tickets and delegating real-time classification, categorization, and urgency scoring to the AI triage engine (Groq).
- Persisting request state and audit history.
