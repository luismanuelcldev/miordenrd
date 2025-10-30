"use client"

// Defino zonas de entrega en mapa: dibujo/edito polígonos, configuro tarifas y valido costos por distancia

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toastContext"
import maplibregl, { type LngLatBoundsLike, type MapGeoJSONFeature } from "maplibre-gl"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import type { FeatureCollection, GeoJsonObject, MultiPolygon, Polygon } from "geojson"
import { Loader2, MapPin, Pencil, Plus, Trash2, Undo2 } from "lucide-react"
import {
  zoneService,
  type CalculoTarifaRespuesta,
  type TarifaZona,
  type ZonaEntrega,
  type CrearZonaPayload,
} from "@/services/zoneService"

// Declaro un tipo para el alias global que requiere Mapbox Draw
type MapboxInstance = typeof import("mapbox-gl")

if (typeof window !== "undefined") {
  // Expongo mapboxgl en window para que Mapbox Draw funcione sobre MapLibre (API-compatible)
  // @ts-expect-error Mapbox Draw utiliza la API de Mapbox, MapLibre es API-compatible
  ;(window as typeof window & { mapboxgl?: MapboxInstance }).mapboxgl =
    maplibregl as unknown as MapboxInstance
}

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
const DEFAULT_CENTER: [number, number] = [-69.931211, 18.486057]

interface PuntoGeografico {
  lat: number
  lng: number
}

interface TarifaForm {
  distanciaMin: string
  distanciaMax: string
  costoBase: string
  costoPorKm: string
  recargo: string
}

interface ZonaForm {
  nombre: string
  descripcion: string
  color: string
  activa: boolean
  radioCoberturaKm: string
  puntos: PuntoGeografico[]
  tarifas: TarifaForm[]
}

const TARIFA_INICIAL: TarifaForm = {
  distanciaMin: "0",
  distanciaMax: "",
  costoBase: "0",
  costoPorKm: "",
  recargo: "",
}

const FORM_INICIAL: ZonaForm = {
  nombre: "",
  descripcion: "",
  color: "#2563eb",
  activa: true,
  radioCoberturaKm: "",
  puntos: [],
  tarifas: [TARIFA_INICIAL],
}

// Convierto una lista de puntos (lat/lng) en un polígono GeoJSON válido (cerrando el anillo)
const convertirPuntosAGeoJson = (puntos: PuntoGeografico[]): Polygon | null => {
  if (puntos.length < 3) return null
  const coordinates = puntos.map<[number, number]>((punto) => [punto.lng, punto.lat])
  const [primerLng, primerLat] = coordinates[0]
  const ultimo = coordinates[coordinates.length - 1]
  if (ultimo[0] !== primerLng || ultimo[1] !== primerLat) {
    coordinates.push([primerLng, primerLat])
  }
  return {
    type: "Polygon",
    coordinates: [coordinates],
  }
}

// Extraigo la lista de puntos (lat/lng) del polígono o multipolígono recibido
const extraerPuntosDePoligono = (poligono: unknown): PuntoGeografico[] => {
  if (!poligono || typeof poligono !== "object") return []
  const tipo = (poligono as { type?: string }).type
  if (tipo === "Polygon") {
    const coords = (poligono as Polygon).coordinates?.[0] ?? []
    return coords.slice(0, -1).map((coord) => {
      const [lng, lat] = coord as [number, number]
      return { lat, lng }
    })
  }
  if (tipo === "MultiPolygon") {
    const coords = (poligono as MultiPolygon).coordinates?.[0]?.[0] ?? []
    return coords.slice(0, -1).map((coord) => {
      const [lng, lat] = coord as [number, number]
      return { lat, lng }
    })
  }
  return []
}

// Armo una etiqueta de tarifa legible con rangos y costos
const formatearTarifa = (tarifa: TarifaZona): string => {
  const max = tarifa.distanciaMax ?? "∞"
  const costoLineal = tarifa.costoPorKm ? ` + ${tarifa.costoPorKm.toFixed(2)} x km` : ""
  const recargo = tarifa.recargo ? ` + ${tarifa.recargo.toFixed(2)}` : ""
  return `${tarifa.distanciaMin.toFixed(1)}-${typeof max === "number" ? max.toFixed(1) : max} km · ${tarifa.costoBase.toFixed(2)}${costoLineal}${recargo}`
}

