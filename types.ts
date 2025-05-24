
import { Feature, FeatureCollection, Geometry } from 'geojson';

export interface CountryProperties {
  name: string;
}

export type CountryFeature = Feature<Geometry, CountryProperties>;

export interface TopoJSONGeometry {
  type: string;
  arcs: number[][] | number[][][];
  id?: string | number;
  properties?: CountryProperties;
}

export interface TopoJSONData {
  type: string;
  objects: {
    [key: string]: {
      type: string;
      geometries: TopoJSONGeometry[];
    };
  };
  arcs: Array<[number, number][]>;
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
}

export type CountryNameMappings = Record<string, string>;

// For raw data from quizCapitals.ts (derived from code.txt)
export interface CapitalQuizEntry {
  country: string;
  city: string | null;
}

// For structured quiz questions
export interface QuizQuestion {
  countryName: string;
  capital: string;
  countryId: string; // To highlight on the map
  options: string[]; // Multiple choice options, including the correct capital
}
