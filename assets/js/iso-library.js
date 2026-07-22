(function () {
  'use strict';

  function clause(id, title, definition, question, evidence) {
    return {
      id: id,
      title: title,
      definition: definition,
      question: question,
      evidence: evidence
    };
  }

  function section(id, title, icon, clauses) {
    return {
      id: id,
      title: title,
      icon: icon,
      clauses: clauses
    };
  }

  var ISO_LIBRARY = [
    {
      id: 'iso9001',
      code: 'ISO 9001',
      version: '2015',
      focus: 'Sistema de gestion de la calidad',
      summary: 'Control de procesos, satisfaccion del cliente y mejora continua.',
      icon: 'fa-solid fa-award',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('9001-4', '4. Contexto de la organizacion', 'fa-solid fa-building', [
          clause('9001-4.1', 'Comprension del contexto', 'La organizacion analiza factores internos y externos que afectan su direccion.', 'Existe analisis de contexto vigente y usado para decisiones?', ['Analisis FODA o PESTEL', 'Matriz de contexto']) ,
          clause('9001-4.2', 'Partes interesadas', 'Se identifican partes interesadas y sus necesidades relevantes.', 'La organizacion demuestra que conoce y actualiza requisitos de partes interesadas?', ['Matriz de partes interesadas', 'Actas de revision']) ,
          clause('9001-4.3', 'Alcance del SGC', 'Se define el alcance del sistema de gestion de calidad.', 'El alcance esta documentado y justifica exclusiones?', ['Documento de alcance', 'Mapa de procesos']) ,
          clause('9001-4.4', 'Procesos del SGC', 'Se determinan procesos, interacciones, entradas, salidas y controles.', 'Hay dueños de proceso, indicadores y controles definidos?', ['Ficha de proceso', 'KPIs por proceso'])
        ]),
        section('9001-5', '5. Liderazgo', 'fa-solid fa-users-gear', [
          clause('9001-5.1', 'Liderazgo y compromiso', 'La alta direccion lidera activamente el SGC y enfoque al cliente.', 'Direccion participa en objetivos, recursos y revision del sistema?', ['Actas de direccion', 'Plan de objetivos']) ,
          clause('9001-5.2', 'Politica de calidad', 'La politica es apropiada, comunicada y mantenida.', 'La politica se entiende y esta disponible para personal y partes pertinentes?', ['Politica aprobada', 'Evidencia de comunicacion']) ,
          clause('9001-5.3', 'Roles y responsabilidades', 'Las responsabilidades del SGC se asignan y comunican.', 'Se conocen roles de calidad, autoridad y responsables de proceso?', ['Organigrama', 'Descripciones de puesto'])
        ]),
        section('9001-6', '6. Planificacion', 'fa-solid fa-chess-knight', [
          clause('9001-6.1', 'Riesgos y oportunidades', 'Se determinan riesgos/oportunidades y acciones asociadas.', 'Existe metodologia y seguimiento de acciones de riesgo?', ['Matriz de riesgos', 'Plan de accion']) ,
          clause('9001-6.2', 'Objetivos de calidad', 'Los objetivos son medibles, monitoreados y con responsables.', 'Cada objetivo tiene meta, indicador, responsable y plazo?', ['Tablero de objetivos', 'Reportes de avance']) ,
          clause('9001-6.3', 'Planificacion de cambios', 'Los cambios del sistema se planifican de manera controlada.', 'Los cambios consideran recursos, impacto y continuidad?', ['Registro de cambios', 'Acta de aprobacion'])
        ]),
        section('9001-7', '7. Apoyo', 'fa-solid fa-screwdriver-wrench', [
          clause('9001-7.1', 'Recursos', 'Se proporcionan recursos para operar y mejorar el SGC.', 'Hay evidencia de recursos para personal, infraestructura y seguimiento?', ['Presupuesto', 'Inventario de recursos']) ,
          clause('9001-7.2', 'Competencia', 'El personal es competente por educacion, formacion y experiencia.', 'Se evalua competencia y se ejecutan planes de capacitacion?', ['Matriz de competencia', 'Constancias de capacitacion']) ,
          clause('9001-7.3', 'Toma de conciencia', 'El personal conoce politica, objetivos y su impacto.', 'El equipo comprende objetivos y consecuencias de incumplimiento?', ['Entrevistas', 'Campanas internas']) ,
          clause('9001-7.4', 'Comunicacion', 'Se define que, como, cuando y con quien comunicar.', 'Existe plan de comunicacion interna/externa operativo?', ['Plan de comunicacion', 'Correos y minutas']) ,
          clause('9001-7.5', 'Informacion documentada', 'La informacion se crea, actualiza y controla.', 'Versionado, acceso, retencion y proteccion documental estan controlados?', ['Lista maestra', 'Control de documentos'])
        ]),
        section('9001-8', '8. Operacion', 'fa-solid fa-gears', [
          clause('9001-8.1', 'Planificacion y control operacional', 'Se planifican y controlan procesos operativos para cumplir requisitos.', 'Existen criterios operativos, validaciones y registros?', ['Procedimientos operativos', 'Ordenes y registros']) ,
          clause('9001-8.2', 'Requisitos de productos/servicios', 'Se determinan y revisan requisitos del cliente.', 'Se valida factibilidad antes de comprometer entregables?', ['Requisitos del cliente', 'Revisiones de contrato']) ,
          clause('9001-8.3', 'Diseno y desarrollo', 'El diseno se planifica, controla y verifica (si aplica).', 'Hay etapas de diseno, revisiones y control de cambios?', ['Plan de diseno', 'Evidencia de validacion']) ,
          clause('9001-8.4', 'Control de proveedores externos', 'Se controlan procesos/productos/servicios externos.', 'Hay criterios de evaluacion y reevaluacion de proveedores?', ['Evaluacion de proveedores', 'Contratos y OC']) ,
          clause('9001-8.5', 'Produccion y provision del servicio', 'La ejecucion se realiza en condiciones controladas.', 'Se demuestra trazabilidad, identificacion y preservacion?', ['Registros de produccion', 'Bitacoras de servicio']) ,
          clause('9001-8.6', 'Liberacion de productos/servicios', 'Solo se libera lo conforme con criterios definidos.', 'La liberacion cuenta con autorizacion y evidencia de verificacion?', ['Checklist de liberacion', 'Aprobaciones']) ,
          clause('9001-8.7', 'Control de no conformes', 'Las salidas no conformes se identifican y controlan.', 'Se evita uso no intencional y se documenta tratamiento?', ['Registro de no conformes', 'Acciones de contencion'])
        ]),
        section('9001-9', '9. Evaluacion del desempeno', 'fa-solid fa-chart-line', [
          clause('9001-9.1', 'Seguimiento y medicion', 'Se monitorean procesos, resultados y satisfaccion del cliente.', 'Hay indicadores, metas, analisis y decisiones asociadas?', ['KPIs', 'Encuestas de satisfaccion']) ,
          clause('9001-9.2', 'Auditoria interna', 'Se ejecuta programa de auditoria interna basado en riesgo.', 'El programa cubre alcance, criterios, frecuencia y cierre?', ['Programa de auditoria', 'Informes y planes de accion']) ,
          clause('9001-9.3', 'Revision por la direccion', 'Direccion revisa desempeno, riesgos y oportunidades de mejora.', 'La revision define decisiones, responsables y seguimiento?', ['Acta de revision', 'Minuta de acuerdos'])
        ]),
        section('9001-10', '10. Mejora', 'fa-solid fa-rocket', [
          clause('9001-10.1', 'Generalidades de mejora', 'Se identifican oportunidades para mejorar productos, servicios y procesos.', 'La organizacion mantiene portafolio de mejoras priorizadas?', ['Backlog de mejora', 'Evaluacion de impacto']) ,
          clause('9001-10.2', 'No conformidad y accion correctiva', 'Se corrige, investiga causa raiz y previene recurrencia.', 'Existe metodologia de causa raiz y verificacion de eficacia?', ['8D / Ishikawa / 5 porques', 'Cierre de acciones']) ,
          clause('9001-10.3', 'Mejora continua', 'Se mejora continuamente conveniencia y eficacia del SGC.', 'Se observa tendencia positiva de indicadores y madurez?', ['Historico de indicadores', 'Proyectos Kaizen'])
        ])
      ]
    },
    {
      id: 'iso27001',
      code: 'ISO/IEC 27001',
      version: '2022',
      focus: 'Sistema de gestion de seguridad de la informacion',
      summary: 'Gestion de riesgos, controles y resiliencia de la informacion.',
      icon: 'fa-solid fa-shield-halved',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('27001-4', '4. Contexto del SGSI', 'fa-solid fa-network-wired', [
          clause('27001-4.1', 'Contexto de la organizacion', 'Se analizan factores internos/externos del SGSI.', 'Existe contexto definido para alcance y riesgo de seguridad?', ['Analisis de contexto', 'Mapa de activos']) ,
          clause('27001-4.2', 'Partes interesadas', 'Se identifican requisitos relevantes de interesados.', 'Se incluyen requisitos regulatorios y contractuales?', ['Matriz de requisitos', 'Obligaciones legales']) ,
          clause('27001-4.3', 'Alcance del SGSI', 'Se delimita alcance del sistema de seguridad.', 'El alcance incluye interfaces, ubicaciones y tecnologias?', ['Declaracion de alcance', 'Diagrama de arquitectura']) ,
          clause('27001-4.4', 'SGSI y procesos', 'Se establecen procesos del SGSI y su mejora.', 'Los procesos del SGSI tienen responsables e indicadores?', ['Procedimientos SGSI', 'Mapa de procesos'])
        ]),
        section('27001-5', '5. Liderazgo', 'fa-solid fa-user-shield', [
          clause('27001-5.1', 'Liderazgo y compromiso', 'Direccion respalda objetivos de seguridad.', 'Direccion aprueba politicas y asigna recursos?', ['Actas de comite', 'Presupuesto de seguridad']) ,
          clause('27001-5.2', 'Politica de seguridad', 'Politica definida, comunicada y disponible.', 'La politica es conocida por personal y terceros relevantes?', ['Politica firmada', 'Comunicados']) ,
          clause('27001-5.3', 'Roles y responsabilidades', 'Responsabilidades de seguridad formalizadas.', 'Existe definicion de autoridad para decisiones de riesgo?', ['RACI seguridad', 'Roles de custodia'])
        ]),
        section('27001-6', '6. Planificacion', 'fa-solid fa-triangle-exclamation', [
          clause('27001-6.1.1', 'Acciones de riesgo y oportunidad', 'Se planifican acciones para abordar riesgos y oportunidades.', 'Se integra riesgo de seguridad al plan estrategico?', ['Plan de riesgos', 'Roadmap SGSI']) ,
          clause('27001-6.1.2', 'Evaluacion de riesgos', 'Se ejecuta evaluacion de riesgos con criterios definidos.', 'La metodologia evalua impacto, probabilidad y nivel de aceptacion?', ['Metodologia de riesgos', 'Matriz de evaluacion']) ,
          clause('27001-6.1.3', 'Tratamiento de riesgos', 'Se definen tratamientos y controles aplicables.', 'Existe declaracion de aplicabilidad y responsables?', ['Plan de tratamiento', 'SoA']) ,
          clause('27001-6.2', 'Objetivos de seguridad', 'Objetivos medibles y monitoreados de seguridad.', 'Cada objetivo tiene KPI y seguimiento formal?', ['Tablero SGSI', 'Reportes de avance'])
        ]),
        section('27001-7', '7. Soporte', 'fa-solid fa-toolbox', [
          clause('27001-7.1', 'Recursos', 'Recursos suficientes para operar SGSI.', 'Se cubren herramientas, personal y servicios de seguridad?', ['Inventario de herramientas', 'Plan de recursos']) ,
          clause('27001-7.2', 'Competencia', 'Competencia del personal en seguridad.', 'Hay programa de capacitacion por rol?', ['Plan anual de capacitacion', 'Evidencia de evaluacion']) ,
          clause('27001-7.3', 'Toma de conciencia', 'Conciencia sobre politica, amenazas y responsabilidades.', 'El personal identifica riesgos y sabe reportarlos?', ['Campanas de awareness', 'Phishing simulations']) ,
          clause('27001-7.4', 'Comunicacion', 'Comunicaciones de seguridad planificadas.', 'Se definen canales para incidentes y cambios?', ['Protocolo de comunicacion', 'Matriz de escalamiento']) ,
          clause('27001-7.5', 'Informacion documentada', 'Control documental del SGSI.', 'Versionado y retencion de evidencia se encuentran controlados?', ['Repositorio documental', 'Historial de versiones'])
        ]),
        section('27001-8-10', '8-10 Operacion, evaluacion y mejora', 'fa-solid fa-lock', [
          clause('27001-8.1', 'Planificacion y control operacional', 'Se opera el SGSI bajo controles planificados.', 'Se conservan evidencias operativas y de control?', ['Bitacoras', 'Registros operativos']) ,
          clause('27001-9.1', 'Monitoreo y medicion', 'Se mide eficacia de controles y objetivos.', 'Se reporta tendencia de incidentes, vulnerabilidades y cumplimiento?', ['Dashboard de seguridad', 'Reportes mensuales']) ,
          clause('27001-9.2', 'Auditoria interna SGSI', 'Auditorias internas para conformidad y eficacia.', 'Se auditan controles criticos y se cierran hallazgos?', ['Plan de auditoria SGSI', 'Seguimiento de NC']) ,
          clause('27001-9.3', 'Revision por direccion', 'Direccion revisa desempeno del SGSI.', 'Se toman decisiones sobre riesgo residual y recursos?', ['Acta de revision', 'Plan de decisiones']) ,
          clause('27001-10.1', 'Mejora continua', 'Se corrigen desviaciones y se mejora SGSI.', 'Las lecciones de incidentes alimentan mejoras?', ['RCA de incidentes', 'Plan de mejora']) ,
          clause('27001-A.5', 'Controles organizacionales', 'Gobierno de seguridad, politicas y roles.', 'Controles A.5 estan evaluados y justificados?', ['SoA A.5', 'Politicas']) ,
          clause('27001-A.6', 'Controles de personas', 'Controles para personal antes, durante y despues de empleo.', 'Se gestionan confidencialidad y medidas disciplinarias?', ['Contratos', 'Proceso RH']) ,
          clause('27001-A.7', 'Controles fisicos', 'Seguridad fisica y perimetral.', 'Se protegen areas sensibles y activos fisicos?', ['Control de acceso fisico', 'CCTV / bitacora']) ,
          clause('27001-A.8', 'Controles tecnologicos', 'Seguridad tecnica de sistemas y redes.', 'Se aplican controles de acceso, hardening y respaldo?', ['MFA, backups, monitoreo', 'Pruebas de vulnerabilidad'])
        ])
      ]
    },
    {
      id: 'iso37001',
      code: 'ISO 37001',
      version: '2025',
      focus: 'Sistema de gestion antisoborno',
      summary: 'Prevencion, deteccion y tratamiento de riesgos de soborno.',
      icon: 'fa-solid fa-scale-balanced',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('37001-4-6', '4-6 Contexto, liderazgo y planificacion', 'fa-solid fa-gavel', [
          clause('37001-4.1', 'Contexto ABMS', 'Se analizan factores que afectan al sistema antisoborno.', 'Se consideran jurisdicciones, sectores y operaciones sensibles?', ['Analisis de contexto', 'Mapa de exposicion']) ,
          clause('37001-4.2', 'Partes interesadas', 'Se determinan necesidades de interesados relevantes.', 'Se incluyen requisitos de reguladores y clientes?', ['Matriz de stakeholders', 'Requisitos contractuales']) ,
          clause('37001-4.3', 'Alcance ABMS', 'Se define alcance del sistema antisoborno.', 'El alcance incluye terceros criticos y filiales?', ['Documento de alcance', 'Mapa organizacional']) ,
          clause('37001-4.5', 'Evaluacion de riesgo de soborno', 'Se evalua riesgo de soborno de forma periodica.', 'La metodologia incluye probabilidad, impacto y controles?', ['Matriz de riesgo soborno', 'Plan de tratamiento']) ,
          clause('37001-5.1', 'Liderazgo y cultura antisoborno', 'Direccion promueve cultura de integridad y cero soborno.', 'Existe comunicacion activa y ejemplo de la direccion?', ['Mensajes de liderazgo', 'Actas de comite']) ,
          clause('37001-5.2', 'Politica antisoborno', 'Politica formal y comunicada.', 'La politica es difundida a personal y socios?', ['Politica firmada', 'Evidencia de comunicacion']) ,
          clause('37001-5.3', 'Funcion de cumplimiento', 'Funcion independiente con autoridad para cumplimiento.', 'La funcion tiene recursos y acceso a direccion?', ['Nombramiento oficial', 'Reportes de cumplimiento']) ,
          clause('37001-6.1', 'Acciones sobre riesgos', 'Se planifican acciones sobre riesgos y oportunidades ABMS.', 'Las acciones tienen responsables y plazos?', ['Plan de accion ABMS', 'Seguimiento']) ,
          clause('37001-6.2', 'Objetivos antisoborno', 'Objetivos medibles de cumplimiento.', 'Los objetivos se miden y revisan periodicamente?', ['KPIs de cumplimiento', 'Reporte trimestral'])
        ]),
        section('37001-7-8', '7-8 Soporte y operacion', 'fa-solid fa-handshake-slash', [
          clause('37001-7.2', 'Competencia', 'Competencia del personal en etica y cumplimiento.', 'Se capacita por riesgo y funcion?', ['Plan de capacitacion', 'Evaluaciones']) ,
          clause('37001-7.3', 'Sensibilizacion', 'Conciencia sobre riesgos, politica y canal de reporte.', 'El personal conoce como reportar sospechas?', ['Campanas internas', 'Encuestas']) ,
          clause('37001-7.4', 'Comunicacion', 'Comunicaciones internas y externas sobre ABMS.', 'Existe protocolo para incidentes y casos sensibles?', ['Protocolo de comunicacion', 'Registros']) ,
          clause('37001-7.5', 'Informacion documentada', 'Control documental del ABMS.', 'Hay versionado y resguardo de evidencia?', ['Lista maestra', 'Repositorio']) ,
          clause('37001-8.2', 'Debida diligencia', 'Se aplica due diligence a terceros y operaciones.', 'La due diligence es proporcional al riesgo?', ['Checklists DD', 'Evaluaciones de terceros']) ,
          clause('37001-8.3', 'Controles financieros', 'Se previenen pagos indebidos y registros anormales.', 'Se detectan patrones de riesgo financiero?', ['Controles contables', 'Auditoria de pagos']) ,
          clause('37001-8.4', 'Controles no financieros', 'Controles sobre regalos, hospitalidades, donaciones y patrocinios.', 'Existe autorizacion y trazabilidad?', ['Registro de regalos', 'Flujos de aprobacion']) ,
          clause('37001-8.7', 'Regalos y hospitalidades', 'Gestion de beneficios con limites y criterios.', 'Se controla conflicto de interes y umbrales?', ['Politica de regalos', 'Declaraciones']) ,
          clause('37001-8.8', 'Gestion de insuficiencia de controles', 'Se corrigen brechas de control detectadas.', 'Las brechas se atienden con accion formal?', ['Registro de brechas', 'Plan de correccion']) ,
          clause('37001-8.9', 'Canal de denuncias', 'Mecanismo confiable para reportar sospechas.', 'El canal protege confidencialidad y no represalia?', ['Canal activo', 'Reporte de casos']) ,
          clause('37001-8.10', 'Investigacion y tratamiento', 'Investigacion de casos y decisiones correctivas.', 'Las investigaciones tienen evidencia, analisis y cierre?', ['Expedientes de investigacion', 'Acciones disciplinarias'])
        ]),
        section('37001-9-10', '9-10 Evaluacion y mejora', 'fa-solid fa-magnifying-glass-chart', [
          clause('37001-9.1', 'Seguimiento y analisis', 'Se miden desempeno y eficacia del ABMS.', 'Existen indicadores de incidentes, tiempos y recurrencia?', ['Dashboard ABMS', 'Informes']) ,
          clause('37001-9.2', 'Auditoria interna ABMS', 'Auditoria periodica del sistema antisoborno.', 'Se auditan procesos y terceros de alto riesgo?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('37001-9.3', 'Revision por direccion', 'Direccion revisa estado del ABMS y toma decisiones.', 'La revision define prioridades y recursos?', ['Acta de direccion', 'Plan ejecutivo']) ,
          clause('37001-10.1', 'No conformidad', 'Se atienden desviaciones del ABMS.', 'Se registra tratamiento y verificacion?', ['Registro NC', 'Seguimiento']) ,
          clause('37001-10.2', 'Accion correctiva y mejora', 'Se elimina causa raiz y se fortalece el sistema.', 'Se demuestra eficacia de las acciones?', ['RCA', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso14001',
      code: 'ISO 14001',
      version: '2015',
      focus: 'Sistema de gestion ambiental',
      summary: 'Gestion de impactos ambientales y cumplimiento legal.',
      icon: 'fa-solid fa-leaf',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('14001-main', '4-10 Requisitos ambientales clave', 'fa-solid fa-seedling', [
          clause('14001-4.1', 'Contexto ambiental', 'Analisis de factores ambientales internos y externos.', 'Se actualiza el contexto ambiental del negocio?', ['Analisis de contexto', 'Matriz PESTEL']) ,
          clause('14001-4.2', 'Partes interesadas ambientales', 'Necesidades y obligaciones de partes interesadas.', 'Se identifican comunidades, autoridades y clientes relevantes?', ['Matriz de partes interesadas', 'Registro legal']) ,
          clause('14001-6.1.2', 'Aspectos e impactos ambientales', 'Identificacion y evaluacion de aspectos ambientales.', 'Hay criterios para significancia y priorizacion?', ['Matriz de aspectos', 'Plan de control']) ,
          clause('14001-6.1.3', 'Obligaciones de cumplimiento', 'Requisitos legales y otros compromisos ambientales.', 'Se monitorea cumplimiento regulatorio vigente?', ['Matriz legal', 'Evidencia de cumplimiento']) ,
          clause('14001-6.2', 'Objetivos ambientales', 'Objetivos medibles y planificados.', 'Cada objetivo ambiental tiene plan y responsable?', ['Objetivos anuales', 'KPIs ambientales']) ,
          clause('14001-7.2', 'Competencia ambiental', 'Competencia del personal en temas ambientales.', 'El personal critico recibe formacion ambiental?', ['Capacitaciones', 'Evaluaciones']) ,
          clause('14001-8.1', 'Control operacional ambiental', 'Controles operacionales sobre actividades significativas.', 'Existen controles de residuos, emisiones y consumos?', ['Procedimientos', 'Bitacoras operativas']) ,
          clause('14001-8.2', 'Emergencias ambientales', 'Preparacion y respuesta ante emergencias.', 'Se prueban simulacros y planes de respuesta?', ['Plan de emergencia', 'Informe de simulacro']) ,
          clause('14001-9.1', 'Seguimiento y medicion ambiental', 'Monitoreo de desempeno ambiental.', 'Se mide consumo, emisiones, residuos y cumplimiento?', ['Monitoreos', 'Reportes ambientales']) ,
          clause('14001-9.2', 'Auditoria interna ambiental', 'Programa de auditorias del SGA.', 'Se ejecuta y cierra plan anual de auditoria?', ['Programa anual', 'Informe y acciones']) ,
          clause('14001-9.3', 'Revision por direccion', 'Direccion revisa desempeno ambiental y decide mejoras.', 'Se toman decisiones con responsables y fechas?', ['Actas de revision', 'Plan de mejora']) ,
          clause('14001-10.2', 'No conformidad y accion correctiva', 'Gestion de desviaciones y correccion de causas.', 'Se valida eficacia de acciones?', ['Registro de NC', 'Verificacion'])
        ])
      ]
    },
    {
      id: 'iso45001',
      code: 'ISO 45001',
      version: '2018',
      focus: 'Seguridad y salud en el trabajo',
      summary: 'Prevencion de lesiones y mejora del desempeno SST.',
      icon: 'fa-solid fa-helmet-safety',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('45001-main', '4-10 Requisitos SST clave', 'fa-solid fa-heart-pulse', [
          clause('45001-4.1', 'Contexto SST', 'Factores internos/externos que afectan el sistema SST.', 'El contexto SST contempla riesgos de la operacion real?', ['Analisis de contexto', 'Matriz de riesgo']) ,
          clause('45001-5.1', 'Liderazgo SST', 'Compromiso de direccion con seguridad y salud.', 'Direccion demuestra liderazgo visible en SST?', ['Recorridos de seguridad', 'Actas']) ,
          clause('45001-5.4', 'Consulta y participacion', 'Participacion de trabajadores en decisiones SST.', 'Se consulta al personal y se documentan acuerdos?', ['Comite SST', 'Minutas']) ,
          clause('45001-6.1.2', 'Identificacion de peligros', 'Identificacion de peligros por actividad y puesto.', 'Se evalua riesgo para tareas rutinarias y no rutinarias?', ['IPERC', 'ATS']) ,
          clause('45001-6.1.3', 'Requisitos legales SST', 'Control de requisitos legales aplicables SST.', 'Existe evidencia de cumplimiento legal?', ['Matriz legal', 'Inspecciones']) ,
          clause('45001-6.2', 'Objetivos SST', 'Objetivos de SST medibles y con plan.', 'Los objetivos tienen seguimiento periodico?', ['KPIs SST', 'Reportes']) ,
          clause('45001-7.2', 'Competencia SST', 'Personal competente para tareas seguras.', 'Se evalua aptitud y entrenamiento antes de tareas criticas?', ['Matriz de capacitacion', 'Licencias']) ,
          clause('45001-8.1', 'Control operacional SST', 'Controles para eliminar peligros y reducir riesgos.', 'Hay procedimientos y permisos de trabajo seguros?', ['PTW', 'Checklists de seguridad']) ,
          clause('45001-8.2', 'Emergencias SST', 'Preparacion y respuesta a emergencias de seguridad.', 'Se realizan simulacros y mejora del plan?', ['Simulacros', 'Plan de emergencia']) ,
          clause('45001-9.1', 'Seguimiento del desempeno SST', 'Monitoreo de indicadores de seguridad y salud.', 'Se analizan incidentes, frecuencia y severidad?', ['Indicadores SST', 'Tablero']) ,
          clause('45001-9.2', 'Auditoria interna SST', 'Auditoria periodica del sistema SST.', 'Se cierran hallazgos con evidencia?', ['Informe de auditoria', 'Cierre de acciones']) ,
          clause('45001-10.2', 'Incidentes y acciones correctivas', 'Investigacion de incidentes y acciones eficaces.', 'Se valida causa raiz y no recurrencia?', ['Investigaciones', 'Verificacion'])
        ])
      ]
    },
    {
      id: 'iso22000',
      code: 'ISO 22000',
      version: '2018',
      focus: 'Sistema de gestion de inocuidad alimentaria',
      summary: 'Control de peligros de inocuidad en la cadena alimentaria.',
      icon: 'fa-solid fa-utensils',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('22000-main', '4-10 Requisitos inocuidad clave', 'fa-solid fa-bacteria', [
          clause('22000-4.1', 'Contexto de inocuidad', 'Contexto y alcance del sistema de inocuidad.', 'El alcance cubre procesos y productos en riesgo?', ['Alcance FSMS', 'Mapa de proceso']) ,
          clause('22000-5.2', 'Politica de inocuidad', 'Politica aprobada y comunicada.', 'El personal conoce compromisos de inocuidad?', ['Politica firmada', 'Comunicacion interna']) ,
          clause('22000-6.1', 'Riesgos y oportunidades', 'Planificacion de riesgos y oportunidades del sistema.', 'Se tratan riesgos operativos y regulatorios?', ['Matriz de riesgos', 'Plan de accion']) ,
          clause('22000-7.2', 'PRP', 'Programas prerrequisito para higiene y control base.', 'PRP estan definidos por proceso y validados?', ['Programas PRP', 'Verificacion']) ,
          clause('22000-8.5', 'Analisis de peligros', 'Analisis de peligros biologicos, quimicos y fisicos.', 'Existe metodologia HACCP completa y vigente?', ['Analisis HACCP', 'Diagrama de flujo']) ,
          clause('22000-8.5.4', 'Plan de control de peligros', 'Control de PCC y OPRP con limites y monitoreo.', 'Se monitorean limites criticos y se corrigen desviaciones?', ['Registros PCC/OPRP', 'Acciones correctivas']) ,
          clause('22000-8.7', 'Control de seguimiento y medicion', 'Trazabilidad y gestion de no conformidades de inocuidad.', 'Existe trazabilidad hacia atras y adelante?', ['Pruebas de trazabilidad', 'Registros']) ,
          clause('22000-8.9', 'Control de no conformidades', 'Tratamiento de producto potencialmente inseguro.', 'Se bloquea, evalua y decide disposicion final?', ['Registro de producto no conforme', 'Liberacion']) ,
          clause('22000-9.1', 'Seguimiento y verificacion', 'Verificacion de eficacia del sistema.', 'Se verifican PRP, HACCP y limpieza?', ['Plan de verificacion', 'Resultados']) ,
          clause('22000-9.2', 'Auditoria interna', 'Auditoria interna del sistema de inocuidad.', 'Se audita por riesgo y se cierran hallazgos?', ['Programa de auditoria', 'Cierre']) ,
          clause('22000-9.3', 'Revision por direccion', 'Direccion revisa desempeno de inocuidad.', 'Se toman decisiones documentadas?', ['Actas', 'Plan directivo']) ,
          clause('22000-10.3', 'Mejora continua', 'Mejora permanente del sistema de inocuidad.', 'Se incorporan lecciones de incidentes y reclamos?', ['Backlog de mejora', 'Proyectos'])
        ])
      ]
    },
    {
      id: 'iso50001',
      code: 'ISO 50001',
      version: '2018',
      focus: 'Sistema de gestion de la energia',
      summary: 'Mejora de desempeno energetico, consumo y eficiencia.',
      icon: 'fa-solid fa-bolt',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('50001-main', '4-10 Requisitos energia clave', 'fa-solid fa-gauge-high', [
          clause('50001-4.1', 'Contexto energetico', 'Se determina contexto para gestion de energia.', 'El contexto incluye factores de consumo y costo energetico?', ['Analisis energetico inicial', 'Contexto']) ,
          clause('50001-5.1', 'Liderazgo energetico', 'Direccion impulsa desempeno energetico.', 'Se demuestra compromiso con objetivos energeticos?', ['Acta de liderazgo', 'Recursos asignados']) ,
          clause('50001-6.2', 'Objetivos energeticos', 'Objetivos medibles para mejora energetica.', 'Cada objetivo tiene plan de accion y metas claras?', ['Objetivos EnMS', 'KPI']) ,
          clause('50001-6.3', 'Revision energetica', 'Analisis de uso y consumo de energia.', 'Se identifican usos significativos (SEU)?', ['Revision energetica', 'Inventario SEU']) ,
          clause('50001-6.4', 'EnPI y linea base', 'Definicion de indicadores y linea base energetica.', 'Se revisan EnPI frente a cambios operativos?', ['EnPI', 'Linea base']) ,
          clause('50001-7.2', 'Competencia energetica', 'Capacitacion en gestion eficiente de energia.', 'El personal clave conoce practicas de eficiencia?', ['Capacitacion', 'Evaluaciones']) ,
          clause('50001-8.1', 'Control operacional energetico', 'Control de operaciones que impactan consumo.', 'Se aplican criterios operativos en SEU?', ['Instructivos operativos', 'Bitacora']) ,
          clause('50001-8.2', 'Diseno y adquisiciones', 'Compras y diseno consideran desempeno energetico.', 'Los criterios de compra incluyen eficiencia energetica?', ['Especificaciones de compra', 'Evaluaciones tecnicas']) ,
          clause('50001-9.1', 'Monitoreo y analisis', 'Monitoreo de consumo y desempeno energetico.', 'Se analizan desviaciones y acciones correctivas?', ['Dashboard energia', 'Analisis mensual']) ,
          clause('50001-9.2', 'Auditoria interna EnMS', 'Auditoria del sistema de energia.', 'El programa verifica procesos y resultados energeticos?', ['Programa de auditoria', 'Reportes']) ,
          clause('50001-9.3', 'Revision por direccion', 'Direccion revisa desempeno energetico y decide acciones.', 'Se formalizan decisiones de inversion y mejora?', ['Actas', 'Roadmap energetico']) ,
          clause('50001-10.1', 'Mejora continua', 'Mejora sostenida del desempeno energetico.', 'Se demuestra reduccion de consumo o mejora EnPI?', ['Historico de EnPI', 'Proyectos de mejora'])
        ])
      ]
    },
    {
      id: 'iso27701',
      code: 'ISO/IEC 27701',
      version: '2019',
      focus: 'Sistema de gestion de la informacion de privacidad',
      summary: 'Extension de ISO 27001 para proteccion de datos personales (PIMS).',
      icon: 'fa-solid fa-user-shield',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('27701-4-6', '4-6 Contexto, liderazgo y planificacion PIMS', 'fa-solid fa-user-lock', [
          clause('27701-4.1', 'Contexto PIMS', 'Se entiende el contexto de privacidad de la organizacion.', 'El contexto identifica roles de controlador y/o encargado?', ['Analisis de contexto', 'Mapa de tratamientos']) ,
          clause('27701-4.4', 'Alcance del PIMS', 'Se define alcance considerando el SGSI base.', 'El alcance especifica que datos y procesos cubre?', ['Documento de alcance', 'Inventario de datos']) ,
          clause('27701-5.2', 'Politica de privacidad', 'Politica de privacidad alineada a la de seguridad.', 'La politica cubre derechos de titulares y bases legales?', ['Politica de privacidad', 'Comunicacion interna']) ,
          clause('27701-6.1', 'Riesgos de privacidad', 'Evaluacion de riesgos de privacidad (PIA/DPIA).', 'Se ejecutan evaluaciones de impacto cuando aplica?', ['DPIA', 'Registro de riesgos de privacidad'])
        ]),
        section('27701-7-8', '7-8 Controles de controlador y encargado', 'fa-solid fa-address-card', [
          clause('27701-7.2', 'Condiciones de recoleccion', 'Base legal y consentimiento para tratar datos.', 'Se documenta base legal y consentimiento informado?', ['Registro de consentimientos', 'Avisos de privacidad']) ,
          clause('27701-7.3', 'Obligaciones con titulares', 'Derechos ARCO/portabilidad atendidos.', 'Existe procedimiento para atender solicitudes de titulares?', ['Procedimiento ARCO', 'Bitacora de solicitudes']) ,
          clause('27701-7.4', 'Privacidad por diseno', 'Minimizacion y proteccion desde el diseno.', 'Los nuevos proyectos incluyen privacidad por diseno?', ['Checklist privacy by design', 'Revisiones de proyecto']) ,
          clause('27701-8.2', 'Transferencias de datos', 'Control de transferencias a terceros/paises.', 'Las transferencias tienen contrato o mecanismo valido?', ['Contratos de encargo', 'Clausulas de transferencia']) ,
          clause('27701-8.5', 'Gestion de incidentes de privacidad', 'Deteccion y notificacion de brechas de datos.', 'Existe protocolo de notificacion de brechas y plazos?', ['Plan de respuesta a brechas', 'Registro de incidentes'])
        ]),
        section('27701-9-10', '9-10 Evaluacion y mejora PIMS', 'fa-solid fa-magnifying-glass-chart', [
          clause('27701-9.2', 'Auditoria interna PIMS', 'Auditoria periodica del sistema de privacidad.', 'Se auditan tratamientos de alto riesgo?', ['Programa de auditoria', 'Hallazgos y cierre']) ,
          clause('27701-9.3', 'Revision por direccion', 'Direccion revisa desempeno de privacidad.', 'Se deciden acciones sobre riesgos residuales?', ['Acta de revision', 'Plan de accion']) ,
          clause('27701-10.1', 'Mejora continua PIMS', 'Mejora del sistema de privacidad.', 'Se incorporan lecciones de incidentes y auditorias?', ['Backlog de mejora', 'Seguimiento'])
        ])
      ]
    },
    {
      id: 'iso20000',
      code: 'ISO/IEC 20000-1',
      version: '2018',
      focus: 'Sistema de gestion de servicios de TI',
      summary: 'Diseno, transicion, entrega y mejora de servicios de TI (SMS).',
      icon: 'fa-solid fa-server',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('20000-4-6', '4-6 Contexto, liderazgo y planificacion SMS', 'fa-solid fa-sitemap', [
          clause('20000-4.1', 'Contexto del SMS', 'Factores internos/externos que afectan el servicio.', 'El contexto identifica clientes, partes interesadas y riesgos del servicio?', ['Analisis de contexto', 'Catalogo de servicios']) ,
          clause('20000-5.1', 'Liderazgo y compromiso', 'Direccion respalda el SMS y la orientacion al cliente.', 'Direccion asigna recursos y revisa el desempeno del servicio?', ['Actas directivas', 'Plan de recursos']) ,
          clause('20000-6.1', 'Acciones frente a riesgos', 'Riesgos y oportunidades del servicio gestionados.', 'Existe matriz de riesgos de servicio actualizada?', ['Matriz de riesgos de TI', 'Plan de tratamiento']) ,
          clause('20000-6.2', 'Objetivos del servicio', 'Objetivos de calidad de servicio medibles (SLA).', 'Los SLA se monitorean y reportan periodicamente?', ['SLA vigentes', 'Reportes de cumplimiento'])
        ]),
        section('20000-8', '8. Operacion del servicio', 'fa-solid fa-headset', [
          clause('20000-8.2', 'Catalogo y gestion de la demanda', 'Catalogo de servicios definido y capacidad planificada.', 'El catalogo esta vigente y se planifica capacidad?', ['Catalogo de servicios', 'Plan de capacidad']) ,
          clause('20000-8.3', 'Gestion de configuracion', 'Activos y configuraciones de TI controlados (CMDB).', 'La CMDB refleja el estado real de la infraestructura?', ['CMDB', 'Auditorias de configuracion']) ,
          clause('20000-8.5', 'Gestion de incidentes y peticiones', 'Incidentes resueltos dentro de tiempos acordados.', 'Se cumplen los tiempos de resolucion segun SLA?', ['Sistema de tickets', 'Reportes de incidentes']) ,
          clause('20000-8.6', 'Gestion de problemas', 'Causa raiz de incidentes recurrentes investigada.', 'Existe registro y cierre de problemas con causa raiz?', ['Registro de problemas', 'Analisis de causa raiz']) ,
          clause('20000-8.7', 'Gestion de cambios', 'Cambios al servicio evaluados y autorizados.', 'Los cambios pasan por comite/aprobacion formal?', ['CAB / bitacora de cambios', 'Plan de rollback']) ,
          clause('20000-8.9', 'Continuidad y disponibilidad', 'Planes de continuidad y disponibilidad del servicio.', 'Se prueban planes de continuidad de TI periodicamente?', ['Plan de continuidad de TI', 'Pruebas de disponibilidad'])
        ]),
        section('20000-9-10', '9-10 Evaluacion y mejora del servicio', 'fa-solid fa-chart-line', [
          clause('20000-9.1', 'Monitoreo y medicion', 'Desempeno del servicio medido contra SLA.', 'Se reportan tendencias de disponibilidad y satisfaccion?', ['Dashboard de servicio', 'Encuestas de satisfaccion']) ,
          clause('20000-9.2', 'Auditoria interna SMS', 'Auditoria periodica del sistema de gestion de servicios.', 'Se cierran hallazgos de auditoria a tiempo?', ['Programa de auditoria', 'Plan de accion']) ,
          clause('20000-10.1', 'Mejora continua del servicio', 'Mejora continua (CSI) del servicio de TI.', 'Existe registro formal de iniciativas de mejora?', ['Registro CSI', 'Proyectos de mejora'])
        ])
      ]
    },
    {
      id: 'iso22301',
      code: 'ISO 22301',
      version: '2019',
      focus: 'Sistema de gestion de continuidad de negocio',
      summary: 'Preparacion, respuesta y recuperacion ante interrupciones.',
      icon: 'fa-solid fa-tower-broadcast',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('22301-4-6', '4-6 Contexto, liderazgo y planificacion BCMS', 'fa-solid fa-building-shield', [
          clause('22301-4.1', 'Contexto de continuidad', 'Factores que afectan la continuidad del negocio.', 'El contexto identifica procesos criticos y dependencias?', ['Analisis de contexto', 'Mapa de procesos criticos']) ,
          clause('22301-4.2', 'Partes interesadas', 'Requisitos legales y de clientes sobre continuidad.', 'Se documentan requisitos contractuales de continuidad?', ['Matriz de requisitos', 'Contratos con clausulas de continuidad']) ,
          clause('22301-5.1', 'Liderazgo y compromiso', 'Direccion lidera el BCMS y asigna recursos.', 'Direccion participa en ejercicios y revision del BCMS?', ['Actas de direccion', 'Presupuesto de continuidad']) ,
          clause('22301-6.1', 'Riesgos y objetivos de continuidad', 'Objetivos de continuidad medibles y con plazos.', 'Cada objetivo tiene RTO/RPO definido?', ['Objetivos de continuidad', 'RTO/RPO por proceso'])
        ]),
        section('22301-8', '8. Operacion: BIA, estrategias y planes', 'fa-solid fa-triangle-exclamation', [
          clause('22301-8.2', 'Analisis de impacto (BIA)', 'BIA identifica procesos criticos, RTO y recursos minimos.', 'El BIA esta vigente y cubre todos los procesos criticos?', ['BIA actualizado', 'Matriz de impacto']) ,
          clause('22301-8.3', 'Estrategias de continuidad', 'Estrategias de recuperacion seleccionadas y justificadas.', 'Las estrategias cubren personas, instalaciones y TI?', ['Documento de estrategia', 'Analisis costo-beneficio']) ,
          clause('22301-8.4', 'Planes de continuidad', 'Planes de respuesta a incidentes y recuperacion documentados.', 'Los planes tienen roles, contactos y procedimientos claros?', ['Plan de continuidad (BCP)', 'Arbol de llamadas']) ,
          clause('22301-8.5', 'Ejercicios y pruebas', 'Programa de pruebas y simulacros del BCP.', 'Se ejecutan simulacros periodicos con resultados documentados?', ['Programa de ejercicios', 'Informes de simulacro'])
        ]),
        section('22301-9-10', '9-10 Evaluacion y mejora BCMS', 'fa-solid fa-magnifying-glass-chart', [
          clause('22301-9.1', 'Monitoreo y medicion', 'Desempeno del BCMS medido con indicadores.', 'Existen KPI de continuidad (tiempos de respuesta, cobertura)?', ['Indicadores BCMS', 'Reportes periodicos']) ,
          clause('22301-9.2', 'Auditoria interna BCMS', 'Auditoria del sistema de continuidad.', 'Se auditan procesos criticos y planes vigentes?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('22301-9.3', 'Revision por direccion', 'Direccion revisa el BCMS y decide mejoras.', 'La revision cubre resultados de ejercicios y cambios de riesgo?', ['Acta de revision', 'Plan de mejora']) ,
          clause('22301-10.1', 'No conformidad y mejora', 'Correccion de fallas detectadas en ejercicios/incidentes.', 'Se corrigen brechas detectadas en simulacros reales?', ['Registro de no conformidad', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso13485',
      code: 'ISO 13485',
      version: '2016',
      focus: 'Sistema de gestion de calidad para dispositivos medicos',
      summary: 'Regulatorio y de calidad para el ciclo de vida de dispositivos medicos.',
      icon: 'fa-solid fa-kit-medical',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('13485-4-6', '4-6 SGC, direccion y recursos', 'fa-solid fa-briefcase-medical', [
          clause('13485-4.1', 'Requisitos generales del SGC', 'SGC documentado conforme a requisitos regulatorios.', 'El SGC identifica requisitos regulatorios aplicables por mercado?', ['Matriz regulatoria', 'Manual de calidad']) ,
          clause('13485-4.2', 'Documentacion y expediente', 'Control documental y expediente de dispositivo medico.', 'Existe expediente tecnico/DMR por producto?', ['Device Master Record', 'Lista maestra de documentos']) ,
          clause('13485-5.1', 'Compromiso de la direccion', 'Direccion respalda cumplimiento regulatorio y calidad.', 'Direccion revisa cumplimiento regulatorio periodicamente?', ['Actas de revision', 'Plan regulatorio']) ,
          clause('13485-6.2', 'Recursos humanos', 'Competencia del personal que afecta la calidad del producto.', 'Se capacita y evalua competencia critica para calidad?', ['Matriz de competencias', 'Registros de capacitacion'])
        ]),
        section('13485-7', '7. Realizacion del producto', 'fa-solid fa-syringe', [
          clause('13485-7.1', 'Planificacion de la realizacion', 'Planificacion de procesos de manufactura y control.', 'Existen planes de calidad por linea/producto?', ['Plan de calidad', 'Especificaciones de producto']) ,
          clause('13485-7.3', 'Diseno y desarrollo', 'Control de diseno con verificacion y validacion clinica si aplica.', 'El diseno tiene revisiones, V&V y control de cambios documentados?', ['Expediente de diseno', 'Reportes de V&V']) ,
          clause('13485-7.4', 'Compras', 'Proveedores criticos evaluados y controlados.', 'Se evaluan proveedores segun riesgo del producto?', ['Evaluacion de proveedores', 'Acuerdos de calidad']) ,
          clause('13485-7.5', 'Produccion y prestacion del servicio', 'Trazabilidad y condiciones controladas de produccion.', 'Existe trazabilidad completa por lote/dispositivo?', ['Registros de lote (DHR)', 'Trazabilidad UDI']) ,
          clause('13485-7.6', 'Control de equipos de medicion', 'Calibracion de equipos de medicion y monitoreo.', 'Los equipos criticos tienen calibracion vigente?', ['Programa de calibracion', 'Certificados de calibracion'])
        ]),
        section('13485-8', '8. Medicion, analisis y mejora', 'fa-solid fa-notes-medical', [
          clause('13485-8.2', 'Vigilancia postmercado', 'Retroalimentacion y quejas de producto en mercado.', 'Existe sistema de vigilancia postmercado y quejas?', ['Sistema de quejas', 'Reportes de vigilancia']) ,
          clause('13485-8.3', 'Control de producto no conforme', 'Producto no conforme identificado y controlado.', 'Se documenta disposicion de producto no conforme?', ['Registro de no conformes', 'Decisiones de disposicion']) ,
          clause('13485-8.5', 'Accion correctiva y preventiva (CAPA)', 'Sistema CAPA para causa raiz y prevencion.', 'El CAPA valida eficacia de acciones implementadas?', ['Registros CAPA', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso55001',
      code: 'ISO 55001',
      version: '2014',
      focus: 'Sistema de gestion de activos',
      summary: 'Gestion optima del ciclo de vida de activos fisicos e infraestructura.',
      icon: 'fa-solid fa-industry',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('55001-main', '4-10 Requisitos clave de gestion de activos', 'fa-solid fa-warehouse', [
          clause('55001-4.1', 'Contexto de gestion de activos', 'Factores que afectan la gestion de activos.', 'El contexto vincula activos con objetivos organizacionales?', ['Analisis de contexto', 'Politica de activos']) ,
          clause('55001-4.3', 'Alcance del SAM', 'Alcance del sistema de gestion de activos definido.', 'El alcance identifica portafolio de activos cubierto?', ['Documento de alcance', 'Inventario de activos']) ,
          clause('55001-5.2', 'Politica de gestion de activos', 'Politica alineada al plan estrategico de activos (SAMP).', 'Existe SAMP aprobado y vigente?', ['SAMP', 'Politica de activos']) ,
          clause('55001-6.2', 'Objetivos de gestion de activos', 'Objetivos medibles alineados al SAMP.', 'Los objetivos de activos tienen plan e indicadores?', ['Objetivos SAM', 'KPI de activos']) ,
          clause('55001-7.2', 'Competencia', 'Personal competente para gestion del ciclo de vida.', 'Se capacita en mantenimiento, confiabilidad y riesgo de activos?', ['Plan de capacitacion', 'Evaluaciones de competencia']) ,
          clause('55001-8.1', 'Planificacion y control operacional', 'Planes de mantenimiento y control de activos criticos.', 'Existen planes de mantenimiento preventivo/predictivo?', ['Plan de mantenimiento', 'Ordenes de trabajo']) ,
          clause('55001-8.2', 'Gestion del cambio', 'Cambios que afectan activos evaluados por riesgo.', 'Los cambios a activos criticos se evaluan antes de ejecutarse?', ['Gestion del cambio (MOC)', 'Analisis de riesgo']) ,
          clause('55001-9.1', 'Evaluacion del desempeno de activos', 'Desempeno, condicion y confiabilidad monitoreados.', 'Se mide disponibilidad, confiabilidad y costo del ciclo de vida?', ['Indicadores de confiabilidad', 'Reportes de condicion']) ,
          clause('55001-9.2', 'Auditoria interna SAM', 'Auditoria del sistema de gestion de activos.', 'Se auditan procesos criticos de mantenimiento y activos?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('55001-9.3', 'Revision por direccion', 'Direccion revisa desempeno de activos y SAMP.', 'La revision decide inversiones y prioridades de activos?', ['Acta de revision', 'Plan de inversion']) ,
          clause('55001-10.2', 'No conformidad y mejora', 'Fallas de activos investigadas y corregidas.', 'Se investiga causa raiz de fallas criticas de activos?', ['RCA de fallas', 'Plan de mejora'])
        ])
      ]
    },
    {
      id: 'iso37301',
      code: 'ISO 37301',
      version: '2021',
      focus: 'Sistema de gestion de compliance',
      summary: 'Cumplimiento normativo integral, mas alla del antisoborno.',
      icon: 'fa-solid fa-clipboard-check',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('37301-4-6', '4-6 Contexto, liderazgo y planificacion', 'fa-solid fa-landmark', [
          clause('37301-4.1', 'Contexto de compliance', 'Factores y obligaciones de cumplimiento identificados.', 'Se mantiene un mapa vigente de obligaciones de cumplimiento?', ['Mapa de obligaciones', 'Analisis de contexto']) ,
          clause('37301-4.6', 'Evaluacion de riesgos de compliance', 'Riesgos de incumplimiento evaluados por area/proceso.', 'La metodologia cubre riesgo regulatorio, contractual y etico?', ['Matriz de riesgo de compliance', 'Mapa de riesgos por area']) ,
          clause('37301-5.1', 'Liderazgo y cultura de cumplimiento', 'Direccion promueve cultura de cumplimiento (tone at the top).', 'Direccion comunica activamente la importancia del cumplimiento?', ['Mensajes de liderazgo', 'Actas de comite de compliance']) ,
          clause('37301-5.3', 'Funcion de compliance', 'Funcion de compliance independiente y con autoridad.', 'La funcion tiene acceso directo al organo de gobierno?', ['Nombramiento del oficial de compliance', 'Reportes al consejo']) ,
          clause('37301-6.2', 'Objetivos de compliance', 'Objetivos medibles de cumplimiento normativo.', 'Los objetivos de compliance se revisan periodicamente?', ['Objetivos de compliance', 'Tablero de seguimiento'])
        ]),
        section('37301-7-8', '7-8 Soporte y operacion', 'fa-solid fa-user-check', [
          clause('37301-7.2', 'Competencia', 'Formacion en cumplimiento por rol y riesgo.', 'Existe plan de capacitacion de compliance diferenciado por riesgo?', ['Plan de capacitacion', 'Registros de asistencia']) ,
          clause('37301-7.3', 'Sensibilizacion', 'Cultura de cumplimiento comunicada a toda la organizacion.', 'El personal conoce el codigo de conducta y como reportar?', ['Codigo de conducta', 'Campanas de comunicacion']) ,
          clause('37301-8.2', 'Controles y procedimientos', 'Controles de cumplimiento implementados por riesgo.', 'Los controles clave estan documentados y operando?', ['Matriz de controles', 'Evidencia de operacion']) ,
          clause('37301-8.3', 'Canal de denuncias', 'Canal confidencial para reportar incumplimientos.', 'El canal protege confidencialidad y prohibe represalias?', ['Canal de denuncias', 'Politica de no represalia']) ,
          clause('37301-8.4', 'Investigacion de incumplimientos', 'Casos investigados con debido proceso.', 'Las investigaciones documentan hallazgos y acciones disciplinarias?', ['Expedientes de investigacion', 'Registro de sanciones'])
        ]),
        section('37301-9-10', '9-10 Evaluacion y mejora', 'fa-solid fa-scale-balanced', [
          clause('37301-9.1', 'Seguimiento y medicion', 'Indicadores de eficacia del sistema de compliance.', 'Se miden incidentes, tiempos de resolucion y capacitacion completada?', ['Dashboard de compliance', 'Reportes periodicos']) ,
          clause('37301-9.2', 'Auditoria interna de compliance', 'Auditoria del sistema de gestion de compliance.', 'Se auditan areas de mayor riesgo de incumplimiento?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('37301-9.3', 'Revision por el organo de gobierno', 'Alta direccion y consejo revisan el desempeno de compliance.', 'El consejo recibe reporte formal de compliance?', ['Acta de consejo', 'Informe anual de compliance']) ,
          clause('37301-10.1', 'No conformidad y accion correctiva', 'Incumplimientos corregidos con causa raiz.', 'Se verifica la eficacia de las acciones correctivas?', ['Registro de no conformidad', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso21001',
      code: 'ISO 21001',
      version: '2018',
      focus: 'Sistema de gestion para organizaciones educativas',
      summary: 'Gestion educativa centrada en el aprendiz y sus resultados.',
      icon: 'fa-solid fa-graduation-cap',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('21001-main', '4-10 Requisitos clave EOMS', 'fa-solid fa-chalkboard-user', [
          clause('21001-4.1', 'Contexto de la organizacion educativa', 'Factores que afectan el servicio educativo.', 'El contexto considera necesidades de aprendices y sociedad?', ['Analisis de contexto', 'Estudio de necesidades educativas']) ,
          clause('21001-4.2', 'Partes interesadas educativas', 'Necesidades de aprendices, familias y empleadores.', 'Se identifican requisitos de todos los grupos de interes?', ['Matriz de partes interesadas', 'Encuestas a familias/empleadores']) ,
          clause('21001-5.1', 'Liderazgo centrado en el aprendiz', 'Direccion promueve enfoque en el aprendiz y etica.', 'La direccion demuestra compromiso con inclusion y equidad?', ['Politica de inclusion', 'Actas directivas']) ,
          clause('21001-6.2', 'Objetivos educativos', 'Objetivos de aprendizaje medibles y con seguimiento.', 'Los objetivos educativos tienen indicadores de logro?', ['Objetivos EOMS', 'Indicadores de aprendizaje']) ,
          clause('21001-7.2', 'Competencia docente', 'Personal docente competente y en desarrollo continuo.', 'Se evalua y desarrolla la competencia del personal docente?', ['Plan de desarrollo docente', 'Evaluaciones docentes']) ,
          clause('21001-8.1', 'Diseno curricular y prestacion', 'Diseno, entrega y evaluacion del servicio educativo.', 'El curriculo se revisa segun resultados de aprendizaje?', ['Plan curricular', 'Resultados de evaluacion']) ,
          clause('21001-8.2', 'Admision y apoyo al aprendiz', 'Procesos de admision y apoyo transparentes.', 'Existen criterios claros de admision y apoyo academico?', ['Politica de admision', 'Programas de apoyo']) ,
          clause('21001-9.1', 'Seguimiento de resultados', 'Resultados de aprendizaje y satisfaccion medidos.', 'Se analizan tasas de desercion, logro y satisfaccion?', ['Indicadores educativos', 'Encuestas de satisfaccion']) ,
          clause('21001-9.2', 'Auditoria interna EOMS', 'Auditoria del sistema de gestion educativa.', 'Se auditan procesos academicos y administrativos clave?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('21001-9.3', 'Revision por direccion', 'Direccion revisa desempeno educativo y decide mejoras.', 'La revision incluye retroalimentacion de aprendices y docentes?', ['Acta de revision', 'Plan de mejora educativa']) ,
          clause('21001-10.2', 'No conformidad y mejora', 'Desviaciones del servicio educativo corregidas.', 'Se da seguimiento a quejas academicas hasta su cierre?', ['Registro de quejas', 'Acciones correctivas'])
        ])
      ]
    },
    {
      id: 'iso44001',
      code: 'ISO 44001',
      version: '2017',
      focus: 'Gestion de relaciones de negocio colaborativas',
      summary: 'Marco para alianzas y relaciones colaborativas de alto valor.',
      icon: 'fa-solid fa-handshake',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('44001-main', '4-10 Requisitos clave de colaboracion', 'fa-solid fa-people-arrows', [
          clause('44001-4.1', 'Contexto de la relacion colaborativa', 'Factores que afectan alianzas de negocio.', 'Se identifican relaciones estrategicas clave a gestionar?', ['Mapa de relaciones estrategicas', 'Analisis de contexto']) ,
          clause('44001-5.1', 'Liderazgo y compromiso colaborativo', 'Direccion respalda la estrategia de colaboracion.', 'Existe patrocinio directivo para alianzas estrategicas?', ['Actas de patrocinio', 'Estrategia de colaboracion']) ,
          clause('44001-6.1', 'Conciencia de valor y riesgo', 'Riesgos y valor esperado de la relacion evaluados.', 'Se evalua el valor conjunto y riesgo antes de formalizar la alianza?', ['Caso de negocio conjunto', 'Analisis de riesgo de la relacion']) ,
          clause('44001-7.2', 'Competencia relacional', 'Personal con habilidades de gestion de relaciones.', 'Se capacita en gestion de conflictos y colaboracion?', ['Plan de capacitacion', 'Evaluacion de competencias']) ,
          clause('44001-8.2', 'Seleccion de socios', 'Socios evaluados y seleccionados con criterios claros.', 'Existen criterios documentados de seleccion de socios?', ['Criterios de seleccion', 'Evaluacion de candidatos']) ,
          clause('44001-8.4', 'Gobernanza de la relacion', 'Acuerdo de colaboracion y gobernanza conjunta definidos.', 'Existe acuerdo formal con roles, gobierno y metricas conjuntas?', ['Acuerdo de colaboracion', 'Comite conjunto de gobernanza']) ,
          clause('44001-8.7', 'Creacion de valor conjunto', 'Valor y beneficios compartidos monitoreados.', 'Se miden beneficios conjuntos frente al caso de negocio?', ['Indicadores de valor conjunto', 'Reportes de la alianza']) ,
          clause('44001-8.8', 'Salida o terminacion', 'Estrategia de salida planificada desde el inicio.', 'Existe plan de salida/terminacion de la relacion?', ['Plan de salida', 'Clausulas de terminacion']) ,
          clause('44001-9.1', 'Monitoreo de la relacion', 'Desempeno de la relacion medido periodicamente.', 'Se revisan indicadores de la relacion con el socio?', ['Tablero de la relacion', 'Reportes periodicos']) ,
          clause('44001-9.3', 'Revision por direccion', 'Direccion revisa cartera de relaciones estrategicas.', 'La revision decide continuar, ajustar o terminar relaciones?', ['Acta de revision', 'Plan de accion']) ,
          clause('44001-10.1', 'Mejora continua de la relacion', 'Lecciones aprendidas aplicadas a futuras alianzas.', 'Se documentan lecciones aprendidas de cada relacion?', ['Registro de lecciones aprendidas', 'Plan de mejora'])
        ])
      ]
    },
    {
      id: 'iso28000',
      code: 'ISO 28000',
      version: '2022',
      focus: 'Sistema de gestion de seguridad en la cadena de suministro',
      summary: 'Seguridad, resiliencia y proteccion de la cadena de suministro.',
      icon: 'fa-solid fa-truck-fast',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('28000-main', '4-10 Requisitos clave de seguridad SCM', 'fa-solid fa-boxes-packing', [
          clause('28000-4.1', 'Contexto de seguridad de la cadena', 'Amenazas y vulnerabilidades de la cadena de suministro.', 'Se identifican amenazas relevantes (robo, fraude, terrorismo)?', ['Analisis de amenazas', 'Mapa de la cadena de suministro']) ,
          clause('28000-4.3', 'Alcance del SGS', 'Alcance del sistema de seguridad definido.', 'El alcance cubre nodos criticos (transporte, almacenes, proveedores)?', ['Documento de alcance', 'Mapa de nodos criticos']) ,
          clause('28000-5.1', 'Liderazgo en seguridad', 'Direccion respalda la seguridad de la cadena de suministro.', 'Direccion asigna recursos para seguridad logistica?', ['Actas directivas', 'Presupuesto de seguridad']) ,
          clause('28000-6.1', 'Evaluacion de riesgos de seguridad', 'Riesgos de seguridad de la cadena evaluados y tratados.', 'La evaluacion cubre proveedores, transporte y almacenamiento?', ['Matriz de riesgos de seguridad', 'Plan de tratamiento']) ,
          clause('28000-7.2', 'Competencia en seguridad', 'Personal capacitado en procedimientos de seguridad.', 'Se capacita a personal logistico en seguridad y deteccion de anomalias?', ['Plan de capacitacion', 'Evaluaciones']) ,
          clause('28000-8.1', 'Control operacional de seguridad', 'Controles fisicos y de proceso en la cadena.', 'Existen controles de acceso, sellos y verificacion de carga?', ['Procedimientos de seguridad', 'Registros de sellado/verificacion']) ,
          clause('28000-8.4', 'Gestion de incidentes de seguridad', 'Incidentes de seguridad detectados y gestionados.', 'Existe protocolo de respuesta a robo, contrabando o intrusion?', ['Plan de respuesta a incidentes', 'Bitacora de incidentes']) ,
          clause('28000-8.5', 'Continuidad de la cadena', 'Planes de continuidad ante interrupciones de suministro.', 'Existen planes ante interrupcion de proveedores criticos?', ['Plan de continuidad de suministro', 'Proveedores alternos']) ,
          clause('28000-9.1', 'Monitoreo y medicion', 'Indicadores de seguridad de la cadena monitoreados.', 'Se miden incidentes de seguridad y tiempos de respuesta?', ['Indicadores de seguridad', 'Reportes periodicos']) ,
          clause('28000-9.2', 'Auditoria interna SGS', 'Auditoria del sistema de seguridad de la cadena.', 'Se auditan proveedores y nodos criticos?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('28000-10.2', 'No conformidad y mejora', 'Brechas de seguridad corregidas con causa raiz.', 'Se investigan y corrigen brechas de seguridad detectadas?', ['Registro de no conformidad', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso39001',
      code: 'ISO 39001',
      version: '2012',
      focus: 'Sistema de gestion de seguridad vial',
      summary: 'Reduccion de muertes y lesiones graves por siniestros viales.',
      icon: 'fa-solid fa-car-burst',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('39001-main', '4-10 Requisitos clave RTS', 'fa-solid fa-road',[
          clause('39001-4.1', 'Contexto de seguridad vial', 'Factores de riesgo vial de la organizacion.', 'Se identifican rutas, vehiculos y conductores de mayor riesgo?', ['Analisis de contexto vial', 'Mapa de rutas criticas']) ,
          clause('39001-4.4', 'Alcance del RTS', 'Alcance del sistema de seguridad vial definido.', 'El alcance cubre flota propia y de terceros/contratistas?', ['Documento de alcance', 'Inventario de flota']) ,
          clause('39001-5.1', 'Liderazgo en seguridad vial', 'Direccion promueve cultura de conduccion segura.', 'Direccion participa en campañas y revision de siniestros?', ['Actas directivas', 'Politica de seguridad vial']) ,
          clause('39001-6.2', 'Objetivos y factores de desempeno vial', 'Objetivos medibles sobre los factores de resultado de seguridad vial.', 'Los objetivos cubren velocidad, fatiga, cinturon y alcohol/drogas?', ['Objetivos RTS', 'Indicadores por factor de riesgo']) ,
          clause('39001-7.2', 'Competencia de conductores', 'Conductores evaluados, capacitados y aptos.', 'Se evalua aptitud y se capacita a conductores periodicamente?', ['Licencias y evaluaciones', 'Plan de capacitacion vial']) ,
          clause('39001-8.1', 'Control operacional de flota', 'Vehiculos mantenidos y rutas planificadas de forma segura.', 'Existe mantenimiento preventivo y planificacion segura de rutas?', ['Programa de mantenimiento', 'Planificacion de rutas']) ,
          clause('39001-8.2', 'Preparacion ante emergencias viales', 'Respuesta ante siniestros y emergencias en ruta.', 'Existe protocolo de respuesta ante siniestros con lesionados?', ['Protocolo de emergencia vial', 'Kit de respuesta en vehiculos']) ,
          clause('39001-9.1', 'Seguimiento del desempeno vial', 'Indicadores de siniestralidad monitoreados.', 'Se analizan tasas de siniestralidad, casi-incidentes y causas?', ['Indicadores de siniestralidad', 'Reportes de casi-incidentes']) ,
          clause('39001-9.2', 'Auditoria interna RTS', 'Auditoria del sistema de seguridad vial.', 'Se auditan conductores, flota y rutas de mayor riesgo?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('39001-9.3', 'Revision por direccion', 'Direccion revisa desempeno vial y decide acciones.', 'La revision define inversiones en seguridad vial?', ['Acta de revision', 'Plan de accion']) ,
          clause('39001-10.2', 'Investigacion de siniestros', 'Siniestros investigados con causa raiz y accion correctiva.', 'Se investiga causa raiz de cada siniestro con lesion?', ['Investigacion de siniestros', 'Acciones correctivas'])
        ])
      ]
    }
  ];

  window.ISO_LIBRARY = ISO_LIBRARY;
})();
