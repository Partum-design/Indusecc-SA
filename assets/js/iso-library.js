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
    }
  ];

  window.ISO_LIBRARY = ISO_LIBRARY;
})();
