
import { TopoJSONData } from '../types';

const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export const fetchWorldMapData = async (): Promise<TopoJSONData> => {
  const response = await fetch(TOPOJSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch map data: ${response.statusText}`);
  }
  const data = await response.json() as TopoJSONData;
  return data;
};
