"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, MapPin, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toastContext"
import { addressService, type DireccionEnvio } from "@/services/addressService"
import { useAuth } from "@/lib/auth"
import { zoneService, type ZonaEntrega, type CalculoTarifaRespuesta } from "@/services/zoneService"
import maplibregl from "maplibre-gl"
import type { FeatureCollection, GeoJsonObject } from "geojson"

type MapboxInstance = typeof import("mapbox-gl")

if (typeof window !== "undefined") {
  // @ts-expect-error Mapbox Draw espera mapboxgl y MapLibre comparte la misma API
  ;(window as typeof window & { mapboxgl?: MapboxInstance }).mapboxgl = maplibregl as unknown as MapboxInstance
}

interface FormDireccion {
  calle: string
  ciudad: string
  pais: string
  codigoPostal: string
  referencias: string
  latitud: number | null
  longitud: number | null
  zonaId: number | null
}

const FORM_INICIAL: FormDireccion = {
  calle: "",
  ciudad: "",
  pais: "",
  codigoPostal: "",
  referencias: "",
  latitud: null,
  longitud: null,
  zonaId: null,
}

const formatearDireccion = (direccion: DireccionEnvio) => {
  const partes = [direccion.ciudad, direccion.codigoPostal].filter(Boolean)
  return partes.join(", ")
}

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
const DEFAULT_CENTER: [number, number] = [-69.931211, 18.486057]
const AUTO_ZONE_VALUE = "auto"

interface ErrorResponseData {
  message?: unknown
}

interface AxiosLikeError {
  response?: {
    data?: ErrorResponseData
  }
}

const obtenerMensajeError = (error: unknown): string => {
  if (!error || typeof error !== "object") return "Ocurrió un error inesperado"
  const axiosError = error as AxiosLikeError
  const mensaje = axiosError.response?.data?.message
  if (Array.isArray(mensaje)) return mensaje.join(". ")
  if (typeof mensaje === "string") return mensaje
  return "Ocurrió un error inesperado"
}

interface DireccionMapProps {
  zonas: ZonaEntrega[]
  posicionSeleccionada: { lat: number; lng: number } | null
  centroPreferido: { lat: number; lng: number }
  onSeleccion: (coords: { lat: number; lng: number }) => void
}

const DireccionMap = ({ zonas, posicionSeleccionada, centroPreferido, onSeleccion }: DireccionMapProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const lastCentroRef = useRef<string>("")

  useEffect(() => {
    if (!ref.current) return
    const map = new maplibregl.Map({
      container: ref.current,
      style: MAP_STYLE,
      center: posicionSeleccionada
        ? [posicionSeleccionada.lng, posicionSeleccionada.lat]
        : [centroPreferido.lng, centroPreferido.lat],
      zoom: posicionSeleccionada ? 13 : 7,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), "top-right")

    map.on("load", () => setMapReady(true))

    map.on("click", (event) => {
      onSeleccion({ lat: event.lngLat.lat, lng: event.lngLat.lng })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [centroPreferido.lng, centroPreferido.lat, onSeleccion, posicionSeleccionada])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    if (map.getLayer("zonas-direcciones-fill")) map.removeLayer("zonas-direcciones-fill")
    if (map.getLayer("zonas-direcciones-line")) map.removeLayer("zonas-direcciones-line")
    if (map.getSource("zonas-direcciones")) map.removeSource("zonas-direcciones")

    if (zonas.length === 0) return

    const collection = {
      type: "FeatureCollection",
      features: zonas
        .filter((zona) => zona.poligono)
        .map((zona) => ({
          type: "Feature",
          geometry: zona.poligono as GeoJsonObject,
          properties: {
            color: zona.color ?? "#3b82f6",
          },
        })),
    } as unknown as FeatureCollection

    map.addSource("zonas-direcciones", {
      type: "geojson",
      data: collection,
    })

    map.addLayer({
      id: "zonas-direcciones-fill",
      type: "fill",
      source: "zonas-direcciones",
      paint: {
        "fill-color": ["coalesce", ["get", "color"], "#3b82f6"],
        "fill-opacity": 0.15,
      },
    })
    map.addLayer({
      id: "zonas-direcciones-line",
      type: "line",
      source: "zonas-direcciones",
      paint: {
        "line-color": ["coalesce", ["get", "color"], "#3b82f6"],
        "line-width": 1.5,
      },
    })
  }, [zonas, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const centerKey = `${centroPreferido.lat.toFixed(4)}-${centroPreferido.lng.toFixed(4)}`
    if (lastCentroRef.current !== centerKey && !posicionSeleccionada) {
      map.flyTo({ center: [centroPreferido.lng, centroPreferido.lat], zoom: 7, speed: 0.6 })
      lastCentroRef.current = centerKey
    }
  }, [centroPreferido.lat, centroPreferido.lng, mapReady, posicionSeleccionada])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (posicionSeleccionada) {
      const lngLat: [number, number] = [posicionSeleccionada.lng, posicionSeleccionada.lat]
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "#2563eb" }).setLngLat(lngLat).addTo(map)
      } else {
        markerRef.current.setLngLat(lngLat)
      }
      map.flyTo({ center: lngLat, zoom: 13, speed: 0.7 })
    } else if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [posicionSeleccionada, mapReady])

  return <div ref={ref} className="h-full w-full rounded-lg border bg-muted/40" />
}

export default function MisDirecciones() {
  const { usuario } = useAuth()
  const { showToast } = useToast()

  const [direcciones, setDirecciones] = useState<DireccionEnvio[]>([])
  const [principalId, setPrincipalId] = useState<number | null>(null)
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [formState, setFormState] = useState<FormDireccion>(FORM_INICIAL)
  const [direccionEditando, setDireccionEditando] = useState<DireccionEnvio | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [zonas, setZonas] = useState<ZonaEntrega[]>([])
  const [cargandoZonas, setCargandoZonas] = useState(false)
  const [posicionSeleccionada, setPosicionSeleccionada] = useState<{ lat: number; lng: number } | null>(null)
  const [tarifaEstimacion, setTarifaEstimacion] = useState<CalculoTarifaRespuesta | null>(null)
  const [calculandoTarifa, setCalculandoTarifa] = useState(false)

  const storageKey = useMemo(() => `sp_principal_dir_${usuario?.id ?? "anon"}`, [usuario?.id])
  const centroMapa = useMemo(() => {
    if (posicionSeleccionada) {
      return posicionSeleccionada
    }
    const zonaConCentro = zonas.find(
      (zona) =>
        typeof zona.centroideLatitud === "number" &&
        typeof zona.centroideLongitud === "number",
    )
    if (zonaConCentro && zonaConCentro.centroideLatitud && zonaConCentro.centroideLongitud) {
      return {
        lat: zonaConCentro.centroideLatitud,
        lng: zonaConCentro.centroideLongitud,
      }
    }
    return { lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] }
  }, [posicionSeleccionada, zonas])

  const zonaSeleccionada = useMemo(
    () => (formState.zonaId ? zonas.find((zona) => zona.id === formState.zonaId) ?? null : null),
    [formState.zonaId, zonas],
  )


  const cargarZonas = useCallback(async () => {
    try {
      setCargandoZonas(true)
      const data = await zoneService.listarZonas({ soloActivas: true })
      setZonas(data)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar las zonas de entrega", "error")
    } finally {
      setCargandoZonas(false)
    }
  }, [showToast])

  const cargarDirecciones = async () => {
    try {
      setCargando(true)
      const lista = await addressService.listarDirecciones()
      setDirecciones(lista)

      let principal: number | null = null
      if (lista.length > 0) {
        const guardado = localStorage.getItem(storageKey)
        const guardadoNum = guardado ? Number.parseInt(guardado, 10) : NaN
        if (!Number.isNaN(guardadoNum) && lista.some((item) => item.id === guardadoNum)) {
          principal = guardadoNum
        } else {
          principal = lista[0].id
        }
      }
      setPrincipalId(principal)
    } catch (error) {
      console.error(error)
      showToast("No fue posible cargar tus direcciones", "error")
    } finally {
      setCargando(false)
    }
  }

  const evaluarTarifa = useCallback(
    async (lat: number, lng: number, zonaPreferida?: number | null) => {
      try {
        setCalculandoTarifa(true)
        const respuesta = await zoneService.calcularTarifa({
          latitud: lat,
          longitud: lng,
          zonaId: zonaPreferida ?? undefined,
        })
        setTarifaEstimacion(respuesta)
        setFormState((prev) => ({
          ...prev,
          zonaId: respuesta.zona.id,
        }))
        setMensajeError(null)
      } catch (error) {
        console.error(error)
        setTarifaEstimacion(null)
        setFormState((prev) => ({
          ...prev,
          zonaId: null,
        }))
        setMensajeError(obtenerMensajeError(error))
      } finally {
        setCalculandoTarifa(false)
      }
    },
    [],
  )

  const manejarSeleccionMapa = useCallback(
    (coords: { lat: number; lng: number }) => {
      setPosicionSeleccionada(coords)
      setFormState((prev) => ({
        ...prev,
        latitud: coords.lat,
        longitud: coords.lng,
      }))
      void evaluarTarifa(coords.lat, coords.lng, formState.zonaId ?? undefined)
    },
    [evaluarTarifa, formState.zonaId],
  )

  const limpiarSeleccion = useCallback(() => {
    setPosicionSeleccionada(null)
    setTarifaEstimacion(null)
    setFormState((prev) => ({
      ...prev,
      latitud: null,
      longitud: null,
      zonaId: null,
    }))
    setMensajeError(null)
  }, [])

  const manejarZonaSeleccionada = useCallback(
    (valor: string) => {
      const parsed = Number.parseInt(valor, 10)
      const idSeleccionado = valor === AUTO_ZONE_VALUE || Number.isNaN(parsed) ? null : parsed
      setFormState((prev) => ({
        ...prev,
        zonaId: idSeleccionado,
      }))
      if (posicionSeleccionada) {
        void evaluarTarifa(posicionSeleccionada.lat, posicionSeleccionada.lng, idSeleccionado ?? undefined)
      }
    },
    [evaluarTarifa, posicionSeleccionada],
  )

  useEffect(() => {
    void cargarDirecciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void cargarZonas()
  }, [cargarZonas])

  const cerrarModal = () => {
    setModalAbierto(false)
    setDireccionEditando(null)
    setFormState(FORM_INICIAL)
    setModoEdicion(false)
    setMensajeError(null)
    setPosicionSeleccionada(null)
    setTarifaEstimacion(null)
    setCalculandoTarifa(false)
  }

  const abrirCrear = () => {
    setModoEdicion(false)
    setDireccionEditando(null)
    setFormState(FORM_INICIAL)
    setMensajeError(null)
    setPosicionSeleccionada(null)
    setTarifaEstimacion(null)
    setCalculandoTarifa(false)
    setModalAbierto(true)
  }

  const abrirEditar = (direccion: DireccionEnvio) => {
    setModoEdicion(true)
    setDireccionEditando(direccion)
    setFormState({
      calle: direccion.calle,
      ciudad: direccion.ciudad,
      pais: direccion.pais,
      codigoPostal: direccion.codigoPostal ?? "",
      referencias: direccion.referencias ?? "",
      latitud: direccion.latitud ?? null,
      longitud: direccion.longitud ?? null,
      zonaId: direccion.zonaId ?? null,
    })
    if (direccion.latitud && direccion.longitud) {
      const posicion = { lat: direccion.latitud, lng: direccion.longitud }
      setPosicionSeleccionada(posicion)
      void evaluarTarifa(direccion.latitud, direccion.longitud, direccion.zonaId ?? undefined)
    } else {
      setPosicionSeleccionada(null)
      setTarifaEstimacion(null)
      setCalculandoTarifa(false)
    }
    setMensajeError(null)
    setModalAbierto(true)
  }

  const manejarCambio = (campo: keyof FormDireccion, valor: string) => {
    setFormState((prev) => ({ ...prev, [campo]: valor }))
  }

  const validarFormulario = (): string | null => {
    if (!formState.calle.trim()) return "La calle es obligatoria"
    if (!formState.ciudad.trim()) return "La ciudad es obligatoria"
    if (!formState.pais.trim()) return "El país es obligatorio"
    return null
  }

  const guardarDireccion = async () => {
    const error = validarFormulario()
    if (error) {
      setMensajeError(error)
      return
    }

    const payload = {
      calle: formState.calle.trim(),
      ciudad: formState.ciudad.trim(),
      pais: formState.pais.trim(),
      codigoPostal: formState.codigoPostal.trim() || undefined,
      referencias: formState.referencias.trim() || undefined,
      latitud: formState.latitud ?? undefined,
      longitud: formState.longitud ?? undefined,
      zonaId: formState.zonaId ?? undefined,
    }

    try {
      setGuardando(true)
      if (modoEdicion && direccionEditando) {
        await addressService.actualizarDireccion(direccionEditando.id, payload)
        showToast("Dirección actualizada", "success")
      } else {
        const creada = await addressService.crearDireccion(payload)
        showToast("Dirección creada", "success")
        if (!principalId) {
          setPrincipalId(creada.id)
          localStorage.setItem(storageKey, creada.id.toString())
        }
      }
      setMensajeError(null)
      await cargarDirecciones()
      cerrarModal()
    } catch (err) {
      console.error(err)
      setMensajeError(obtenerMensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const eliminarDireccion = async (id: number) => {
    if (!window.confirm("¿Eliminar esta dirección?")) return

    try {
      await addressService.eliminarDireccion(id)
      showToast("Dirección eliminada", "success")
      const nuevas = direcciones.filter((direccion) => direccion.id !== id)
      setDirecciones(nuevas)
      if (principalId === id) {
        const nuevaPrincipal = nuevas[0]?.id ?? null
        setPrincipalId(nuevaPrincipal)
        if (nuevaPrincipal) {
          localStorage.setItem(storageKey, nuevaPrincipal.toString())
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch (err) {
      console.error(err)
      setMensajeError(obtenerMensajeError(err))
    }
  }

  const establecerPrincipal = (id: number) => {
    setPrincipalId(id)
    localStorage.setItem(storageKey, id.toString())
    showToast("Dirección principal actualizada", "success")
  }

  const contenidoLista = () => {
    if (cargando) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando direcciones...
        </div>
      )
    }

    if (direcciones.length === 0) {
      return (
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <p className="text-lg font-semibold">Aún no tienes direcciones guardadas</p>
            <p className="text-muted-foreground">
              Agrega tu primera dirección para que podamos enviar tus pedidos.
            </p>
            <Button onClick={abrirCrear} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Nueva Dirección
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {direcciones.map((direccion) => {
          const esPrincipal = principalId === direccion.id
          return (
            <Card key={direccion.id} className={esPrincipal ? "ring-2 ring-primary" : ""}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{direccion.calle}</CardTitle>
                  {esPrincipal && <Badge>Principal</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => abrirEditar(direccion)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminarDireccion(direccion.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{direccion.calle}</p>
                <p>{formatearDireccion(direccion)}</p>
                <p>{direccion.pais}</p>
                {direccion.referencias && <p className="text-muted-foreground">{direccion.referencias}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {direccion.zona ? (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${direccion.zona.color ?? "#2563eb"}22`,
                        borderColor: direccion.zona.color ?? undefined,
                        color: direccion.zona.color ?? undefined,
                      }}
                    >
                      Zona {direccion.zona.nombre}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Fuera de cobertura</Badge>
                  )}
                  <Badge variant={direccion.validada ? "default" : "destructive"}>
                    {direccion.validada ? "Validada" : "Pendiente"}
                  </Badge>
                  {direccion.latitud && direccion.longitud && (
                    <span className="text-xs text-muted-foreground">
                      {direccion.latitud.toFixed(4)}, {direccion.longitud.toFixed(4)}
                    </span>
                  )}
                </div>
                {!esPrincipal && (
                  <Button variant="outline" size="sm" onClick={() => establecerPrincipal(direccion.id)}>
                    Establecer como Principal
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con CTA para crear nueva dirección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Mis Direcciones</h1>
          <p className="text-muted-foreground">Gestiona tus direcciones de envío para completar tus pedidos.</p>
        </div>
        {direcciones.length > 0 && (
          <Button onClick={abrirCrear} className="self-start sm:self-auto">
            <Plus className="h-4 w-4 mr-2" /> Nueva Dirección
          </Button>
        )}
      </div>

      {/* Listado o estado vacío dependiendo de los datos */}
      {contenidoLista()}

      {/* Modal para crear/editar dirección con formulario y mapa */}
      <Dialog open={modalAbierto} onOpenChange={(abierto) => !abierto && !guardando && cerrarModal()}>
        <DialogContent className="max-w-2xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{modoEdicion ? "Editar dirección" : "Nueva dirección"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {mensajeError && (
              <Alert variant="destructive">
                <AlertDescription>{mensajeError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              {/* Columna izquierda: formulario de datos generales */}
              <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
                <div>
                  <h3 className="text-base font-semibold">Información general</h3>
                  <p className="text-sm text-muted-foreground">Completa los datos básicos de tu dirección.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="calle">Calle y número</Label>
                    <Input
                      id="calle"
                      value={formState.calle}
                      onChange={(e) => manejarCambio("calle", e.target.value)}
                      placeholder="Av. Principal 123"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={formState.ciudad}
                      onChange={(e) => manejarCambio("ciudad", e.target.value)}
                      placeholder="Santo Domingo"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="codigoPostal">Código postal</Label>
                    <Input
                      id="codigoPostal"
                      value={formState.codigoPostal}
                      onChange={(e) => manejarCambio("codigoPostal", e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      value={formState.pais}
                      onChange={(e) => manejarCambio("pais", e.target.value)}
                      placeholder="República Dominicana"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="referencias">Referencias adicionales</Label>
                  <Textarea
                    id="referencias"
                    value={formState.referencias}
                    onChange={(e) => manejarCambio("referencias", e.target.value)}
                    placeholder="Edificio azul, apartamento 4B"
                    rows={3}
                  />
                </div>
              </div>

              {/* Columna derecha: mapa interactivo y selección de zona */}
              <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold">Ubicación en el mapa</h3>
                  <p className="text-sm text-muted-foreground">Coloca el marcador para validar la cobertura.</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  {posicionSeleccionada ? (
                    <span>
                      Lat: {posicionSeleccionada.lat.toFixed(4)} · Lng: {posicionSeleccionada.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span>Sin coordenadas seleccionadas</span>
                  )}
                  {posicionSeleccionada && (
                    <Button variant="ghost" size="sm" onClick={limpiarSeleccion}>
                      Limpiar
                    </Button>
                  )}
                </div>
                <div className="h-56 rounded-lg border overflow-hidden md:h-64">
                  {cargandoZonas ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando mapa...
                    </div>
                  ) : (
                    <DireccionMap
                      zonas={zonas}
                      posicionSeleccionada={posicionSeleccionada}
                      centroPreferido={centroMapa}
                      onSeleccion={manejarSeleccionMapa}
                    />
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Zona de entrega</Label>
                    <Select
                      value={formState.zonaId ? String(formState.zonaId) : AUTO_ZONE_VALUE}
                      onValueChange={manejarZonaSeleccionada}
                      disabled={cargandoZonas}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={cargandoZonas ? "Cargando zonas..." : "Seleccionar automáticamente"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUTO_ZONE_VALUE}>Seleccionar automáticamente</SelectItem>
                        {zonas.map((zona) => (
                          <SelectItem key={zona.id} value={String(zona.id)}>
                            {zona.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {zonaSeleccionada && (
                      <p className="text-xs text-muted-foreground">{zonaSeleccionada.descripcion ?? "Zona activa"}</p>
                    )}
                  </div>
                  <div className="rounded-md border bg-background/70 p-3 text-xs text-muted-foreground">
                    {calculandoTarifa ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Calculando tarifa estimada...
                      </span>
                    ) : tarifaEstimacion ? (
                      tarifaEstimacion.tarifaAplicada ? (
                        <span>
                          Tarifa estimada: <strong>${tarifaEstimacion.tarifaAplicada.costoTotal.toFixed(2)}</strong>
                          {typeof tarifaEstimacion.distanciaEstimadaKm === "number" && (
                            <> · Distancia aprox: {tarifaEstimacion.distanciaEstimadaKm.toFixed(2)} km</>
                          )}
                        </span>
                      ) : (
                        <span>No hay una tarifa configurada para la zona seleccionada.</span>
                      )
                    ) : (
                      <span>Selecciona un punto en el mapa para estimar el costo de envío.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cerrarModal} disabled={guardando}>
                Cancelar
              </Button>
              <Button onClick={guardarDireccion} disabled={guardando}>
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : modoEdicion ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