// Obtengo coordenadas [lng,lat] de un Polygon/MultiPolygon para cálculos de bounds
const obtenerCoordenadas = (geometry?: GeoJsonObject | null): [number, number][] => {
  if (!geometry) return []
  if (geometry.type === "Polygon") {
    const coords = (geometry as Polygon).coordinates?.[0] ?? []
    return coords
      .filter((coord): coord is [number, number] => Array.isArray(coord) && coord.length >= 2)
      .map(([lng, lat]) => [lng, lat])
  }
  if (geometry.type === "MultiPolygon") {
    const coords = (geometry as MultiPolygon).coordinates ?? []
    return coords
      .flatMap((polygon) => polygon[0] ?? [])
      .filter((coord): coord is [number, number] => Array.isArray(coord) && coord.length >= 2)
      .map(([lng, lat]) => [lng, lat])
  }
  return []
}

// Extiendo los límites con todas las coordenadas del geometry
const extendBoundsWithGeometry = (bounds: maplibregl.LngLatBounds, geometry?: GeoJsonObject | null) => {
  obtenerCoordenadas(geometry).forEach(([lng, lat]) => bounds.extend([lng, lat]))
}

const MapPreview = ({ zonas }: { zonas: ZonaEntrega[] }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Inicializo el mapa de vista previa y agrego controles básicos
  useEffect(() => {
    if (!ref.current) return
    const map = new maplibregl.Map({
      container: ref.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: 6,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), "top-right")
    map.on("load", () => setMapReady(true))
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Pinto las zonas en el mapa de preview y ajusto el encuadre a sus límites
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !map.isStyleLoaded()) return

    if (map.getLayer("zonas-fill")) map.removeLayer("zonas-fill")
    if (map.getLayer("zonas-line")) map.removeLayer("zonas-line")
    if (map.getSource("zonas")) map.removeSource("zonas")

    if (zonas.length === 0) return
    const collection = {
      type: "FeatureCollection",
      features: zonas
        .filter((zona) => zona.poligono)
        .map((zona) => ({
          type: "Feature",
          geometry: zona.poligono as GeoJsonObject,
          properties: {
            id: zona.id,
            color: zona.color ?? "#2563eb",
          },
        })),
    } as unknown as FeatureCollection

    map.addSource("zonas", {
      type: "geojson",
      data: collection,
    })

    map.addLayer({
      id: "zonas-fill",
      type: "fill",
      source: "zonas",
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#2563eb"],
        "fill-opacity": 0.25,
      },
    })

    map.addLayer({
      id: "zonas-line",
      type: "line",
      source: "zonas",
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#2563eb"],
        "line-width": 2,
      },
    })

    const bounds = new maplibregl.LngLatBounds()
    zonas
      .filter((zona) => zona.poligono)
      .forEach((zona) =>
        extendBoundsWithGeometry(bounds, zona.poligono as GeoJsonObject),
      )
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds as LngLatBoundsLike, { padding: 40, duration: 800, maxZoom: 12 })
    }
  }, [zonas, mapReady])

  return <div ref={ref} className="h-full w-full rounded-lg overflow-hidden" />
}

interface ZonaEditorMapHandle {
  undoLastVertex: () => void
  clearPolygon: () => void
}

interface ZonaEditorMapProps {
  puntos: PuntoGeografico[]
  onChange: (puntos: PuntoGeografico[]) => void
  color: string
  zonas: ZonaEntrega[]
  zonaActualId?: number | null
}

