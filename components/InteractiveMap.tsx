
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { GeoPath, GeoProjection, GeoPermissibleObjects } from 'd3-geo';
import { FeatureCollection, Feature } from 'geojson';
import { TopoJSONData, CountryFeature, CountryNameMappings } from '../types';

interface InteractiveMapProps {
  mapData: TopoJSONData;
  width: number;
  height: number;
  nameMappings: CountryNameMappings;
  highlightedCountryId?: string | null;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ mapData, width, height, nameMappings, highlightedCountryId }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const projectionRef = useRef<GeoProjection | null>(null);
  const pathGeneratorRef = useRef<GeoPath<any, any> | null>(null);
  const mapGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const countryPathsSelectionRef = useRef<d3.Selection<SVGPathElement, CountryFeature, SVGGElement, unknown> | null>(null);
  const initialScaleRef = useRef<number>(0);

  const [hoveredCountryInfo, setHoveredCountryInfo] = useState<{ id: string | null; name: string } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const countries = useMemo(() => {
    if (!mapData || !mapData.objects.countries) return null;
    try {
      return topojson.feature(mapData, mapData.objects.countries) as FeatureCollection<any, CountryFeature['properties']>;
    } catch (error) {
      console.error("Error processing TopoJSON data forMemo:", error);
      return null;
    }
  }, [mapData]);

  // Effect 1: Setup D3, draw static elements, initial countries, and interactions
  useEffect(() => {
    if (!svgRef.current || !mapData || !countries) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    initialScaleRef.current = Math.min(width, height) / 2.2;
    projectionRef.current = d3.geoOrthographic()
      .scale(initialScaleRef.current)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(0.1);

    pathGeneratorRef.current = d3.geoPath().projection(projectionRef.current);
    mapGroupRef.current = svg.append("g").attr("class", "map-group");

    mapGroupRef.current.append("path")
      .datum({ type: "Sphere" } as GeoPermissibleObjects)
      .attr("class", "ocean-sphere fill-slate-700 stroke-slate-600 stroke-[0.5px]") 
      .attr("d", pathGeneratorRef.current);

    const graticule = d3.geoGraticule10();
    mapGroupRef.current.append("path")
      .datum(graticule)
      .attr("class", "graticule-path stroke-slate-500 stroke-[0.3px] fill-none opacity-50") 
      .attr("d", pathGeneratorRef.current);

    countryPathsSelectionRef.current = mapGroupRef.current!
      .selectAll("path.country-path")
      .data(countries.features, (d: CountryFeature) => d.id || (d.properties?.name || Math.random().toString()))
      .join("path")
        .attr("class", "country-path stroke-[0.5px] transition-colors duration-100 ease-in-out fill-neutral-500 stroke-neutral-400") 
        .attr("aria-label", d => {
          const countryId = d.id?.toString();
          const englishName = d.properties?.name || "Unknown territory";
          return (countryId && nameMappings[countryId]) ? nameMappings[countryId] : englishName;
        })
        .on("mouseover", function(event, d) {
          const countryElement = d3.select(this);
          const countryIdStr = d.id?.toString() ?? null;
          
          countryElement.classed("stroke-2", true).raise();
          // If it's not the highlighted country, apply amber hover.
          // If it IS the highlighted country, it will keep its orange fill, and the stroke is handled below.
          if (countryIdStr !== highlightedCountryId) {
            countryElement.classed("fill-neutral-500", false).classed("fill-orange-500",false).classed("fill-amber-500", true);
          }
          // For ALL hovered countries (highlighted or not): remove neutral/orange stroke, apply amber stroke.
          countryElement.classed("stroke-neutral-400", false).classed("stroke-orange-300", false).classed("stroke-amber-300", true);

          const englishName = d.properties?.name || "Unknown";
          const displayName = (countryIdStr && nameMappings[countryIdStr]) ? nameMappings[countryIdStr] : englishName;
          setHoveredCountryInfo({ id: countryIdStr, name: displayName });
          
          const [x, y] = d3.pointer(event, svgRef.current);
          setTooltipPosition({ x: x + 15, y: y + 10 });
        })
        .on("mousemove", function(event) {
            if (!svgRef.current) return;
            const [x, y] = d3.pointer(event, svgRef.current);
            setTooltipPosition({ x: x + 15, y: y + 10 });
        })
        .on("mouseout", function(event, d) {
          const countryElement = d3.select(this);
          const countryIdStr = d.id?.toString() ?? null;
          
          countryElement.classed("stroke-2", false); // Remove thicker stroke from hover
          countryElement.classed("stroke-amber-300", false); // Always remove amber stroke from hover

          if (countryIdStr !== highlightedCountryId) {
            // Country is NOT the highlighted one, revert to neutral
            countryElement.classed("fill-amber-500", false).classed("fill-neutral-500", true);
            countryElement.classed("stroke-orange-300", false).classed("stroke-neutral-400", true); // Ensure orange stroke off, neutral on
          } else {
            // Country IS the highlighted one, restore its orange highlight
            countryElement
              .classed("fill-amber-500", false)   // Ensure hover fill is off
              .classed("fill-neutral-500", false) // Ensure default fill is off
              .classed("fill-orange-500", true)   // Ensure highlight fill is on
              // stroke-amber-300 was removed above
              .classed("stroke-neutral-400", false) // Ensure default stroke is off
              .classed("stroke-orange-300", true);  // Ensure highlight stroke is on
          }

          setHoveredCountryInfo(null);
          setTooltipPosition(null);
        });
    
    const dragHandler = d3.drag<SVGSVGElement, unknown>()
        .on("start", () => {
            if (svgRef.current) {
              d3.select(svgRef.current).interrupt("rotate"); 
            }
        })
        .on("drag", (event) => {
            if (!projectionRef.current || !pathGeneratorRef.current || !mapGroupRef.current) return;
            const r = projectionRef.current.rotate();
            const rToD = 180 / Math.PI;
            const deltaLambda = (event.dx / projectionRef.current.scale()) * rToD;
            const deltaPhi = (event.dy / projectionRef.current.scale()) * rToD;
            let newPhi = r[1] - deltaPhi;
            newPhi = Math.max(-88, Math.min(88, newPhi));
            projectionRef.current.rotate([r[0] + deltaLambda, newPhi, 0]);
            mapGroupRef.current.selectAll("path").attr("d", (d: unknown) => pathGeneratorRef.current!(d as GeoPermissibleObjects));
        });
    svg.call(dragHandler);

    const zoomHandler = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        if (!projectionRef.current || !pathGeneratorRef.current || !mapGroupRef.current) return;
        projectionRef.current.scale(initialScaleRef.current * event.transform.k);
        mapGroupRef.current.selectAll("path").attr("d", (d: unknown) => pathGeneratorRef.current!(d as GeoPermissibleObjects));
      });
    svg.call(zoomHandler);
    svg.call(zoomHandler.transform, d3.zoomIdentity);

    if (!countries || countries.features.length === 0) {
        svg.selectAll("*").remove();
        svg.append("text")
           .attr("x", width / 2).attr("y", height / 2)
           .attr("text-anchor", "middle").attr("fill", "red")
           .text(!mapData ? "Loading map data..." : "No map features to display.");
    }
  }, [mapData, width, height, countries, nameMappings, highlightedCountryId]); // Added highlightedCountryId to re-run if it changes while hovered

  // Effect 2: Update country styles when highlightedCountryId changes
  useEffect(() => {
    if (!countryPathsSelectionRef.current) return;

    countryPathsSelectionRef.current.each(function(d) {
      const countryElement = d3.select(this);
      const isHighlighted = d.id?.toString() === highlightedCountryId;
      const isHoveredFill = countryElement.classed('fill-amber-500'); // Check if currently amber from hover
      const isHoveredStroke = countryElement.classed('stroke-amber-300');
      
      countryElement
        .classed('fill-orange-500', isHighlighted) 
        .classed('stroke-orange-300', isHighlighted) 
        // If not highlighted AND not currently amber (hovered), then set to neutral.
        // This prevents overriding an active hover when highlight changes elsewhere.
        .classed('fill-neutral-500', !isHighlighted && !isHoveredFill) 
        .classed('stroke-neutral-400', !isHighlighted && !isHoveredStroke);
      
      if (isHighlighted) {
        countryElement.raise(); 
      }
    });
  }, [highlightedCountryId]);

  // Effect 3: Auto-centering on highlightedCountryId change
  useEffect(() => {
    if (!highlightedCountryId || !countries || !projectionRef.current || !pathGeneratorRef.current || !mapGroupRef.current || !svgRef.current) {
      return;
    }

    const countryFeature = countries.features.find(f => f.id?.toString() === highlightedCountryId);
    if (!countryFeature) {
        console.warn(`Country with ID ${highlightedCountryId} not found for centering.`);
        return;
    }
    
    const validGeoJsonFeature = countryFeature as Feature<any,any>; 
    if (!validGeoJsonFeature.geometry) {
        console.warn(`Country with ID ${highlightedCountryId} has no geometry for centering.`);
        return;
    }

    const centroid = d3.geoCentroid(validGeoJsonFeature);
    if (isNaN(centroid[0]) || isNaN(centroid[1])) {
        console.warn(`Centroid calculation failed for country ID ${highlightedCountryId}.`);
        return;
    }
    const targetRotation: [number, number, number] = [-centroid[0], -centroid[1], 0];

    d3.select(svgRef.current)
      .transition("rotate") 
      .duration(750)
      .tween("rotate", () => {
        if (!projectionRef.current || !pathGeneratorRef.current || !mapGroupRef.current) return () => {}; 
        
        const currentRotation = projectionRef.current.rotate();
        const rInterpolator = d3.interpolate(currentRotation, targetRotation);

        return (t: number) => {
          if (projectionRef.current && pathGeneratorRef.current && mapGroupRef.current) {
            projectionRef.current.rotate(rInterpolator(t));
            mapGroupRef.current.selectAll("path").attr("d", (d: unknown) => pathGeneratorRef.current!(d as GeoPermissibleObjects));
          }
        };
      });

  }, [highlightedCountryId, countries]); 

  return (
    <div className="relative rounded-xl shadow-2xl overflow-hidden border border-slate-700 bg-slate-900/30 backdrop-blur-sm">
      <svg ref={svgRef} width={width} height={height} aria-label="Interactive 3D world globe">
      </svg>
      {hoveredCountryInfo && tooltipPosition && (
        <div
          className="absolute bg-neutral-800 text-neutral-100 text-sm px-3 py-1.5 rounded-md shadow-xl pointer-events-none transition-opacity duration-100"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            opacity: 1,
            border: '1px solid #404040' // neutral-600
          }}
          role="tooltip"
          aria-live="polite"
        >
          {hoveredCountryInfo.name}
        </div>
      )}
       <div className="absolute bottom-4 right-4 bg-neutral-800/70 backdrop-blur-sm p-2 rounded shadow text-xs text-neutral-300 pointer-events-none">
         Drag to rotate. Zoom with scroll wheel.
       </div>
    </div>
  );
};

export default InteractiveMap;
