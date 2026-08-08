import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" faz os caminhos ficarem relativos, o que funciona tanto em
// usuario.github.io quanto em usuario.github.io/nome-do-repositorio.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
