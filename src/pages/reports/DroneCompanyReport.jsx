import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import {
  Download, Loader2, Building2, Users, Plane, Shield, Wrench, 
  AlertTriangle, CheckCircle, TrendingUp, BarChart3, Activity
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const captureEl = async (ref) => {
  if (!ref?.current) return null;
  try {
    const canvas = await html2canvas(ref.current, {
      backgroundColor: "#ffffff", scale: 2, logging: false, useCORS: true,
    });
    return canvas.toDataURL("image/png");
  } catch { return null; }
};

const pdfSec = (doc, title, color, M, y, PH) => {
  if (y + 20 > PH - 18) { doc.addPage(); y = 30; }
  doc.setFillColor(...color);
  doc.rect(M, y, 3, 9, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, M + 7, y + 6.5);
  return y + 14;
};

const kpiBox = (doc, label, val, sub, color, kx, ky, kW, kH) => {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kx, ky, kW, kH, 3, 3, "F");
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(kx + 3, ky + 3, kx + 3, ky + kH - 3);
  doc.setLineWidth(0.2);
  doc.setTextColor(...color);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(String(val), kx + 8, ky + 10);
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text(label, kx + 8, ky + 16);
  doc.setTextColor(130, 130, 130);
  doc.setFont("helvetica", "normal");
  doc.text(sub, kx + 8, ky + 20.5);
};

