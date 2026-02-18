import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://ubksjxlfjdeqzpfgiogb.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjAzZjAwZDdjLTkwMGQtNGUxOC1hN2QwLWJiZDNhZjdmYjViMCJ9.eyJwcm9qZWN0SWQiOiJ1YmtzanhsZmpkZXF6cGZnaW9nYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcxMzk5ODU1LCJleHAiOjIwODY3NTk4NTUsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.lQ5leJRhas9OqWFb5HKBX8reGnGyN2FC8aKAooMBMe4';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };