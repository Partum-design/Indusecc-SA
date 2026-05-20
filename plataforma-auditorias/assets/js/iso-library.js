const ISO_LIBRARY = [
  {
    id: 'iso9001',
    code: 'ISO 9001',
    version: '2015 (rev. 2026 en proceso)',
    focus: 'Calidad y mejora continua',
    summary: 'Sistema de gestion de calidad orientado a procesos, cliente y mejora continua.',
    updatedNote: 'Estado de referencia al 20 de mayo de 2026.',
    sections: [
      {
        id: '9001-4-5',
        title: 'Contexto y Liderazgo',
        clauses: [
          {
            id: '9001-4.1',
            title: 'Comprension del contexto',
            question: 'La organizacion mantiene analisis vigente de factores internos y externos que afectan el SGC?'
          },
          {
            id: '9001-4.2',
            title: 'Partes interesadas',
            question: 'Se identifican partes interesadas y requisitos aplicables con evidencia documentada?'
          },
          {
            id: '9001-5.1',
            title: 'Liderazgo y compromiso',
            question: 'La direccion demuestra liderazgo del SGC con seguimiento de objetivos y recursos?'
          },
          {
            id: '9001-5.3',
            title: 'Roles y responsabilidades',
            question: 'Los roles criticos del SGC estan definidos, comunicados y entendidos por el personal?'
          }
        ]
      },
      {
        id: '9001-6-7',
        title: 'Planificacion y Apoyo',
        clauses: [
          {
            id: '9001-6.1',
            title: 'Riesgos y oportunidades',
            question: 'Existe metodologia para evaluar riesgos y oportunidades, con acciones trazables?'
          },
          {
            id: '9001-6.2',
            title: 'Objetivos de calidad',
            question: 'Los objetivos son medibles, tienen responsables, fechas y seguimiento de resultados?'
          },
          {
            id: '9001-7.2',
            title: 'Competencia',
            question: 'Se demuestra competencia del personal con perfiles, formacion y evaluaciones?'
          },
          {
            id: '9001-7.5',
            title: 'Informacion documentada',
            question: 'La informacion documentada se controla con versionado, acceso y retencion definidos?'
          }
        ]
      },
      {
        id: '9001-8-10',
        title: 'Operacion, Evaluacion y Mejora',
        clauses: [
          {
            id: '9001-8.1',
            title: 'Control operacional',
            question: 'Los procesos operativos se ejecutan bajo criterios definidos y controlados?'
          },
          {
            id: '9001-8.7',
            title: 'Salidas no conformes',
            question: 'Se identifican, segregan y tratan no conformidades con registros claros?'
          },
          {
            id: '9001-9.2',
            title: 'Auditoria interna',
            question: 'Hay programa de auditoria interna basado en riesgo con cierre de hallazgos?'
          },
          {
            id: '9001-10.2',
            title: 'Accion correctiva',
            question: 'Se analizan causas raiz y se verifica efectividad de acciones correctivas?'
          }
        ]
      }
    ]
  },
  {
    id: 'iso27001',
    code: 'ISO/IEC 27001',
    version: '2022',
    focus: 'Seguridad de la informacion',
    summary: 'Sistema de gestion de seguridad de la informacion con enfoque en riesgos y controles.',
    updatedNote: 'Estado de referencia al 20 de mayo de 2026.',
    sections: [
      {
        id: '27001-4-6',
        title: 'Contexto, Liderazgo y Planificacion',
        clauses: [
          {
            id: '27001-4.1',
            title: 'Contexto SGSI',
            question: 'Se define el contexto del SGSI incluyendo alcance, interfaces y dependencias criticas?'
          },
          {
            id: '27001-5.2',
            title: 'Politica de seguridad',
            question: 'La politica de seguridad esta aprobada, comunicada y revisada periodicamente?'
          },
          {
            id: '27001-6.1.2',
            title: 'Evaluacion de riesgos',
            question: 'La evaluacion de riesgos de seguridad se realiza con criterios consistentes y trazables?'
          },
          {
            id: '27001-6.1.3',
            title: 'Tratamiento de riesgos',
            question: 'Existe plan de tratamiento de riesgos y declaracion de aplicabilidad vigente?'
          }
        ]
      },
      {
        id: '27001-7-8',
        title: 'Soporte y Operacion',
        clauses: [
          {
            id: '27001-7.2',
            title: 'Competencia en seguridad',
            question: 'El personal recibe capacitacion de seguridad acorde a su rol y riesgos asociados?'
          },
          {
            id: '27001-7.4',
            title: 'Comunicacion',
            question: 'Se gestionan comunicaciones internas y externas sobre incidentes y controles?'
          },
          {
            id: '27001-8.1',
            title: 'Control operacional SGSI',
            question: 'Se implementan controles planificados y se conservan evidencias operativas?'
          },
          {
            id: '27001-A.8',
            title: 'Tecnologia (Anexo A)',
            question: 'Los controles tecnologicos criticos (accesos, monitoreo, respaldo) estan operando efectivamente?'
          }
        ]
      },
      {
        id: '27001-9-10',
        title: 'Evaluacion y Mejora',
        clauses: [
          {
            id: '27001-9.1',
            title: 'Seguimiento y medicion',
            question: 'Se monitorean indicadores del SGSI y se reportan resultados a direccion?'
          },
          {
            id: '27001-9.2',
            title: 'Auditoria interna',
            question: 'La auditoria interna del SGSI cubre controles clave y cierra no conformidades?'
          },
          {
            id: '27001-9.3',
            title: 'Revision por la direccion',
            question: 'La direccion revisa desempeno, riesgos residuales e inversiones de seguridad?'
          },
          {
            id: '27001-10.1',
            title: 'Mejora continua',
            question: 'Se mejora continuamente el SGSI a partir de incidentes, auditorias y lecciones aprendidas?'
          }
        ]
      }
    ]
  },
  {
    id: 'iso37001',
    code: 'ISO 37001',
    version: '2025',
    focus: 'Antisoborno y cumplimiento',
    summary: 'Sistema de gestion antisoborno para prevenir, detectar y responder al soborno.',
    updatedNote: 'Estado de referencia al 20 de mayo de 2026.',
    sections: [
      {
        id: '37001-4-6',
        title: 'Gobernanza y Riesgo de Soborno',
        clauses: [
          {
            id: '37001-4.5',
            title: 'Evaluacion de riesgo de soborno',
            question: 'La organizacion evalua riesgos de soborno por proceso, tercero y jurisdiccion?'
          },
          {
            id: '37001-5.1',
            title: 'Liderazgo antisoborno',
            question: 'La alta direccion impulsa la cultura antisoborno con mensajes y recursos concretos?'
          },
          {
            id: '37001-5.3',
            title: 'Roles de cumplimiento',
            question: 'Existe funcion de cumplimiento antisoborno con independencia y autoridad?'
          },
          {
            id: '37001-6.2',
            title: 'Objetivos de cumplimiento',
            question: 'Se definieron objetivos antisoborno medibles y monitoreados periodicamente?'
          }
        ]
      },
      {
        id: '37001-7-8',
        title: 'Controles y Debida Diligencia',
        clauses: [
          {
            id: '37001-7.3',
            title: 'Sensibilizacion',
            question: 'La plantilla y terceros relevantes reciben formacion antisoborno adecuada?'
          },
          {
            id: '37001-8.2',
            title: 'Debida diligencia',
            question: 'Se aplica debida diligencia proporcional en socios, proveedores y operaciones sensibles?'
          },
          {
            id: '37001-8.5',
            title: 'Controles financieros y no financieros',
            question: 'Los controles previenen pagos indebidos, conflictos y registros inexactos?'
          },
          {
            id: '37001-8.9',
            title: 'Canal de denuncias',
            question: 'Existe canal de denuncias confiable, protegido y con investigacion efectiva?'
          }
        ]
      },
      {
        id: '37001-9-10',
        title: 'Monitoreo, Investigacion y Mejora',
        clauses: [
          {
            id: '37001-9.1',
            title: 'Seguimiento y analisis',
            question: 'Se miden resultados del sistema antisoborno con analisis periodico?'
          },
          {
            id: '37001-9.2',
            title: 'Auditoria interna',
            question: 'La auditoria interna evalua efectividad de controles antisoborno y cumplimiento legal?'
          },
          {
            id: '37001-9.3',
            title: 'Revision por la direccion',
            question: 'La direccion revisa hallazgos y decisiones de mejora del sistema antisoborno?'
          },
          {
            id: '37001-10.2',
            title: 'No conformidad y accion correctiva',
            question: 'Las desviaciones se investigan y se ejecutan acciones correctivas verificables?'
          }
        ]
      }
    ]
  }
];

window.ISO_LIBRARY = ISO_LIBRARY;
