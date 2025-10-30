// Redirijo los tipos de mapbox-gl a maplibre-gl para compatibilidad en el proyecto
declare module "mapbox-gl" {
  export * from "maplibre-gl"
  export { default } from "maplibre-gl"
}