const ZonaEditorMap = forwardRef<ZonaEditorMapHandle, ZonaEditorMapProps>(
  ({ puntos, onChange, color, zonas, zonaActualId }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const onChangeRef = useRef(onChange)
  const initialPointsRef = useRef<PuntoGeografico[]>(puntos)
  const omitNextSync = useRef(false)
  const featureIdRef = useRef<string | null>(null)

  // Creo el mapa de edición, agrego Mapbox Draw y sincronizo el polígono inicial si existe
  useEffect(() => {
    if (!containerRef.current) return

    const initialPoints = initialPointsRef.current

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialPoints.length ? [initialPoints[0].lng, initialPoints[0].lat] : DEFAULT_CENTER,
      zoom: initialPoints.length ? 11 : 7,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), "top-right")

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: initialPoints.length ? "simple_select" : "draw_polygon",
    })

    const updateFromDraw = () => {
      const drawInstance = drawRef.current
      if (!drawInstance) return
      const data = drawInstance.getAll()
      const polygonFeature = data.features.find((feature) => feature.geometry?.type === "Polygon")
      if (!polygonFeature) {
        omitNextSync.current = true
        featureIdRef.current = null
        onChangeRef.current?.([])
        return
      }
      featureIdRef.current = polygonFeature.id ? String(polygonFeature.id) : null
      const coords = ((polygonFeature.geometry as Polygon).coordinates?.[0] ?? []) as [number, number][]
      const nuevosPuntos = coords.slice(0, -1).map(([lng, lat]) => ({ lat, lng }))
      omitNextSync.current = true
      onChangeRef.current?.(nuevosPuntos)
    }

    map.addControl(draw as unknown as maplibregl.IControl, "top-left")
    drawRef.current = draw

    map.on("load", () => {
      setMapReady(true)
      if (initialPoints.length) {
        const poligono = convertirPuntosAGeoJson(initialPoints)
        if (poligono) {
          draw.add({
            type: "Feature",
            properties: {},
            geometry: poligono,
          })
          const allFeatures = draw.getAll().features as MapGeoJSONFeature[]
          const polygonFeature = allFeatures.find((feat) => feat.geometry?.type === "Polygon")
          featureIdRef.current = polygonFeature?.id ? String(polygonFeature.id) : null
          if (featureIdRef.current) {
            draw.changeMode("simple_select", { featureIds: [featureIdRef.current] })
          }
        }
      }
    })

    map.on("draw.create", updateFromDraw)
    map.on("draw.update", updateFromDraw)
    map.on("draw.delete", updateFromDraw)

    return () => {
      map.off("draw.create", updateFromDraw)
      map.off("draw.update", updateFromDraw)
      map.off("draw.delete", updateFromDraw)
      drawRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Cambio dinámicamente los estilos de fill y stroke para reflejar el color de la zona
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Sincronizo los puntos externos con el editor: redibujo el polígono y ajusto el mapa
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const fillLayers = [
      "gl-draw-polygon-fill-inactive",
      "gl-draw-polygon-fill-active",
      "gl-draw-polygon-fill-static",
    ]
    fillLayers.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "fill-color", color)
        map.setPaintProperty(layerId, "fill-opacity", layerId.includes("inactive") ? 0.15 : 0.35)
      }
    })
    const strokeLayers = [
      "gl-draw-polygon-stroke-inactive",
      "gl-draw-polygon-stroke-active",
      "gl-draw-polygon-stroke-static",
    ]
    strokeLayers.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "line-color", color)
        map.setPaintProperty(layerId, "line-width", 2)
      }
    })
  }, [color, mapReady])

  // Muestro otras zonas existentes como referencia visual (no editables)
  useEffect(() => {
    const map = mapRef.current
    const draw = drawRef.current
    if (!map || !draw || !mapReady) return

    if (omitNextSync.current) {
      omitNextSync.current = false
      return
    }

    const existing = draw.getAll().features.map((feature) => feature.id as string)
    if (existing.length) {
      draw.delete(existing)
      featureIdRef.current = null
    }

    if (puntos.length) {
      const poligono = convertirPuntosAGeoJson(puntos)
      if (poligono) {
        draw.add({
          type: "Feature",
          properties: {},
          geometry: poligono,
        })
        const allFeatures = draw.getAll().features as MapGeoJSONFeature[]
        const polygonFeature = allFeatures.find((feat) => feat.geometry?.type === "Polygon") ?? allFeatures.at(-1)
        featureIdRef.current = polygonFeature?.id ? String(polygonFeature.id) : null
        if (featureIdRef.current) {
          draw.changeMode("simple_select", { featureIds: [featureIdRef.current] })
        }
        const bounds = new maplibregl.LngLatBounds()
        obtenerCoordenadas(poligono).forEach(([lng, lat]) => bounds.extend([lng, lat]))
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds as LngLatBoundsLike, { padding: 40, maxZoom: 14 })
        }
      }
    } else {
      draw.changeMode("draw_polygon")
      map.flyTo({ center: DEFAULT_CENTER, zoom: 7, essential: true })
    }
  }, [puntos, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    if (map.getLayer("zonas-existentes-fill")) map.removeLayer("zonas-existentes-fill")
    if (map.getLayer("zonas-existentes-line")) map.removeLayer("zonas-existentes-line")
    if (map.getSource("zonas-existentes")) map.removeSource("zonas-existentes")

    const otherZones = zonas.filter((zona) => zona.id !== zonaActualId && zona.poligono)
    if (otherZones.length === 0) return

    map.addSource("zonas-existentes", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: otherZones.map((zona) => ({
          type: "Feature",
          geometry: zona.poligono as GeoJsonObject,
          properties: {
            color: zona.color ?? "#94a3b8",
          },
        })),
      } as unknown as FeatureCollection,
    })

    map.addLayer({
      id: "zonas-existentes-fill",
      type: "fill",
      source: "zonas-existentes",
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#94a3b8"],
        "fill-opacity": 0.12,
      },
    })

    map.addLayer({
      id: "zonas-existentes-line",
      type: "line",
      source: "zonas-existentes",
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#94a3b8"],
        "line-width": 1,
      },
    })
  }, [zonas, zonaActualId, mapReady])

  // Expongo acciones de edición (deshacer y limpiar) al padre por medio de ref
  useImperativeHandle(
      ref,
      () => ({
        undoLastVertex: () => {
          // Quito el último vértice del polígono o lo elimino si queda insuficiente
          const draw = drawRef.current
          const map = mapRef.current
          if (!draw || !map) return
          const data = draw.getAll().features as MapGeoJSONFeature[]
          const feature = data.find((feat) => String(feat.id) === featureIdRef.current)
          if (!feature || feature.geometry?.type !== "Polygon") {
            return
          }
      const coords = ((feature.geometry as Polygon).coordinates?.[0] ?? []) as [number, number][]
          if (!coords || coords.length <= 4) {
            if (featureIdRef.current) {
              draw.delete(featureIdRef.current)
            }
            featureIdRef.current = null
            omitNextSync.current = true
            onChange([])
            return
          }
          coords.splice(coords.length - 2, 1)
          if (featureIdRef.current) {
            draw.delete(featureIdRef.current)
          }
          draw.add({
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [coords],
            },
          })
          const updatedFeatures = draw.getAll().features as MapGeoJSONFeature[]
          const updatedPolygon = updatedFeatures.find((feat) => feat.geometry?.type === "Polygon") ?? updatedFeatures.at(-1)
          featureIdRef.current = updatedPolygon?.id ? String(updatedPolygon.id) : null
          if (featureIdRef.current) {
            draw.changeMode("simple_select", { featureIds: [featureIdRef.current] })
          }
          omitNextSync.current = true
          const nuevosPuntos = coords.slice(0, -1).map(([lng, lat]: [number, number]) => ({ lat, lng }))
          onChange(nuevosPuntos)
        },
        clearPolygon: () => {
          // Elimino cualquier polígono y dejo el editor en modo "draw_polygon"
          const draw = drawRef.current
          if (!draw) return
          const ids = draw.getAll().features.map((feature) => feature.id as string)
          if (ids.length) {
            draw.delete(ids)
            featureIdRef.current = null
            omitNextSync.current = true
            onChange([])
          }
          draw.changeMode("draw_polygon")
        },
      }),
      [onChange],
    )

    return <div ref={containerRef} className="h-full w-full rounded-lg border bg-muted/40" />
  },
)

