# Fase 7 — Inteligencia Artificial

**Estado:** ✅ Aprobada
**Fecha de creación:** 2026-07-07
**Última actualización:** 2026-07-07
**Fuente:** `SRS_DonaConnect_Ecuador_ISO29148.docx` (RF-014, RF-015, RF-016, §5.2) + Fases 1, 2, 6 + `docs/DECISIONES.md` (ADR-010) + skill `claude-api` (referencia oficial Anthropic, consultada 2026-07-07)

## Historial de cambios
| Fecha | Descripción |
|---|---|
| 2026-07-07 | Versión inicial. Selección de proveedor y modelo (Claude/Anthropic, diferenciado por tarea), diseño de chatbot, clasificación, matching y moderación asistida por IA, plantillas de prompts, decisión de no usar RAG, y prompt caching como estrategia de costo. |
| 2026-07-07 | Aprobada por el usuario sin cambios. Se avanza a Fase 8. |

---

## 1. Selección de proveedor y modelo

El SRS deja abierto el proveedor ("OpenAI / Claude / proveedor equivalente", §2.4.3). Se elige **Claude (Anthropic)**.

**Justificación:**
- Soporta **salida estructurada nativa** (`output_config.format` con JSON Schema) que garantiza que la clasificación siempre sea parseable — crítico para RF-015, que debe mapear a un enum de categorías reales, no texto libre.
- **Prompt caching** reduce significativamente el costo de las partes estáticas del prompt (persona del chatbot, reglas de la plataforma), relevante para un proyecto académico con presupuesto acotado.
- Buen desempeño en español, relevante porque §7.2 exige que el sistema opere en español.

**Modelos, diferenciados por tarea** (no un solo modelo para todo — cada tarea tiene un perfil de costo/calidad distinto):

| Tarea | Modelo | Justificación |
|---|---|---|
| Chatbot (RF-014) | `claude-sonnet-5` | Conversación de mayor calidad; precio introductorio ($2/$10 por MTok hasta 2026-08-31) lo hace muy competitivo justo en la ventana del proyecto académico |
| Clasificación (RF-015) | `claude-haiku-4-5` | Tarea acotada y de alto volumen (se dispara en cada publicación); Haiku soporta salida estructurada nativa y es el más económico ($1/$5 por MTok) |
| Matching (RF-016) | `claude-haiku-4-5` | Mismo perfil que clasificación: tarea de scoring acotada, no requiere razonamiento profundo |
| Moderación asistida (nueva, ver sección 4) | `claude-haiku-4-5` | Igual — clasificación de riesgo acotada |

→ **ADR-024**.

---

## 2. Chatbot (RF-014, CU-009)

**Modelo:** `claude-sonnet-5`, sin extended thinking (no lo requiere una tarea conversacional de orientación).

**Alcance funcional** (RF-014 literal): orientar sobre donaciones, solicitudes, trueques, categorías, seguridad y funcionamiento del sistema. **Fuera de alcance explícito:** no da asesoría legal/médica/financiera, no verifica condición socioeconómica (§1.2/§5.2 — debe declararlo si se le pregunta).

**Arquitectura de la conversación:**
- `IAProviderAdapter.chat(mensaje, historial)` (Fase 6) — el backend nunca llama a Claude desde el frontend (ADR-010).
- **System prompt estático**, cacheado con `cache_control: {type: "ephemeral"}` (ADR-026) — contiene persona, alcance, reglas de la plataforma y FAQ (ver sección 5).
- **Historial acotado:** se envían los últimos ~10-15 mensajes de la sesión (no la conversación completa) para controlar costo y mantenerse dentro de RNF-002 (≤10s).
- Toda la conversación se persiste en `chatbot_conversaciones` (MongoDB, Fase 3) para auditoría y para alimentar `analisis_ia`.

---

## 3. Clasificación (RF-015, CU-013)

**Modelo:** `claude-haiku-4-5`, salida estructurada.

**Disparo:** al llegar al último paso del wizard de publicación (Fase 5, paso 5 "Revisión") para donación, solicitud o trueque.

**Entrada:** título + descripción ingresados por el usuario, más la **lista de categorías vigentes** consultada en vivo a la tabla `categorias` (Fase 3) — nunca una lista hardcodeada, para que la IA solo pueda sugerir categorías que realmente existen en el catálogo.

**Salida estructurada** (`output_config.format`, JSON Schema con `enum` dinámico de nombres de categoría):
```json
{
  "categoriaSugerida": "<uno de los nombres vigentes en categorias>",
  "tituloSugerido": "string",
  "descripcionSugerida": "string",
  "prioridadSugerida": "BAJA | MEDIA | ALTA"  // solo aplica a solicitudes
}
```

→ **ADR-025** (salida estructurada, no parsing de texto libre).

**Human-in-the-loop:** la sugerencia se muestra editable en `IASuggestionBox` (Fase 5); el usuario decide usarla o no antes de publicar (ya establecido en ADR-010). Se registra en `analisis_ia` (Fase 3) junto con el `score`/confianza si el modelo lo reporta.

---

## 4. Matching (RF-016, CU-014)

**Enfoque híbrido** (ya esbozado en Fase 1/6, se detalla aquí):

1. **Filtro determinista en PostgreSQL** (sin IA): candidatos con misma categoría, estado compatible (`ABIERTA`/`PUBLICADA`) y ubicación dentro de un radio razonable (`MapsAdapter.calcularDistancia`). Esto acota la lista antes de gastar tokens de IA.
2. **Scoring con `claude-haiku-4-5`** sobre los candidatos preseleccionados (no sobre toda la base de datos): compara título/descripción de la solicitud/donación/trueque contra cada candidato y devuelve un score de relevancia.