export default function DroneCompanyReport() {
  const [generating, setGenerating] = useState(false);
  const user = useCurrentUser();

  // ── Data queries ──
  const { data: company = null } = useQuery({
    queryKey: ["company", user?.email],
    queryFn: async () => {
      const results = await base44.entities.Company.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!user,
  });

  const { data: pilots = [] } = useQuery({
    queryKey: ["pilots-company", user?.email],
    queryFn: () => base44.entities.Pilot.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: drones = [] } = useQuery({
    queryKey: ["drones-company", user?.email],
    queryFn: () => base44.entities.Drone.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: flights = [] } = useQuery({
    queryKey: ["flights-company", user?.email],
    queryFn: () => base44.entities.FlightLog.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ["maintenance-company", user?.email],
    queryFn: () => base44.entities.DroneMaintenanceLog.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: smsReports = [] } = useQuery({
    queryKey: ["sms-company", user?.email],
    queryFn: () => base44.entities.SMSReport.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: audits = [] } = useQuery({
    queryKey: ["audits-company", user?.email],
    queryFn: () => base44.entities.InternalAudit.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: filings = [] } = useQuery({
    queryKey: ["filings-company", user?.email],
    queryFn: () => base44.entities.AerocivialFiling.filter({ created_by: user.email }),
    enabled: !!user,
  });

  // ── Métricas ──
  const activePilots = pilots.filter(p => p.status === "activo").length;
  const dronesOperative = drones.filter(d => d.maintenance_status === "operativo").length;
  const totalFlightHours = drones.reduce((s, d) => s + (d.flight_hours || 0), 0);
  const totalFlights = flights.length;
  const incidents = smsReports.filter(r => r.incident_reported).length;
  
  const today = new Date();
  const criticalPilots = pilots.filter(p => p.rac_100_expiry_date && differenceInDays(new Date(p.rac_100_expiry_date), today) <= 30).length;
  const criticalDrones = drones.filter(d => d.registration_expiry && differenceInDays(new Date(d.registration_expiry), today) <= 30).length;

  // Charts data
  const refPilotStatus = useRef(null);
  const refDroneStatus = useRef(null);
  const refFlightActivity = useRef(null);
  const refActivityType = useRef(null);
  const refAreaType = useRef(null);
  const refMaintenanceType = useRef(null);

  const pilotStatusData = [
    { name: "Activos", value: pilots.filter(p => p.status === "activo").length },
    { name: "Inactivos", value: pilots.filter(p => p.status === "inactivo").length },
    { name: "Suspendidos", value: pilots.filter(p => p.status === "suspendido").length },
  ].filter(d => d.value > 0);

  const droneStatusData = [
    { name: "Operativos", value: drones.filter(d => d.maintenance_status === "operativo").length },
    { name: "Mantenimiento", value: drones.filter(d => d.maintenance_status === "en_mantenimiento").length },
    { name: "No Operativos", value: drones.filter(d => d.maintenance_status === "no_operativo").length },
  ].filter(d => d.value > 0);

  // Monthly flights
  const flightsByMonth = {};
  flights.forEach(f => {
    if (!f.date) return;
    const m = format(new Date(f.date), "MMM", { locale: es });
    flightsByMonth[m] = (flightsByMonth[m] || 0) + 1;
  });
  const flightActivityData = Object.entries(flightsByMonth).map(([mes, count]) => ({ mes, vuelos: count }));

  const activityTypeData = [
    { name: "Fotografía", value: flights.filter(f => f.activity_type === "fotografia_aerea").length },
    { name: "Mapeo", value: flights.filter(f => f.activity_type === "mapeo_fotogrametria").length },
    { name: "Inspección", value: flights.filter(f => f.activity_type === "inspeccion_infraestructura").length },
    { name: "Vigilancia", value: flights.filter(f => f.activity_type === "vigilancia_seguridad").length },
    { name: "Otro", value: flights.filter(f => !["fotografia_aerea", "mapeo_fotogrametria", "inspeccion_infraestructura", "vigilancia_seguridad"].includes(f.activity_type)).length },
  ].filter(d => d.value > 0);

  const areaTypeData = [
    { name: "Rural", value: flights.filter(f => f.area_type === "rural").length },
    { name: "Suburbana", value: flights.filter(f => f.area_type === "suburbana").length },
    { name: "Urbana", value: flights.filter(f => f.area_type === "urbana").length },
  ].filter(d => d.value > 0);

  const maintenanceTypeData = [
    { name: "Preventivo", value: maintenance.filter(m => m.maintenance_type === "preventivo").length },
    { name: "Correctivo", value: maintenance.filter(m => m.maintenance_type === "correctivo").length },
  ].filter(d => d.value > 0);

  // ── Generar PDF ──
  const generatePDF = async () => {
    setGenerating(true);

    const [imgPilot, imgDrone, imgFlight, imgActivity, imgArea, imgMaintenance] = await Promise.all([
      captureEl(refPilotStatus),
      captureEl(refDroneStatus),
      captureEl(refFlightActivity),
      captureEl(refActivityType),
      captureEl(refAreaType),
      captureEl(refMaintenanceType),
    ]);

    const ctx = `
EMPRESA DE DRONES – INFORME OPERACIONAL RAC 100
Fecha: ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
Empresa: ${company?.name || "N/A"}
NIT: ${company?.nit || "N/A"}
Certificación: ${company?.aac_cert_number || "N/A"} (Vence: ${company?.aac_cert_expiry || "N/A"})

EQUIPO HUMANO (${pilots.length} total, ${activePilots} activos):
- Pilotos certificados RAC 100
- ${criticalPilots} pilotos con certificación próxima a vencer
- Horas totales: ${pilots.reduce((s, p) => s + (p.hours_flown || 0), 0)}h

FLOTA DE DRONES (${drones.length} total, ${dronesOperative} operativos):
- Drones con registro próximo a vencer: ${criticalDrones}
- Horas totales flota: ${totalFlightHours}h
- Drones en mantenimiento: ${drones.filter(d => d.maintenance_status === "en_mantenimiento").length}

OPERACIONES DE VUELO:
- Vuelos totales: ${totalFlights}
- Incidentes reportados: ${incidents}
- Tasa de incidentes: ${totalFlights > 0 ? ((incidents / totalFlights) * 100).toFixed(1) : 0}%

AUDITORÍAS INTERNAS:
- Total auditorías: ${audits.length}
- Hallazgos pendientes: ${audits.reduce((s, a) => s + (a.findings?.filter(f => f.status !== "cerrado").length || 0), 0)}

RADICADOS AEROCIVIL:
- Total radicados: ${filings.length}
- Pendientes de resolución: ${filings.filter(f => !["aprobado", "rechazado"].includes(f.status)).length}
`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un experto en operaciones de drones bajo RAC 100. Con estos datos reales de operación empresarial, genera un análisis ejecutivo en 5 secciones de texto plano:

1. RESUMEN OPERACIONAL: estado general de la flota y personal
2. COMPLIANCE RAC 100: evaluación de cumplimiento regulatorio
3. SEGURIDAD Y SMS: análisis de incidentes y tendencias
4. MANTENIMIENTO Y FLOTA: estado de drones y operatividad
5. RECOMENDACIONES: acciones prioritarias para próximos 30 días

Datos:\n${ctx}`,
      model: "claude_sonnet_4_6",
    });

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M = 16;
    const CW = PW - M * 2;
    let y = 0;

    const checkY = (n = 15) => { if (y + n > PH - 18) { doc.addPage(); y = 30; } };
    const addImg = (img, w, h, cx = false) => {
      checkY(h + 4);
      const ix = cx ? M + (CW - w) / 2 : M;
      doc.addImage(img, "PNG", ix, y, w, h);
      y += h + 5;
    };

    // ─── PORTADA ───
    doc.setFillColor(10, 20, 40);
    doc.rect(0, 0, PW, PH, "F");
    doc.setFillColor(14, 165, 233);
    doc.rect(0, PH * 0.52, PW, 6, "F");
    doc.circle(PW / 2, PH * 0.30, 18, "F");
    doc.setFillColor(10, 20, 40);
    doc.circle(PW / 2, PH * 0.30, 12, "F");
    doc.setFillColor(14, 165, 233);
    doc.circle(PW / 2, PH * 0.30, 4, "F");

    doc.setTextColor(14, 165, 233);
    doc.setFontSize(34);
    doc.setFont("helvetica", "bold");
    doc.text("VEXNY", PW / 2, PH * 0.44, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "normal");
    doc.text("Informe Operacional de Empresa", PW / 2, PH * 0.44 + 13, { align: "center" });
    doc.setTextColor(180, 200, 220);
    doc.setFontSize(10);
    doc.text(company?.name || "Empresa de Drones", PW / 2, PH * 0.44 + 23, { align: "center" });
    doc.text(format(new Date(), "d 'de' MMMM yyyy", { locale: es }), PW / 2, PH * 0.44 + 32, { align: "center" });
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(7.5);
    doc.text("CONFIDENCIAL · Generado automáticamente con IA", PW / 2, PH - 20, { align: "center" });

    // ─── PÁGINA 2: KPIs ───
    doc.addPage(); y = 30;
    doc.setFillColor(10, 20, 40);
    doc.rect(0, 0, PW, 26, "F");
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 23, PW, 3, "F");
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN OPERACIONAL EJECUTIVO", M, 20);

    const kpis = [
      { label: "Pilotos Activos", val: `${activePilots}/${pilots.length}`, sub: "certificados", c: [14, 165, 233] },
      { label: "Drones Operativos", val: `${dronesOperative}/${drones.length}`, sub: "flota disponible", c: [16, 185, 129] },
      { label: "Horas Flota", val: `${totalFlightHours}h`, sub: "total acumulado", c: [245, 158, 11] },
      { label: "Vuelos Realizados", val: totalFlights, sub: "últimos 12 meses", c: [139, 92, 246] },
      { label: "Incidentes", val: incidents, sub: `${totalFlights > 0 ? ((incidents / totalFlights) * 100).toFixed(1) : 0}% tasa`, c: incidents > 0 ? [239, 68, 68] : [16, 185, 129] },
      { label: "Alertas Críticas", val: criticalPilots + criticalDrones, sub: "documentos ≤30d", c: (criticalPilots + criticalDrones) > 0 ? [239, 68, 68] : [16, 185, 129] },
    ];

    const kW = (CW - 10) / 3;
    const kH = 28;
    kpis.forEach((k, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      kpiBox(doc, k.label, k.val, k.sub, k.c, M + col * (kW + 5), y + row * (kH + 5), kW, kH);
    });
    y += kH * 2 + 20;

    // ─── ANÁLISIS IA ───
    checkY(30);
    y = pdfSec(doc, "Análisis Operacional Estratégico (IA)", [14, 165, 233], M, y, PH);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const aiText = typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult);
    const aiLines = doc.splitTextToSize(aiText, CW);
    aiLines.forEach(line => {
      checkY(5.5);
      const trimmed = line.trim();
      const isTitle = /^\d+\.\s+[A-ZÁÉÍÓÚ]/.test(trimmed);
      if (isTitle) {
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(14, 165, 233);
        doc.setFontSize(8.5);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(45, 45, 45);
        doc.setFontSize(8);
      }
      doc.text(line, M, y);
      y += 5;
    });
    y += 10;

    // ─── GRÁFICAS ───
    checkY(20);
    y = pdfSec(doc, "Análisis Visual de Operaciones", [14, 165, 233], M, y, PH);

    // 2 gráficas lado a lado
    if (imgPilot || imgDrone) {
      checkY(55);
      const halfW = (CW - 6) / 2;
      const imgH = 45;
      if (imgPilot) doc.addImage(imgPilot, "PNG", M, y, halfW, imgH);
      if (imgDrone) doc.addImage(imgDrone, "PNG", M + halfW + 6, y, halfW, imgH);
      y += imgH + 7;
    }

    if (imgFlight) { addImg(imgFlight, CW, 45); }
    
    // 3 gráficas
    if (imgActivity || imgArea || imgMaintenance) {
      checkY(55);
      const thirdW = (CW - 8) / 3;
      if (imgActivity) doc.addImage(imgActivity, "PNG", M, y, thirdW, 40);
      if (imgArea) doc.addImage(imgArea, "PNG", M + thirdW + 3, y, thirdW, 40);
      if (imgMaintenance) doc.addImage(imgMaintenance, "PNG", M + (thirdW + 3) * 2, y, thirdW, 40);
      y += 45;
    }

    // ─── PILOTOS ───
    checkY(20);
    y = pdfSec(doc, "Equipo de Pilotos (Primeros 20)", [14, 165, 233], M, y, PH);
    if (pilots.length > 0) {
      const pHdrs = ["Piloto", "Categoría", "Horas", "Vence", "Estado"];
      const pCols = [50, 28, 18, 22, 22];
      doc.setFillColor(10, 20, 40);
      doc.rect(M, y, CW, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      let cx = M + 3;
      pHdrs.forEach((h, i) => { doc.text(h, cx, y + 5); cx += pCols[i]; });
      y += 7;

      const catLabel = { operador_remoto: "Op. Remoto", piloto_basico: "Básico", piloto_avanzado: "Avanzado" };
      pilots.slice(0, 20).forEach((p, idx) => {
        checkY(7);
        const expDate = p.rac_100_expiry_date ? new Date(p.rac_100_expiry_date) : null;
        const daysLeft = expDate ? differenceInDays(expDate, today) : 999;
        const expired = daysLeft < 0;
        doc.setFillColor(expired ? 255 : idx % 2 === 0 ? 247 : 255, expired ? 235 : idx % 2 === 0 ? 249 : 255, expired ? 235 : idx % 2 === 0 ? 252 : 255);
        doc.rect(M, y, CW, 6.5, "F");
        cx = M + 3;
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const stColor = p.status === "activo" ? [16, 185, 129] : p.status === "suspendido" ? [239, 68, 68] : [100, 116, 139];
        const rows = [
          p.full_name || "-",
          catLabel[p.license_category] || "-",
          `${p.hours_flown || 0}h`,
          p.rac_100_expiry_date ? format(new Date(p.rac_100_expiry_date), "dd/MM/yy") : "-",
          p.status || "-",
        ];
        rows.forEach((cell, i) => {
          if (i === 4) doc.setTextColor(...stColor);
          else doc.setTextColor(40, 40, 40);
          doc.text(String(cell), cx, y + 4.5);
          cx += pCols[i];
        });
        y += 6.5;
      });
      y += 10;
    }

    // ─── DRONES ───
    checkY(20);
    y = pdfSec(doc, "Flota de Drones (Primeros 20)", [16, 185, 129], M, y, PH);
    if (drones.length > 0) {
      const dHdrs = ["Modelo", "Serie", "Estado", "Horas", "Registro Vence"];
      const dCols = [40, 35, 25, 18, 30];
      doc.setFillColor(10, 20, 40);
      doc.rect(M, y, CW, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      let cx = M + 3;
      dHdrs.forEach((h, i) => { doc.text(h, cx, y + 5); cx += dCols[i]; });
      y += 7;

      const stColors = { operativo: [16, 185, 129], en_mantenimiento: [245, 158, 11], no_operativo: [239, 68, 68] };
      const stLabels = { operativo: "Operativo", en_mantenimiento: "Mantenimiento", no_operativo: "No Operativo" };
      drones.slice(0, 20).forEach((d, idx) => {
        checkY(7);
        doc.setFillColor(idx % 2 === 0 ? 247 : 255, idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 252 : 255);
        doc.rect(M, y, CW, 6.5, "F");
        cx = M + 3;
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const sc = stColors[d.maintenance_status] || [100, 116, 139];
        const rows = [
          d.model || "-",
          d.serial_number || "-",
          stLabels[d.maintenance_status] || "-",
          `${d.flight_hours || 0}h`,
          d.registration_expiry ? format(new Date(d.registration_expiry), "dd/MM/yy") : "-",
        ];
        rows.forEach((cell, i) => {
          if (i === 2) doc.setTextColor(...sc);
          else doc.setTextColor(40, 40, 40);
          doc.text(String(cell), cx, y + 4.5);
          cx += dCols[i];
        });
        y += 6.5;
      });
      y += 10;
    }

    // ─── FOOTER ───
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFillColor(10, 20, 40);
      doc.rect(0, PH - 12, PW, 12, "F");
      doc.setFillColor(14, 165, 233);
      doc.rect(0, PH - 12, PW, 2, "F");
      doc.setTextColor(140, 160, 180);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("VEXNY · Informe Operacional Empresa · RAC 100 Colombia · Confidencial", M, PH - 4);
      doc.setTextColor(14, 165, 233);
      doc.text(`Pág. ${i} / ${total}`, PW - M, PH - 4, { align: "right" });
    }

    doc.save(`informe-empresa-dron-vexny-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    setGenerating(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Informe Empresa</h1>
            <p className="text-sm text-muted-foreground">{company?.name || "Empresa de Drones"}</p>
          </div>
        </div>
        <Button onClick={generatePDF} disabled={generating} size="lg" className="gap-2 bg-sky-600 hover:bg-sky-700">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {generating ? "Generando..." : "Descargar PDF Completo"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <Users className="w-5 h-5 text-sky-500 mb-2" />
          <div className="text-lg font-bold">{activePilots}/{pilots.length}</div>
          <div className="text-xs text-muted-foreground">Pilotos activos</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <Plane className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-lg font-bold">{dronesOperative}/{drones.length}</div>
          <div className="text-xs text-muted-foreground">Drones operativos</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <Activity className="w-5 h-5 text-purple-500 mb-2" />
          <div className="text-lg font-bold">{totalFlightHours}h</div>
          <div className="text-xs text-muted-foreground">Horas flota</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-lg font-bold">{totalFlights}</div>
          <div className="text-xs text-muted-foreground">Vuelos registrados</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <AlertTriangle className={`w-5 h-5 mb-2 ${incidents > 0 ? "text-red-500" : "text-green-500"}`} />
          <div className="text-lg font-bold">{incidents}</div>
          <div className="text-xs text-muted-foreground">Incidentes</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <CheckCircle className={`w-5 h-5 mb-2 ${criticalPilots + criticalDrones > 0 ? "text-red-500" : "text-green-500"}`} />
          <div className="text-lg font-bold">{criticalPilots + criticalDrones}</div>
          <div className="text-xs text-muted-foreground">Alertas críticas</div>
        </div>
      </div>

      {/* Charts section */}
      <div className="space-y-6">
        {pilotStatusData.length > 0 && (
          <div ref={refPilotStatus} className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Estado Pilotos</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pilotStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pilotStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {droneStatusData.length > 0 && (
          <div ref={refDroneStatus} className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Estado Drones</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={droneStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {droneStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {flightActivityData.length > 0 && (
          <div ref={refFlightActivity} className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Vuelos por Mes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={flightActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="vuelos" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activityTypeData.length > 0 && (
          <div ref={refActivityType} className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Tipos de Actividad</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={activityTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {activityTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {areaTypeData.length > 0 && (
          <div ref={refAreaType} className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Áreas de Operación</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={areaTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {maintenanceTypeData.length > 0 && (
          <div ref={refMaintenanceType} className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Tipo de Mantenimiento</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={maintenanceTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {maintenanceTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}