import React from 'react';
import { 
  Layers, Globe, Database, Server, CheckCircle2, 
  RefreshCcw, ShieldCheck, MapPin, ExternalLink
} from 'lucide-react';

export const CadastralLayersView = () => {
  const layerList = [
    {
      id: 'LYR-01',
      name: 'TamilNilam Cadastral Boundaries (FMB Vectors)',
      store: 'PostGIS (land_db)',
      workspace: 'geonode:salem_parcels',
      crs: 'EPSG:4326 (WGS 84)',
      featuresCount: '12,480 Polygons',
      status: 'WMS_ONLINE',
      endpoint: '/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=geonode:salem_parcels',
    },
    {
      id: 'LYR-02',
      name: 'Copernicus Sentinel-2 L2A Ingest (NDVI & Built-Up Delta)',
      store: 'GeoTIFF / Raster Pyramids',
      workspace: 'geonode:sentinel2_salem_delta',
      crs: 'EPSG:32644 (UTM Zone 44N)',
      featuresCount: '4 Rasters (Bands 02, 03, 04, 08)',
      status: 'WMS_ONLINE',
      endpoint: '/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=geonode:sentinel2_salem_delta',
    },
    {
      id: 'LYR-03',
      name: 'TNeGA Waterbody & PWD Drainage Drainage Network',
      store: 'PostGIS (land_db)',
      workspace: 'geonode:pwd_waterways',
      crs: 'EPSG:4326 (WGS 84)',
      featuresCount: '1,420 Lines / Polygons',
      status: 'WMS_ONLINE',
      endpoint: '/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=geonode:pwd_waterways',
    },
    {
      id: 'LYR-04',
      name: 'Revenue Jurisdiction Boundaries (Taluk & Village Limits)',
      store: 'PostGIS (land_db)',
      workspace: 'geonode:salem_admin_boundaries',
      crs: 'EPSG:4326 (WGS 84)',
      featuresCount: '315 Taluks, 1,768 Villages',
      status: 'WMS_ONLINE',
      endpoint: '/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=geonode:salem_admin_boundaries',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> GIS Operations Core
            </span>
            <span className="text-[11px] text-slate-500 font-mono">GEOSERVER & POSTGIS INFRASTRUCTURE</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Cadastral Layers & Spatial Telemetry Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            GeoServer WMS/WFS map services, PostGIS cadastral polygon integrity, and Sentinel-2 automated ingest pipelines for the Salem pilot zone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Map Layers</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{layerList.length}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">100% WMS Service Availability</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GeoServer Instance</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">HEALTHY</p>
          <p className="text-[11px] text-slate-500 mt-1">Port 8080 / Container: land_geoserver</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vector Geometry Check</span>
          <p className="text-2xl font-black text-slate-900 mt-2">VALID</p>
          <p className="text-[11px] text-slate-500 mt-1">Zero self-intersections in FMB parcel polygons</p>
        </div>
      </div>

      {/* Layer Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-600" />
            <span>Configured WMS Spatial Layers</span>
          </h2>
          <span className="text-xs text-slate-500">{layerList.length} Connected Layers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Layer Name</th>
                <th className="py-3 px-4">Workspace / Layer</th>
                <th className="py-3 px-4">Data Store</th>
                <th className="py-3 px-4">CRS</th>
                <th className="py-3 px-4">Features / Extent</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {layerList.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{l.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {l.id}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{l.workspace}</td>
                  <td className="py-3.5 px-4 text-slate-600">{l.store}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{l.crs}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{l.featuresCount}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ONLINE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CadastralLayersView;
