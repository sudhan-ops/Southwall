import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { AppModule } from '../../types';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import Button from '../../components/ui/Button';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import ModuleFormModal from '../../components/admin/ModuleFormModal';
import GridSkeleton from '../../components/skeletons/GridSkeleton';

const ModuleManagement: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AppModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<AppModule | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getModules();
        setModules(data);
      } catch (e) {
        setToast({ message: 'Failed to load modules.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (moduleData: AppModule) => {
    const newModules = [...modules];
    const index = newModules.findIndex(m => m.id === moduleData.id);
    if (index > -1) {
      newModules[index] = moduleData;
    } else {
      newModules.push(moduleData);
    }

    try {
      await api.saveModules(newModules);
      setModules(newModules.sort((a, b) => a.name.localeCompare(b.name)));
      setToast({ message: `Module '${moduleData.name}' saved.`, type: 'success' });
      setIsFormOpen(false);
    } catch (e) {
      setToast({ message: 'Failed to save module.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!currentModule) return;
    const newModules = modules.filter(m => m.id !== currentModule.id);
    try {
      await api.saveModules(newModules);
      setModules(newModules);
      setToast({ message: `Module '${currentModule.name}' deleted.`, type: 'success' });
      setIsDeleteModalOpen(false);
    } catch (e) {
      setToast({ message: 'Failed to delete module.', type: 'error' });
    }
  };

  const handleSeedDefaults = async () => {
    setIsLoading(true);
    const DEFAULT_MODULES: AppModule[] = [
      {
        id: 'mod_admin',
        name: 'Admin & Access Control',
        description: 'Permissions for managing users, roles, and system modules.',
        permissions: ['manage_users', 'manage_roles_and_permissions', 'manage_modules']
      },
      {
        id: 'mod_billing',
        name: 'Billing & Costing',
        description: 'Permissions related to invoices and verification cost analysis.',
        permissions: ['view_invoice_summary', 'view_verification_costing']
        },
      {
        id: 'mod_dashboards',
        name: 'Dashboards & Tracking',
        description: 'Access to various dashboards and user activity tracking.',
        permissions: ['view_operations_dashboard', 'view_site_dashboard', 'view_field_officer_tracking']
      },
      {
        id: 'mod_self_service',
        name: 'Employee Self-Service',
        description: 'Basic permissions for all employees.',
        permissions: ['view_own_attendance', 'apply_for_leave', 'download_attendance_report']
      },
      {
        id: 'mod_hr_tasks',
        name: 'HR Tasks & Management',
        description: 'Manage leaves, policies, insurance, uniforms, and tasks.',
         permissions: ['manage_leave_requests', 'manage_policies', 'manage_insurance', 'manage_uniforms', 'manage_approval_workflow', 'view_all_attendance', 'manage_tasks']
      },
      {
         id: 'mod_office_staff',
         name: 'Office Staff',
         description: 'Office Staff permissions.',
         permissions: ['view_all_attendance', 'view_all_submissions']
      },
      {
        id: 'mod_org_setup',
        name: 'Organization & HR Setup',
        description: 'Manage sites, clients, and rules for enrollment and attendance.',
        permissions: ['view_entity_management', 'manage_attendance_rules', 'manage_enrollment_rules', 'manage_sites']
      },
      {
        id: 'mod_submissions',
        name: 'Submissions & Verification',
        description: 'View and manage employee onboarding submissions and approval workflows.',
        permissions: ['view_all_submissions', 'create_enrollment']
      },
      {
        id: 'mod_support',
        name: 'Support Desk',
        description: 'Access and manage support tickets.',
        permissions: ['access_support_desk']
      },
      {
        id: 'mod_system',
        name: 'System & Developer',
        description: 'Access developer settings and system configurations.',
        permissions: ['view_developer_settings']
      },
       {
        id: 'mod_ops',
        name: 'OPS',
        description: 'OPS Management.',
        permissions: ['manage_sites', 'manage_tasks']
      }
    ];

    try {
      await api.saveModules(DEFAULT_MODULES);
      setModules(DEFAULT_MODULES.sort((a, b) => a.name.localeCompare(b.name)));
      setToast({ message: 'Default modules seeded successfully.', type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ message: 'Failed to seed modules.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-0 shadow-none md:bg-card md:p-6 md:rounded-xl md:shadow-card">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <ModuleFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSave} initialData={currentModule} />
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title="Confirm Deletion">
        Are you sure you want to delete the module "{currentModule?.name}"?
      </Modal>

      <AdminPageHeader title="Module Management">
        <Button onClick={() => navigate('/admin/modules/add')}><Plus className="mr-2 h-4" /> Add Module</Button>
      </AdminPageHeader>

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-page/50">
            <Package className="h-12 w-12 text-muted mb-4" />
            <h3 className="text-lg font-semibold text-primary-text">No Modules Found</h3>
            <p className="text-muted max-w-sm mb-6">It looks like the system hasn't been initialized with modules yet.</p>
            <Button onClick={handleSeedDefaults} variant="accent">
                Initialize Default Modules
            </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            <div key={module.id} className="bg-page p-4 rounded-lg border border-border flex flex-col">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-5 w-5 text-accent" />
                  <h4 className="font-bold text-primary-text">{module.name}</h4>
                </div>
                <p className="text-sm text-muted mb-3">{module.description}</p>
                <p className="text-xs font-semibold text-muted">{module.permissions.length} permissions</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
                <Button variant="icon" onClick={() => { setCurrentModule(module); setIsFormOpen(true); }} title={`Edit ${module.name}`} className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><Edit className="h-5 w-5" /></Button>
                <Button variant="icon" onClick={() => { setCurrentModule(module); setIsDeleteModalOpen(true); }} title={`Delete ${module.name}`} className="p-2 hover:bg-red-500/10 rounded-full transition-colors"><Trash2 className="h-5 w-5 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleManagement;