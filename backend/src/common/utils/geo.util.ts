// Aquí concentro utilidades geoespaciales: parseo de geometrías, punto-en-polígono, centroide y distancias.
export interface GeoPoint {
  latitud: number;
  longitud: number;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

type SupportedGeometry = GeoJsonPolygon | GeoJsonMultiPolygon;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isCoordinatePair = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  isNumber(value[0]) &&
  isNumber(value[1]);

const isRingValid = (ring: number[][]): boolean =>
  Array.isArray(ring) && ring.length >= 4;

// Aquí aplico el algoritmo ray casting para determinar si un punto cae dentro de un anillo.
const isPointInRing = (point: GeoPoint, ring: number[][]): boolean => {
  if (!isRingValid(ring)) {
    return false;
  }

  let inside = false;
  const x = point.longitud;
  const y = point.latitud;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
};

const isPointInPolygonCoordinates = (
  point: GeoPoint,
  polygon: number[][][],
): boolean => {
  if (!Array.isArray(polygon) || polygon.length === 0) {
    return false;
  }

  // Primer anillo = contorno exterior
  const [outerRing, ...holes] = polygon;

  if (!isPointInRing(point, outerRing)) {
    return false;
  }

  // Si el punto cae en alguno de los huecos, se considera fuera
  for (const hole of holes) {
    if (isPointInRing(point, hole)) {
      return false;
    }
  }

  return true;
};

export const parseSupportedGeometry = (
  geometry: unknown,
): SupportedGeometry | null => {
  // Aquí valido y normalizo únicamente Polygon y MultiPolygon del estándar GeoJSON.
  if (!geometry || typeof geometry !== 'object') {
    return null;
  }

  const tipo = (geometry as { type?: unknown }).type;

  if (tipo === 'Polygon') {
    const coords = (geometry as { coordinates?: unknown }).coordinates;
    if (
      Array.isArray(coords) &&
      coords.every(
        (ring) =>
          Array.isArray(ring) && ring.every((pair) => isCoordinatePair(pair)),
      )
    ) {
      return {
        type: 'Polygon',
        coordinates: coords as number[][][],
      };
    }
  }

  if (tipo === 'MultiPolygon') {
    const coords = (geometry as { coordinates?: unknown }).coordinates;
    if (
      Array.isArray(coords) &&
      coords.every(
        (polygon) =>
          Array.isArray(polygon) &&
          polygon.every(
            (ring) =>
              Array.isArray(ring) &&
              ring.every((pair) => isCoordinatePair(pair)),
          ),
      )
    ) {
      return {
        type: 'MultiPolygon',
        coordinates: coords as number[][][][],
      };
    }
  }

  return null;
};

export const isPointInsideGeometry = (
  point: GeoPoint,
  geometry: unknown,
): boolean => {
  // Aquí determino si un punto (lat/lon) está contenido en la geometría soportada.
  if (!geometry) {
    return false;
  }

  const supportedGeometry = parseSupportedGeometry(geometry);

  if (!supportedGeometry) {
    return false;
  }

  if (supportedGeometry.type === 'Polygon') {
    return isPointInPolygonCoordinates(point, supportedGeometry.coordinates);
  }

  return supportedGeometry.coordinates.some((polygon) =>
    isPointInPolygonCoordinates(point, polygon),
  );
};

const centroideDeRing = (ring: number[][]): GeoPoint | null => {
  if (!isRingValid(ring)) {
    return null;
  }

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const factor = x0 * y1 - x1 * y0;
    area += factor;
    cx += (x0 + x1) * factor;
    cy += (y0 + y1) * factor;
  }

  area *= 0.5;

  if (Math.abs(area) < Number.EPSILON) {
    return null;
  }

  const factor = 1 / (6 * area);
  return {
    longitud: cx * factor,
    latitud: cy * factor,
  };
};

export const calcularCentroide = (geometry: unknown): GeoPoint | null => {
  // Aquí calculo el centroide aproximado ponderando por el área del contorno exterior.
  const supportedGeometry = parseSupportedGeometry(geometry);

  if (!supportedGeometry) {
    return null;
  }

  const acumulado = {
    sumaX: 0,
    sumaY: 0,
    sumaArea: 0,
  };

  const acumular = (polygon: number[][][]) => {
    const [outer] = polygon;
    if (!outer) {
      return;
    }
    const centroide = centroideDeRing(outer);
    if (!centroide) {
      return;
    }

    let area = 0;
    for (let i = 0, j = outer.length - 1; i < outer.length; j = i++) {
      const [x0, y0] = outer[j];
      const [x1, y1] = outer[i];
      area += x0 * y1 - x1 * y0;
    }
    area = Math.abs(area) / 2;

    acumulado.sumaArea += area;
    acumulado.sumaX += centroide.longitud * area;
    acumulado.sumaY += centroide.latitud * area;
  };

  if (supportedGeometry.type === 'Polygon') {
    acumular(supportedGeometry.coordinates);
  } else {
    supportedGeometry.coordinates.forEach(acumular);
  }

  if (acumulado.sumaArea === 0) {
    return null;
  }

  return {
    longitud: acumulado.sumaX / acumulado.sumaArea,
    latitud: acumulado.sumaY / acumulado.sumaArea,
  };
};

export const distanciaHaversineKm = (
  origen: GeoPoint,
  destino: GeoPoint,
): number => {
  // Aquí implemento Haversine para obtener la distancia esférica entre dos puntos en kilómetros.
  const R = 6371; // Radio de la Tierra en km
  const toRad = (valor: number) => (valor * Math.PI) / 180;

  const dLat = toRad(destino.latitud - origen.latitud);
  const dLon = toRad(destino.longitud - origen.longitud);

  const lat1 = toRad(origen.latitud);
  const lat2 = toRad(destino.latitud);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000) / 1000; // redondeo a metros
};
