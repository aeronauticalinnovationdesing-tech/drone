import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import {
  LayoutDashboard, Building2, BookMarked, Map, Users as UsersIcon, 
  FileCode, AlertCircle, Wrench, FileText, Calendar, Bot, 
  BookOpen, CreditCard
} from 'lucide-react';

export const PROFILES = [
  {
    id: 'drone_company',
    label: 'Empresa de Dron',
    description: 'Gestiona operaciones, equipo y reportes de tu empresa de drones',
    icon: Building2,
    color: 'from-indigo-500 to-purple-700',
    accent: '#6366f1',
    nav: [
       { icon: LayoutDashboard, label: 'Dashboard', path: '/Dashboard' },
       { icon: Building2, label: 'Empresa', path: '/CompanyManagement' },
       { icon: BookMarked, label: 'Bitácora RAC 100', path: '/FlightLogBookEnterprise' },
       { icon: Map, label: 'Misiones', path: '/Projects' },
       { icon: UsersIcon, label: 'Pilotos', path: '/PilotManagementEnterprise' },
       { icon: FileCode, label: 'Flota de Drones', path: '/DroneRegistryEnterprise' },
       { icon: AlertCircle, label: 'Reportes SMS', path: '/SMSReportingEnterprise' },
       { icon: Wrench, label: 'Pólizas', path: '/MaintenanceManagementEnterprise' },
       { icon: Map, label: 'Espacio Aéreo', path: '/AirspaceMapEnterprise' },
       { icon: FileText, label: 'Cumplimiento', path: '/ComplianceCenter' },
       { icon: Calendar, label: 'Calendario', path: '/Calendar' },
       { icon: FileText, label: 'Informes', path: '/Reports' },
       { icon: Bot, label: 'Secretaria IA', path: '/Secretary' },
       { icon: BookOpen, label: 'Cursos', path: '/Courses' },
       { icon: CreditCard, label: 'Suscripciones', path: '/Subscription' },
     ]
  }
];

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  // Forzamos el ID a drone_company desde el inicio
  const [activeProfileId, setActiveProfileId] = useState('drone_company');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      // Mantenemos drone_company como perfil activo forzado
      setActiveProfileId('drone_company');
    } catch (_) {
      // Incluso en error o sin auth, mantenemos la interfaz de empresa
      setActiveProfileId('drone_company');
    }
    setLoading(false);
  };

  const selectProfile = async (profileId) => {
    // Solo permitimos drone_company
    queryClientInstance.clear();
    setActiveProfileId('drone_company');
    try {
      await base44.auth.updateMe({ active_profile: 'drone_company' });
    } catch (_) {}
  };

  const activeProfile = PROFILES[0]; // Siempre es la primera (empresa)

  return (
    <ProfileContext.Provider value={{ activeProfile, activeProfileId, selectProfile, loading, profiles: PROFILES }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);