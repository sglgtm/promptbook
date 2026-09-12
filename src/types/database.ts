// Файл-заглушка. Реальные типы сгенерируешь одной командой:
//   npx supabase gen types typescript --project-id vlsykjnijpulutewbvqt --schema public > src/types/database.ts
// До этого код работает без строгих типов PostgREST.

export type Database = Record<string, unknown>;