ZonaEditorMap.displayName = "ZonaEditorMap"

export default function AdminZonasPage() {
  const { showToast } = useToast()
  const [zonas, setZonas] = useState<ZonaEntrega[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState<ZonaEntrega | null>(null)
  const [form, setForm] = useState<ZonaForm>(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [tarifaPreview, setTarifaPreview] = useState<CalculoTarifaRespuesta | null>(null)
  const [calculandoTarifa, setCalculandoTarifa] = useState(false)
  const editorRef = useRef<ZonaEditorMapHandle>(null)

  // Cargo las zonas configuradas para listarlas y mostrarlas en el mapa de preview
  const cargarZonas = useCallback(async () => {
    try {
      setCargando(true)
      const data = await zoneService.listarZonas()
      setZonas(data)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar las zonas", "error")
    } finally {
      setCargando(false)
    }
  }, [showToast])

  useEffect(() => {
    void cargarZonas()
  }, [cargarZonas])

  // Derivo el polígono GeoJSON a partir de los puntos actuales del formulario
  const poligonoActual = useMemo(() => convertirPuntosAGeoJson(form.puntos), [form.puntos])

  // Consulto una tarifa estimada para un punto de prueba dentro de la zona
  const evaluarTarifa = useCallback(
    async (lat: number, lng: number, zonaId?: number) => {
      try {
        setCalculandoTarifa(true)
        const data = await zoneService.calcularTarifa({ latitud: lat, longitud: lng, zonaId })
        setTarifaPreview(data)
      } catch (error) {
        console.error(error)
        setTarifaPreview(null)
      } finally {
        setCalculandoTarifa(false)
      }
    },
    [],
  )

  // Inicio el flujo de creación: limpio formularios y abro modal
  const abrirCrear = () => {
    setModoEdicion(null)
    setForm(FORM_INICIAL)
    setMensajeError(null)
    setTarifaPreview(null)
    setModalAbierto(true)
  }

  // Inicio el flujo de edición: cargo datos de la zona, puntos y tarifas en el formulario
  const abrirEditar = (zona: ZonaEntrega) => {
    setModoEdicion(zona)
    setForm({
      nombre: zona.nombre,
      descripcion: zona.descripcion ?? "",
      color: zona.color ?? "#2563eb",
      activa: zona.activa,
      radioCoberturaKm: zona.radioCoberturaKm ? String(zona.radioCoberturaKm) : "",
      puntos: extraerPuntosDePoligono(zona.poligono),
      tarifas:
        zona.tarifas && zona.tarifas.length > 0
          ? zona.tarifas.map((tarifa) => ({
              distanciaMin: tarifa.distanciaMin.toString(),
              distanciaMax: tarifa.distanciaMax?.toString() ?? "",
              costoBase: tarifa.costoBase.toString(),
              costoPorKm: tarifa.costoPorKm?.toString() ?? "",
              recargo: tarifa.recargo?.toString() ?? "",
            }))
          : [TARIFA_INICIAL],
    })
    setTarifaPreview(null)
    setMensajeError(null)
    setModalAbierto(true)
  }

  // Cierro el modal y restauro el estado inicial del formulario
  const cerrarModal = () => {
    if (guardando) return
    setModalAbierto(false)
    setModoEdicion(null)
    setForm(FORM_INICIAL)
    setMensajeError(null)
    setTarifaPreview(null)
  }

  // Actualizo un campo del formulario de zona
  const actualizarCampo = <K extends keyof ZonaForm>(campo: K, valor: ZonaForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  // Actualizo un campo de una fila de tarifa específica
  const actualizarTarifa = (indice: number, campo: keyof TarifaForm, valor: string) => {
    setForm((prev) => ({
      ...prev,
      tarifas: prev.tarifas.map((item, idx) => (idx === indice ? { ...item, [campo]: valor } : item)),
    }))
  }

  // Agrego una nueva fila de tarifa al formulario
  const agregarTarifa = () => {
    setForm((prev) => ({
      ...prev,
      tarifas: [...prev.tarifas, TARIFA_INICIAL],
    }))
  }

  // Elimino una fila de tarifa del formulario
  const eliminarTarifa = (indice: number) => {
    setForm((prev) => ({
      ...prev,
      tarifas: prev.tarifas.filter((_, idx) => idx !== indice),
    }))
  }

  // Valido y construyo el payload final de la zona a enviar al backend
  const construirPayload = (): CrearZonaPayload => {
    const nombre = form.nombre.trim()
    if (nombre.length === 0) {
      throw new Error("El nombre de la zona es obligatorio")
    }
    if (!poligonoActual) {
      throw new Error("Define al menos tres puntos para el polígono de la zona")
    }

    const tarifas = form.tarifas
      .map((tarifa) => {
        const distanciaMin = Number.parseFloat(tarifa.distanciaMin || "0")
        const distanciaMax = tarifa.distanciaMax ? Number.parseFloat(tarifa.distanciaMax) : undefined
        const costoBase = Number.parseFloat(tarifa.costoBase || "0")
        const costoPorKm = tarifa.costoPorKm ? Number.parseFloat(tarifa.costoPorKm) : undefined
        const recargo = tarifa.recargo ? Number.parseFloat(tarifa.recargo) : undefined

        if ([distanciaMin, costoBase].some((valor) => Number.isNaN(valor))) {
          throw new Error("Las tarifas deben tener valores numéricos válidos")
        }

        return {
          distanciaMin,
          distanciaMax: distanciaMax ?? undefined,
          costoBase,
          costoPorKm: costoPorKm ?? undefined,
          recargo: recargo ?? undefined,
        }
      })
      .filter((tarifa) => tarifa.costoBase >= 0)

    return {
      nombre,
      descripcion: form.descripcion.trim() || undefined,
      color: form.color,
      activa: form.activa,
      radioCoberturaKm: form.radioCoberturaKm ? Number.parseFloat(form.radioCoberturaKm) : undefined,
      poligono: poligonoActual,
      tarifas,
    }
  }

  // Guardo la zona (crear/actualizar) y refresco el listado; muestro feedback de éxito/error
  const guardarZona = async () => {
    try {
      setGuardando(true)
      const payload = construirPayload()
      if (modoEdicion) {
        await zoneService.actualizarZona(modoEdicion.id, payload)
        showToast("Zona actualizada", "success")
      } else {
        await zoneService.crearZona(payload)
        showToast("Zona creada", "success")
      }
      await cargarZonas()
      cerrarModal()
    } catch (error) {
      console.error(error)
      setMensajeError(error instanceof Error ? error.message : "No fue posible guardar la zona")
    } finally {
      setGuardando(false)
    }
  }

  // Confirmo y elimino la zona seleccionada
  const eliminarZona = async (zona: ZonaEntrega) => {
    if (!window.confirm(`Eliminar la zona "${zona.nombre}"?`)) return
    try {
      await zoneService.eliminarZona(zona.id)
      showToast("Zona eliminada", "success")
      await cargarZonas()
    } catch (error) {
      console.error(error)
      showToast("No fue posible eliminar la zona", "error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zonas y direcciones</h1>
          <p className="text-muted-foreground">
            Configura las zonas de entrega, valida direcciones y gestiona las tarifas por distancia.
          </p>
        </div>
        <Button onClick={abrirCrear} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" /> Nueva zona
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Mapa de cobertura</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] overflow-hidden rounded-lg border bg-muted/40">
          <MapPreview zonas={zonas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de zonas</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando zonas...
            </div>
          ) : zonas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Aún no has configurado zonas de entrega.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zona</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tarifas</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zonas.map((zona) => (
                  <TableRow key={zona.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{zona.nombre}</span>
                        {zona.descripcion && <span className="text-sm text-muted-foreground">{zona.descripcion}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={zona.activa ? "default" : "outline"}>
                          {zona.activa ? "Activa" : "Inactiva"}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {zona.centroideLatitud && zona.centroideLongitud
                            ? `${zona.centroideLatitud.toFixed(3)}, ${zona.centroideLongitud.toFixed(3)}`
                            : "Sin centroide"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {zona.tarifas && zona.tarifas.length > 0 ? (
                          zona.tarifas.map((tarifa) => (
                            <Badge key={tarifa.id} variant="secondary">
                              {formatearTarifa(tarifa)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin tarifas</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditar(zona)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => eliminarZona(zona)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAbierto} onOpenChange={(abierto) => !abierto && cerrarModal()}>
        <DialogContent className="max-w-3xl lg:max-w-4xl px-0 pb-0 z-[1200]">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{modoEdicion ? "Editar zona" : "Nueva zona"}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[80vh] overflow-y-auto space-y-6 px-6 pb-6">
            {mensajeError && (
              <Alert variant="destructive">
                <AlertDescription>{mensajeError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="nombre">
                    Nombre
                  </label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => actualizarCampo("nombre", e.target.value)}
                    placeholder="Zona Centro"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="color">
                      Color de referencia
                    </label>
                    <Input id="color" type="color" value={form.color} onChange={(e) => actualizarCampo("color", e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">Zona activa</p>
                      <p className="text-xs text-muted-foreground">Determina si se usa durante el checkout.</p>
                    </div>
                    <Switch checked={form.activa} onCheckedChange={(valor) => actualizarCampo("activa", valor)} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="descripcion">
                  Descripción
                </label>
                <Textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                  placeholder="Cobertura del centro histórico"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="radioCoberturaKm">
                  Radio de cobertura (km)
                </label>
                <Input
                  id="radioCoberturaKm"
                  value={form.radioCoberturaKm}
                  onChange={(e) => actualizarCampo("radioCoberturaKm", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium mb-1">Polígono de la zona</p>
                  <p className="text-xs text-muted-foreground">Haz clic en el mapa para trazar el perímetro.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.undoLastVertex()}
                    disabled={form.puntos.length === 0}
                  >
                    <Undo2 className="mr-2 h-3 w-3" /> Deshacer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.clearPolygon()}
                    disabled={form.puntos.length === 0}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
              <div className="h-64">
                <ZonaEditorMap
                  ref={editorRef}
                  puntos={form.puntos}
                  onChange={(puntosActualizados) =>
                    setForm((prev) => ({
                      ...prev,
                      puntos: puntosActualizados,
                    }))
                  }
                  color={form.color}
                  zonas={zonas}
                  zonaActualId={modoEdicion?.id ?? null}
                />
              </div>
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                {form.puntos.length < 3 ? (
                  <span>Debes definir al menos tres puntos para validar la zona.</span>
                ) : (
                  <span>{form.puntos.length} puntos definidos. La zona se cerrará automáticamente al guardar.</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Tarifas por distancia</p>
                <Button variant="outline" size="sm" onClick={agregarTarifa}>
                  <Plus className="mr-2 h-3 w-3" /> Añadir tarifa
                </Button>
              </div>
              <div className="space-y-3">
                {form.tarifas.map((tarifa, indice) => (
                  <div key={`tarifa-${indice}`} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <label className="text-xs font-medium" htmlFor={`distanciaMin-${indice}`}>
                        Distancia min (km)
                      </label>
                      <Input
                        id={`distanciaMin-${indice}`}
                        value={tarifa.distanciaMin}
                        onChange={(e) => actualizarTarifa(indice, "distanciaMin", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium" htmlFor={`distanciaMax-${indice}`}>
                        Distancia max (km)
                      </label>
                      <Input
                        id={`distanciaMax-${indice}`}
                        value={tarifa.distanciaMax}
                        onChange={(e) => actualizarTarifa(indice, "distanciaMax", e.target.value)}
                        placeholder="Sin límite"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium" htmlFor={`costoBase-${indice}`}>
                        Costo base
                      </label>
                      <Input
                        id={`costoBase-${indice}`}
                        value={tarifa.costoBase}
                        onChange={(e) => actualizarTarifa(indice, "costoBase", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium" htmlFor={`costoPorKm-${indice}`}>
                        Costo por km
                      </label>
                      <Input
                        id={`costoPorKm-${indice}`}
                        value={tarifa.costoPorKm}
                        onChange={(e) => actualizarTarifa(indice, "costoPorKm", e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium" htmlFor={`recargo-${indice}`}>
                          Recargo
                        </label>
                        <Input
                          id={`recargo-${indice}`}
                          value={tarifa.recargo}
                          onChange={(e) => actualizarTarifa(indice, "recargo", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      {form.tarifas.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => eliminarTarifa(indice)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {form.puntos.length >= 3 && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Validación rápida</p>
                <p className="text-xs text-muted-foreground">
                  Selecciona un punto dentro de la zona para estimar la tarifa aplicada actualmente.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const puntoReferencia = form.puntos[0]
                      void evaluarTarifa(puntoReferencia.lat, puntoReferencia.lng, modoEdicion?.id)
                    }}
                  >
                    Calcular tarifa de ejemplo
                  </Button>
                  {calculandoTarifa && <Loader2 className="h-3 w-3 animate-spin" />}
                  {tarifaPreview && tarifaPreview.tarifaAplicada && (
                    <span>
                      Tarifa: ${tarifaPreview.tarifaAplicada.costoTotal.toFixed(2)}
                      {typeof tarifaPreview.distanciaEstimadaKm === "number" &&
                        ` · ${tarifaPreview.distanciaEstimadaKm.toFixed(2)} km`}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={cerrarModal} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={guardarZona} disabled={guardando}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
