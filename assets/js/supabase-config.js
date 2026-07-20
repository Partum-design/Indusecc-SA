/*
  Configuración del cliente de Supabase (proyecto "INDUSECC SA").

  La anon key NO es un secreto: está diseñada para vivir en el navegador.
  Todo el control de acceso real ocurre en la base de datos mediante
  Row Level Security (ver /supabase/migrations). Nunca pongas aquí la
  service_role key: esa solo se usa en servidores/funciones de backend.
*/

window.SUPABASE_CONFIG = {
  url: 'https://fexfgdttbowtjtppkmqj.supabase.co',
  anonKey: 'sb_publishable_Erg_9wdNq7f_lJDwMYvYEA_KQOciwoh'
};
