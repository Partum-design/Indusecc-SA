/*
  Configuración del cliente de Supabase (proyecto "Indusecc OS").

  La anon key NO es un secreto: está diseñada para vivir en el navegador.
  Todo el control de acceso real ocurre en la base de datos mediante
  Row Level Security (ver /supabase/migrations). Nunca pongas aquí la
  service_role key: esa solo se usa en servidores/funciones de backend.
*/

window.SUPABASE_CONFIG = {
  url: 'https://tyxugmbnpszilcgguwlw.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eHVnbWJucHN6aWxjZ2d1d2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTY1ODcsImV4cCI6MjA5ODY3MjU4N30.NtqNOBo2pyQXP4mOZn2IXwgdQXgVPiIjQ1T2uGJexd8'
};