**Salida estructurada:**
```json
{ "candidatoId": "uuid", "score": 0.0, "razon": "string breve" }
```

Prioriza `urgencia: ALTA` en el orden final (regla de negocio, no delegada a la IA).

---

## 5. Moderación asistida por IA (nueva capacidad — no explícita como RF en el SRS)

El §5.2 del SRS exige "moderar contenido inadecuado, fraudulento, peligroso o que exponga datos sensibles", pero el mecanismo descrito (RF-018, Panel administrativo) es manual. Se propone una capa de **pre-moderación asistida por IA** que **nunca decide, solo marca** para revisión humana — coherente con ADR-010 y con §1.2 (el sistema no certifica nada).

**Disparo:** automático al crear cualquier donación/solicitud/trueque (listener del evento `DonacionPublicada`/`SolicitudCreada`/`TruequePublicado`, Fase 6).

**Salida estructurada:**
```json
{ "riesgoDetectado": true, "categoriaRiesgo": "CONTENIDO_INADECUADO | POSIBLE_FRAUDE | DATOS_SENSIBLES_EXPUESTOS", "confianza": 0.0, "explicacion": "string" }
```

El resultado se muestra como badge de riesgo en el panel de administración (`PublicacionCard`/tabla de moderación, Fase 5) — nunca bloquea ni elimina automáticamente la publicación.

⚠️ **Clasificación de alcance:** esta capacidad **no estaba en el MVP "Must have" de Fase -1** (los 16 RF "Alta"). Se propone como **"Should have"**, igual que RF-016/RF-017/RF-019/RF-020, para no comprometer las 6 semanas. → **ADR-027**.

---

## 6. Prompts (plantillas — estructura, no redacción final)

**Chatbot (system prompt, cacheado):**
```
Rol: Asistente de DonaConnect Ecuador.
Alcance: orientar sobre donaciones, solicitudes, trueques, categorías,
seguridad y funcionamiento de la plataforma.
Fuera de alcance: no das asesoría legal/médica/financiera; no verificas
la condición socioeconómica de nadie (declarar esto si te lo preguntan).
Estilo: español, claro, breve.
[FAQ y reglas de la plataforma embebidas aquí — ver sección 7]
```

**Clasificación:**
```
Dado el título y descripción de una publicación, sugiere:
- categoriaSugerida (debe ser EXACTAMENTE uno de: {lista dinámica de categorias.nombre})
- tituloSugerido, descripcionSugerida (mejoras breves, mismo idioma)
- prioridadSugerida (solo si es solicitud): BAJA | MEDIA | ALTA
Responde solo en el formato JSON solicitado.
```

**Matching:**
```
Compara la publicación A contra el candidato B (misma categoría,
ya filtrados por ubicación/estado). Da un score 0-1 de qué tan bien
B satisface la necesidad/objeto de A, y una razón breve.
```

**Moderación:**
```
Evalúa si esta publicación podría ser contenido inadecuado, fraudulento,
peligroso o exponer datos sensibles (direcciones exactas, números de
identificación, contacto directo fuera de la plataforma). No decidas
si se aprueba o rechaza — solo marca el riesgo para revisión humana.
```

---

## 7. Estrategia RAG — no aplica

El chatbot necesita conocer las reglas/FAQ de la plataforma (cómo donar, cómo funciona un trueque, políticas de privacidad de ubicación, etc.), pero ese corpus es **pequeño y estático** (unas pocas páginas de texto), no un catálogo grande ni cambiante. Un sistema de recuperación aumentada (RAG, con embeddings y búsqueda vectorial) agregaría infraestructura (base de datos vectorial, pipeline de indexación) sin beneficio real a esta escala.

**Decisión:** el FAQ/reglas se **embebe directamente en el system prompt** del chatbot (sección 6), cacheado con prompt caching para que el costo de repetirlo en cada llamada sea marginal. → **ADR-026**.

Si el catálogo de categorías o el FAQ crecieran sustancialmente en una fase posterior al MVP, esta decisión se revisaría — no es una limitación técnica, es una decisión de alcance para 6 semanas académicas.

---

## 8. Prompt caching como estrategia de costo

Las partes estáticas de los prompts (persona/reglas del chatbot, instrucciones de clasificación, instrucciones de moderación) se marcan con `cache_control: {type: "ephemeral"}`. Esto es especialmente relevante para:
- El chatbot, cuyo system prompt (persona + FAQ) es idéntico en cada llamada.
- Clasificación y moderación, que se disparan en **cada** publicación nueva — sin caching, cada llamada paga el precio completo de las instrucciones repetidas.

→ Parte de **ADR-026**.

---

## Nuevas decisiones de esta fase (ver `docs/DECISIONES.md`)
- ADR-024 — Claude (Anthropic) como proveedor de IA; modelos diferenciados por tarea (Sonnet 5 para chatbot, Haiku 4.5 para clasificación/matching/moderación).
- ADR-025 — Salida estructurada (`output_config.format`) para clasificación y matching, nunca parsing de texto libre.
- ADR-026 — Sin RAG; conocimiento estático embebido en system prompt con prompt caching.
- ADR-027 — Moderación asistida por IA como capacidad nueva "Should have" (no en el MVP "Must" de Fase -1), siempre human-in-the-loop.

---

**Aprobación:** Aprobada por el usuario (2026-07-07). Fase cerrada.
