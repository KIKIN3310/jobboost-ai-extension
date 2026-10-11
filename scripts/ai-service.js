/**
 * JobBoost AI - Servicio LLM y Procesamiento Semántico
 * Implementa Language Matching Estricto, Salida Ejecutiva sin Emojis y Cero Clichés.
 */

window.JobBoostAIService = (() => {

  /**
   * Detector automático del idioma principal de la oferta de trabajo
   * @param {string} text Texto completo de la vacante
   * @returns {'en' | 'es'} Idioma detectado
   */
  function detectJobLanguage(text) {
    if (!text) return 'es';
    const sample = (' ' + text + ' ').toLowerCase();

    const enIndicators = [
      ' the ', ' and ', ' with ', ' for ', ' experience ', ' responsibilities ',
      ' qualifications ', ' requirements ', ' team ', ' role ', ' position ',
      ' management ', ' skills ', ' communication ', ' working ', ' support '
    ];

    const esIndicators = [
      ' de ', ' en ', ' y ', ' para ', ' experiencia ', ' responsabilidades ',
      ' requisitos ', ' equipo ', ' puesto ', ' trabajo ', ' gestión ',
      ' habilidades ', ' comunicación ', ' funciones ', ' desarrollo ', ' soporte '
    ];

    let enCount = 0;
    let esCount = 0;

    enIndicators.forEach(w => {
      const occ = sample.split(w).length - 1;
      enCount += occ;
    });

    esIndicators.forEach(w => {
      const occ = sample.split(w).length - 1;
      esCount += occ;
    });

    return enCount >= esCount ? 'en' : 'es';
  }

  /**
   * Genera insights completos para la vacante seleccionada
   */
  async function generateJobInsights({ jobData, userProfile, apiKey, toneStyle = 'startup', language = 'auto' }) {
    const detectedLang = detectJobLanguage((jobData.title || '') + ' ' + (jobData.description || ''));

    if (apiKey && apiKey.trim().length > 10) {
      try {
        return await callGeminiFlash({ jobData, userProfile, apiKey: apiKey.trim(), toneStyle, matchedLang: detectedLang });
      } catch (err) {
        console.warn('[JobBoost AI] Error en Gemini Flash. Pasando a motor estructurado local:', err);
        return fallbackLocalEngine({ jobData, userProfile, toneStyle, matchedLang: detectedLang });
      }
    }

    return fallbackLocalEngine({ jobData, userProfile, toneStyle, matchedLang: detectedLang });
  }

  /**
   * Llamada a Gemini Flash con instrucciones de redacción ejecutiva
   */
  async function callGeminiFlash({ jobData, userProfile, apiKey, toneStyle, matchedLang }) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const isEnglish = matchedLang === 'en';
    const targetLanguageName = isEnglish ? 'ENGLISH' : 'ESPAÑOL';

    const systemPrompt = `You are a discreet, senior executive recruiter and career strategist.
Analyze the job posting and candidate profile to generate a focused, evidence-based application.

CRITICAL DIRECTIVE #1 — TOTAL BAN ON EMOJIS (STRICT):
PROHIBITED: Never use emojis (such as 🚀, ✨, 📌, 💡, 🚩, ✅, ⚠️, etc.) under any circumstance in the cover letter, InMail note, STAR answers, or ATS feedback. The output must read as if authored by a senior human professional with high corporate standards.

CRITICAL DIRECTIVE #2 — MANDATORY LANGUAGE MATCHING:
- The job description is written in: ${targetLanguageName}.
- You MUST generate 100% of your JSON response (cover_letter, recruiter_note, red_flags, job_health_score, ats_analysis, interview_prep) strictly in ${targetLanguageName}.
- Never generate Spanish content for an English job description, nor English content for a Spanish job description.

CRITICAL DIRECTIVE #3 — SALUTATION AND STRUCTURE:
- Do NOT use informal greetings such as "Hello team at [Company]:" or "Hola equipo de [Company]:".
- If the job is in English, start with: "Dear Hiring Team," or "Dear Hiring Manager,".
- If the job is in Spanish, start with: "Estimado equipo de selección," or "Estimado equipo de ${jobData.company},".

CRITICAL DIRECTIVE #4 — BAN ON CLICHÉS AND GENERIC FLUFF:
- STRICTLY FORBIDDEN PHRASES:
  "move the needle", "mover la aguja", "cut through red tape", "sin burocracia", "root cause", "resuelvo problemas de raíz", "writing with great enthusiasm", "les escribo con gran entusiasmo", "hope this email finds you well", "espero que se encuentre bien", "hit the ground running", "wear many hats", "ponerse la camiseta", "passionate", "apasionado", "synergy", "deeply admire your values".
- MANDATORY DEEP ANCHORING:
  You MUST cite and address AT LEAST 2 concrete, tangible requirements, initiatives, or operational domains extracted directly from the job text (e.g. specific tools, KPIs, channels, vendor relationships, guest traffic, PR activations).
  Demonstrate precisely how the candidate's demonstrated background solves those specific operational priorities.

CRITICAL DIRECTIVE #5 — TONE CONFIGURATION:
- startup: Direct, agile, focused on operational ownership, velocity, and measurable traction without bureaucratic overhead.
- corporate: Formal, structured, focused on governance, risk mitigation, ROI, cross-functional stakeholder management, and scalable standards.
- concise: Exactly 2 brief paragraphs separated by 3 bullet points with quantifiable metrics and percentages.

CRITICAL DIRECTIVE #6 — INMAIL NOTE:
- Human, direct, hyper-specific to this role, maximum 280 characters.
- If recruiterName is provided ("${jobData.recruiterName || ''}"), address them respectfully by first name.
- Strictly in ${targetLanguageName}, zero emojis.

CRITICAL DIRECTIVE #7 — OUTPUT FORMAT:
- Valid JSON only. Do NOT use markdown code fences.`;

    const userPrompt = `--- JOB VACANCY DATA ---
Title: ${jobData.title}
Company: ${jobData.company}
Recruiter: ${jobData.recruiterName || 'Not detected'}
Language to use for all fields: ${targetLanguageName}
Selected Tone: ${toneStyle}

Job Description (Full Text):
${jobData.description.slice(0, 15000)}

--- CANDIDATE PROFILE ---
Name: ${userProfile.userName || 'Candidate'}
Current Role: ${userProfile.userRole || 'Professional'}
Key Skills: ${userProfile.userSkills || 'Not specified'}
CV Summary:
${userProfile.userSummary || 'Relevant industry experience.'}

Expected JSON Schema:
{
  "cover_letter": "string (< 220 words, strictly in ${targetLanguageName}, zero emojis, zero clichés, anchored to at least 2 tangible job requirements)",
  "recruiter_note": "string (<= 280 chars, strictly in ${targetLanguageName}, zero emojis)",
  "red_flags": ["string"],
  "job_health_score": "${isEnglish ? 'Balanced' : 'Equilibrado'}",
  "ats_analysis": {
    "match_percentage": 82,
    "matched_keywords": ["keyword1", "keyword2"],
    "missing_keywords": ["keyword3", "keyword4"],
    "recommended_bullet": "string"
  },
  "interview_prep": [
    {
      "question": "string",
      "star_response": {
        "situation": "string",
        "task": "string",
        "action": "string",
        "result": "string"
      }
    }
  ]
}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Error en API Gemini (${response.status}): ${errBody}`);
    }

    const json = await response.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Respuesta vacía recibida de Gemini.');

    const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleanedText);
  }

  /**
   * Helper para extraer 2 requerimientos textuales concretos
   */
  function extractConcreteRequirements(desc, isEn) {
    if (!desc) {
      return isEn
        ? ['cross-functional delivery', 'operational performance']
        : ['coordinación de entregables', 'rendimiento operativo'];
    }

    const lines = desc.split('\n')
      .map(l => l.replace(/^[•\-\*\d\.\s]+/, '').trim())
      .filter(l => l.length > 20 && l.length < 120);

    const candidates = [];
    const keywords = isEn
      ? ['experience', 'develop', 'manage', 'coordinate', 'lead', 'traffic', 'campaigns', 'marketing', 'operations', 'execute', 'design', 'support']
      : ['experiencia', 'desarrollar', 'gestionar', 'coordinar', 'liderar', 'campañas', 'marketing', 'operaciones', 'ejecutar', 'diseño', 'soporte'];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(k => lower.includes(k))) {
        candidates.push(line);
        if (candidates.length >= 2) break;
      }
    }

    if (candidates.length >= 2) {
      return [candidates[0], candidates[1]];
    }

    if (candidates.length === 1) {
      return [candidates[0], isEn ? 'milestone tracking and cross-functional alignment' : 'seguimiento de hitos clave'];
    }

    return isEn
      ? ['operational workflows', 'performance deliverables']
      : ['optimización de procesos', 'cumplimiento de objetivos'];
  }

  /**
   * Motor semántico local sobrio, sin clichés y libre de emojis
   */
  function fallbackLocalEngine({ jobData, userProfile, toneStyle, matchedLang }) {
    const isEn = matchedLang === 'en';
    const name = userProfile.userName || (isEn ? 'Applicant' : 'Candidato');
    const role = userProfile.userRole || (isEn ? 'Specialist' : 'Profesional');
    const skillsText = userProfile.userSkills || '';
    const summaryText = userProfile.userSummary || '';
    const jobText = (jobData.description || '').toLowerCase();
    const userText = `${skillsText} ${summaryText}`.toLowerCase();

    const [req1, req2] = extractConcreteRequirements(jobData.description, isEn);

    // Detección de Red Flags sin emojis
    const detectedFlags = [];
    if (isEn) {
      if (jobText.includes('fast-paced') || jobText.includes('high stress') || jobText.includes('pressure')) {
        detectedFlags.push('Explicit emphasis on extreme pressure and ambiguous workload boundaries.');
      }
      if (jobText.includes('wear many hats') || jobText.includes('everything in between')) {
        detectedFlags.push('Ambiguous job scope ("wear many hats"), indicating lack of defined responsibilities.');
      }
      if (jobText.includes('24/7') || jobText.includes('weekend') || jobText.includes('always available')) {
        detectedFlags.push('Expectations of availability outside standard working hours.');
      }
    } else {
      if (jobText.includes('camiseta') || jobText.includes('ponerse la camiseta')) {
        detectedFlags.push('Indicio de sobrecarga horaria informal ("ponerse la camiseta").');
      }
      if (jobText.includes('alta tolerancia al estrés') || jobText.includes('bajo extrema presión')) {
        detectedFlags.push('Énfasis explícito en alta presión y tolerancia extrema a la frustración.');
      }
      if (jobText.includes('24/7') || jobText.includes('disponibilidad total') || jobText.includes('fines de semana')) {
        detectedFlags.push('Requerimiento de disponibilidad fuera del horario laboral formal.');
      }
    }

    let healthScore = isEn ? 'Balanced' : 'Equilibrado';
    if (detectedFlags.length >= 2) {
      healthScore = isEn ? 'Risk' : 'Riesgo';
    } else if (detectedFlags.length === 1) {
      healthScore = isEn ? 'Caution' : 'Precaución';
    }

    // Coincidencias ATS
    const dictionary = [
      'react', 'typescript', 'javascript', 'python', 'sql', 'node', 'aws', 'docker', 'kubernetes',
      'leadership', 'liderazgo', 'agile', 'scrum', 'sales', 'ventas', 'marketing', 'seo', 'sem',
      'kpis', 'roi', 'strategy', 'estrategia', 'budget', 'presupuesto', 'negotiation', 'negociación',
      'analytics', 'analítica', 'data', 'datos', 'product', 'producto', 'operations', 'operaciones',
      'partner', 'pr', 'traffic', 'brand', 'campaigns'
    ];

    const matched = [];
    const missing = [];

    dictionary.forEach(term => {
      if (jobText.includes(term)) {
        if (userText.includes(term)) {
          matched.push(capitalize(term));
        } else {
          missing.push(capitalize(term));
        }
      }
    });

    const matchedKeywords = matched.length > 0 ? matched.slice(0, 5) : [isEn ? 'Strategic Planning' : 'Planificación Estratégica'];
    const missingKeywords = missing.length > 0 ? missing.slice(0, 4) : [isEn ? 'Metric Tracking' : 'Seguimiento de Métricas'];

    const totalKey = matchedKeywords.length + missingKeywords.length;
    let matchPercentage = totalKey > 0 ? Math.round((matchedKeywords.length / totalKey) * 100) : 80;
    if (matchPercentage < 55) matchPercentage = 70;

    const firstMatched = matchedKeywords.slice(0, 2).join(isEn ? ' and ' : ' y ');

    // Nota InMail limpia
    let recruiterNote = '';
    const recruiterFirstName = jobData.recruiterName ? jobData.recruiterName.split(' ')[0] : null;

    if (isEn) {
      if (recruiterFirstName) {
        recruiterNote = `Dear ${recruiterFirstName}, regarding the ${jobData.title} opening at ${jobData.company}: with direct background handling ${req1.slice(0, 45)}, I welcome connecting to share how my experience supports your team's immediate deliverables.`;
      } else {
        recruiterNote = `Dear Hiring Team, regarding the ${jobData.title} position at ${jobData.company}: my background covers ${req1.slice(0, 50)}. I welcome connecting to discuss how my execution supports your upcoming milestones.`;
      }
    } else {
      if (recruiterFirstName) {
        recruiterNote = `Estimado/a ${recruiterFirstName}, respecto a la vacante de ${jobData.title} en ${jobData.company}: con experiencia en ${req1.slice(0, 45)}, me gustaría conectar para comentar cómo puedo apoyar los objetivos del equipo.`;
      } else {
        recruiterNote = `Estimado equipo de selección, respecto a la vacante de ${jobData.title} en ${jobData.company}: mi trayectoria abarca ${req1.slice(0, 50)}. Quedo a su disposición para conectar y conversar al respecto.`;
      }
    }

    if (recruiterNote.length > 280) {
      recruiterNote = recruiterNote.slice(0, 276) + '...';
    }

    // Carta de Presentación con encabezado ejecutivo estándar y cero emojis
    let coverLetter = '';

    if (isEn) {
      const salutation = 'Dear Hiring Team,';

      if (toneStyle === 'concise') {
        coverLetter = `${salutation}

I am writing regarding the ${jobData.title} position at ${jobData.company}. In my role as ${role}, my work focuses on disciplined execution, clear stakeholder alignment, and measurable performance:

- Direct execution in ${req1}, ensuring delivery predictability and continuous quality benchmarks.
- Hands-on ownership in ${req2}, streamlining operational cycles with zero delivery regressions.
- Applied leadership in ${firstMatched}, aligning day-to-day output with core business priorities.

I welcome a brief conversation to explore how my execution background can support ${jobData.company}'s upcoming milestones.

Sincerely,
${name}`;
      } else if (toneStyle === 'corporate') {
        coverLetter = `${salutation}

I am submitting my application for the ${jobData.title} position at ${jobData.company}. In my career as ${role}, I have centered my work on operational governance, risk mitigation, and the consistent delivery of quantifiable outcomes across strategic programs.

Reviewing your requirements, I have direct experience managing ${req1}. My methodology ensures transparent alignment across cross-functional partners and strict adherence to organizational benchmarks. Furthermore, in relation to ${req2}, I bring a structured approach to workflow optimization and accountable reporting.

I welcome the opportunity to discuss how my background can support ${jobData.company}'s operational goals this quarter.

Sincerely,
${name}`;
      } else {
        // Startup / Tech
        coverLetter = `${salutation}

I am reaching out regarding the ${jobData.title} opening at ${jobData.company}. In my role as ${role}, my approach centers on direct ownership, fast turnaround, and delivering reliable execution across high-impact initiatives.

Looking at your priorities in ${req1}, I have repeatedly built and managed workflows that translate strategy into concrete deliverables. Regarding ${req2}, I focus on practical problem-solving and close collaboration with cross-functional partners to maintain momentum without unnecessary friction.

I would welcome a concise conversation to discuss how my execution background can support ${jobData.company}'s core milestones.

Sincerely,
${name}`;
      }
    } else {
      const salutation = `Estimado equipo de selección de ${jobData.company},`;

      if (toneStyle === 'concise') {
        coverLetter = `${salutation}

Me dirijo a ustedes respecto a la vacante de ${jobData.title}. En mi rol como ${role}, mi foco de trabajo se orienta a la entrega medible y la alineación directa con sus prioridades operativas:

- Ejecución directa en ${req1}, asegurando consistencia técnica y optimización de tiempos de respuesta en un 22%.
- Liderazgo en ${req2}, garantizando el cumplimiento de estándares sin desvíos en calidad.
- Aplicación de competencias comprobadas en ${firstMatched} para acelerar entregables prioritarios.

Quedo a su disposición para coordinar una breve conversación y revisar cómo mi experiencia puede sumar a sus metas.

Atentamente,
${name}`;
      } else if (toneStyle === 'corporate') {
        coverLetter = `${salutation}

Me dirijo a ustedes para presentar mi candidatura a la posición de ${jobData.title}. A lo largo de mi trayectoria como ${role}, he consolidado un enfoque basado en gobernanza de procesos, mitigación de riesgos operativos y cumplimiento sistemático de indicadores estratégicos.

En relación con sus requerimientos vinculados a ${req1}, cuento con experiencia demostrable coordinando proyectos transversales y asegurando estándares de calidad institucional. Asimismo, respecto a ${req2}, mi metodología prioriza la transparencia operativa y la eficiencia en la asignación de recursos.

Quedo a su disposición para coordinar una reunión y evaluar cómo mi perfil puede contribuir a los objetivos de ${jobData.company}.

Atentamente,
${name}`;
      } else {
        // Startup / Tech
        coverLetter = `${salutation}

Les escribo respecto a la vacante de ${jobData.title}. Como ${role}, mi trabajo se enfoca en la ejecución directa, el sentido de propiedad sobre los resultados y la entrega ágil de iniciativas de alto valor.

Analizando sus necesidades en ${req1}, he liderado implementaciones donde la velocidad de entrega y la consistencia operativa fueron determinantes. En cuanto a sus objetivos en ${req2}, aporto un enfoque estructurado y orientado a la acción para coordinar equipos y cumplir con las metas establecidas.

Me gustaría coordinar una breve conversación para revisar cómo mi experiencia práctica puede sumar valor a ${jobData.company}.

Atentamente,
${name}`;
      }
    }

    const recommendedBullet = isEn
      ? `- Led execution across ${req1.slice(0, 60)}, improving operational turnaround by 24% while maintaining cross-functional standards.`
      : `- Lideré iniciativas en ${req1.slice(0, 60)}, optimizando tiempos de respuesta en un 24% y garantizando estándares de calidad operativa.`;

    const interviewPrep = isEn ? [
      {
        question: `How would you prioritize execution around ${req1.slice(0, 50)} in your first 60 days?`,
        star_response: {
          situation: `Joining ${jobData.company} with immediate deliverables scheduled for the upcoming quarter.`,
          task: `Audit current workflows, align with key partners, and establish early performance baselines.`,
          action: `Conducted targeted reviews, structured the operational roadmap, and collaborated directly with stakeholders.`,
          result: `Delivered measurable stability and clear visibility into milestone progress ahead of deadline.`
        }
      },
      {
        question: `Describe a scenario where you had to manage ${req2.slice(0, 50)} under tight deadlines.`,
        star_response: {
          situation: `A high-priority project required rapid alignment across multiple operational dependencies.`,
          task: `Deliver the milestone on schedule while preserving quality and budget boundaries.`,
          action: `Mapped out critical path requirements, eliminated friction points, and conducted daily status checkpoints.`,
          result: `Completed deliverables on time with zero operational regressions.`
        }
      },
      {
        question: `What strategic question would you ask the hiring manager?`,
        star_response: {
          situation: `Final stage of the interview discussion with team leadership.`,
          task: `Demonstrate genuine focus on business realities and pragmatic problem-solving.`,
          action: `Ask: "What is the single most critical friction point currently impacting your team's velocity in ${req1.slice(0, 35)}?"`,
          result: `Uncovers candid operational reality and positions candidate as an active, high-agency problem solver.`
        }
      }
    ] : [
      {
        question: `¿Cómo priorizarías las tareas vinculadas a ${req1.slice(0, 50)} durante tus primeros 60 días?`,
        star_response: {
          situation: `Integración a un equipo en ${jobData.company} con compromisos inmediatos fijados para el trimestre.`,
          task: `Auditar procesos vigentes, alinear expectativas con líderes clave y establecer métricas base.`,
          action: `Ejecuté una revisión técnica inicial, definí prioridades claras y coordiné entregables inmediatos.`,
          result: `Se alcanzaron victorias tempranas con plena autonomía operativa antes del primer ciclo de revisión.`
        }
      },
      {
        question: `Describe una situación donde debiste coordinar ${req2.slice(0, 50)} bajo plazos ajustados.`,
        star_response: {
          situation: `Un proyecto crítico requería coordinar requerimientos complejos con múltiples áreas involucradas.`,
          task: `Entregar a tiempo sin comprometer estándares ni generar fricciones en el flujo de trabajo.`,
          action: `Estructuré un cronograma por fases, identifiqué dependencias críticas y mantuve comunicación constante.`,
          result: `Entrega en la fecha prevista con una mejora medible en la estabilidad del proceso.`
        }
      },
      {
        question: `¿Qué pregunta estratégica le formularías al evaluador técnico o gerente?`,
        star_response: {
          situation: `Fase de preguntas en la entrevista final.`,
          task: `Demostrar enfoque en negocio y resolución de fricciones reales.`,
          action: `Preguntar: "¿Cuál es el obstáculo operativo más urgente que este equipo necesita resolver en ${req1.slice(0, 35)}?"`,
          result: `Evidencia criterio analítico y posiciona al candidato como alguien orientado a soluciones.`
        }
      }
    ];

    return {
      cover_letter: coverLetter,
      recruiter_note: recruiterNote,
      red_flags: detectedFlags,
      job_health_score: healthScore,
      ats_analysis: {
        match_percentage: matchPercentage,
        matched_keywords: matchedKeywords,
        missing_keywords: missingKeywords,
        recommended_bullet: recommendedBullet
      },
      interview_prep: interviewPrep
    };
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return {
    generateJobInsights
  };

})();
