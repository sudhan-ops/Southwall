import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { Plus, Edit, Trash2, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Modal from '../../components/ui/Modal';
import CompleteTaskForm from '../../components/tasks/CompleteTaskForm';
import type { Task, EscalationStatus, TaskPriority, TaskStatus, User } from '../../types';
import { api } from '../../services/api';
import { format, addDays } from 'date-fns';
import { useThemeStore } from '../../store/themeStore';
import { useBrandingStore } from '../../store/brandingStore';
import { getThemeColors } from '../../utils/themeUtils';
import Select from '../../components/ui/Select';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const getNextDueDateInfo = (task: Task): { date: string | null; isOverdue: boolean } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = (dateStr: string | null | undefined) => dateStr ? new Date(dateStr) : null;

    if (task.status === 'Done' || !task.dueDate) {
        return { date: task.dueDate ? format(parseDate(task.dueDate)!, 'dd MMM, yyyy') : '-', isOverdue: false };
    }

    let nextDueDate: Date | null = null;
    const baseDueDate = parseDate(task.dueDate)!;

    switch (task.escalationStatus) {
        case 'None':
            nextDueDate = task.escalationLevel1DurationDays ? addDays(baseDueDate, task.escalationLevel1DurationDays) : baseDueDate;
            break;
        case 'Level 1':
            if (task.escalationLevel1DurationDays && task.escalationLevel2DurationDays) {
                const l1Date = addDays(baseDueDate, task.escalationLevel1DurationDays);
                nextDueDate = addDays(l1Date, task.escalationLevel2DurationDays);
            }
            break;
        case 'Level 2':
            if (task.escalationLevel1DurationDays && task.escalationLevel2DurationDays && task.escalationEmailDurationDays) {
                const l1Date = addDays(baseDueDate, task.escalationLevel1DurationDays);
                const l2Date = addDays(l1Date, task.escalationLevel2DurationDays);
                nextDueDate = addDays(l2Date, task.escalationEmailDurationDays);
            }
            break;
        case 'Email Sent':
            // No further due dates
            break;
    }

    // If no escalation path, the only due date is the base one.
    if (!nextDueDate) nextDueDate = baseDueDate;

    const isOverdue = nextDueDate ? nextDueDate < today : false;

    return { date: format(nextDueDate, 'dd MMM, yyyy'), isOverdue };
};


const TaskManagement: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { tasks, isLoading, error, fetchTasks, deleteTask, runAutomaticEscalations } = useTaskStore();
    const { theme } = useThemeStore();
    const { colorScheme } = useBrandingStore();
    const themeColors = getThemeColors(colorScheme);
    const isDark = theme === 'dark' || themeColors.isDark; // Consolidated dark mode check

    // Dynamic button classes based on theme
    const mobileAddBtnClass = `!text-white`;
    const mobileAddBtnStyle = { backgroundColor: themeColors.primary };
    
    // Desktop button usually follows success/primary pattern
    const desktopAddBtnClass = `text-white transition-colors`;
    const desktopAddBtnStyle = { backgroundColor: themeColors.activeItemBg };



    const [isCompleteFormOpen, setIsCompleteFormOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
    const [assignedToFilter, setAssignedToFilter] = useState<'all' | string>('all');
    const isMobile = useMediaQuery('(max-width: 767px)');

    useEffect(() => {
        const init = async () => {
            api.getUsers().then(setUsers);
            await fetchTasks();
            await runAutomaticEscalations();
        }
        init();
    }, [fetchTasks, runAutomaticEscalations]);

    const handleAdd = () => {
        navigate('/tasks/add');
    };

    const handleEdit = (task: Task) => {
        navigate(`/tasks/edit/${task.id}`);
    };

    const handleComplete = (task: Task) => {
        setCurrentTask(task);
        setIsCompleteFormOpen(true);
    };

    const handleDelete = (task: Task) => {
        setCurrentTask(task);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (currentTask) {
            try {
                await deleteTask(currentTask.id);
                setToast({ message: 'Task deleted.', type: 'success' });
                setIsDeleteModalOpen(false);
            } catch (error) {
                setToast({ message: 'Failed to delete task.', type: 'error' });
            }
        }
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (statusFilter !== 'all' && task.status !== statusFilter) {
                return false;
            }
            if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
                return false;
            }
            if (assignedToFilter === 'unassigned') {
                if (task.assignedToId) return false;
            } else if (assignedToFilter !== 'all' && task.assignedToId !== assignedToFilter) {
                return false;
            }
            return true;
        });
    }, [tasks, statusFilter, priorityFilter, assignedToFilter]);

    const clearFilters = () => {
        setStatusFilter('all');
        setPriorityFilter('all');
        setAssignedToFilter('all');
    };

    const areFiltersActive = statusFilter !== 'all' || priorityFilter !== 'all' || assignedToFilter !== 'all';


    const getPriorityChip = (priority: Task['priority']) => {
        const styles = {
            High: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800',
            Medium: isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800',
            Low: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800',
        };
        return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[priority]}`}>{priority}</span>;
    };

    const getStatusChip = (status: Task['status']) => {
        const styles = {
            'To Do': isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-800',
            'In Progress': isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-800',
            'Done': isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800',
        };
        return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    const getEscalationChip = (status: EscalationStatus) => {
        if (status === 'None') return null;
        const styles: Record<EscalationStatus, string> = {
            'None': '',
            'Level 1': isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-800',
            'Level 2': isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800',
            'Email Sent': isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-800',
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div 
            className={`min-h-screen p-4 pb-24 md:p-6 md:rounded-xl md:shadow-card ${!isMobile && !isDark ? 'md:bg-card' : ''} ${isMobile || isDark ? 'border border-white/10' : ''}`}
            style={{ 
                backgroundColor: isMobile || isDark ? themeColors.mobileBg : undefined,
                color: isMobile || isDark ? (themeColors.isDark ? 'white' : '#111827') : undefined
            }}
        >
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {isCompleteFormOpen && currentTask && (
                <CompleteTaskForm
                    isOpen={isCompleteFormOpen}
                    onClose={() => setIsCompleteFormOpen(false)}
                    task={currentTask}
                    setToast={setToast}
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
            >
                Are you sure you want to delete the task "{currentTask?.name}"?
            </Modal>

            <div className="mb-6">
                <h1 className={`text-2xl font-bold ${isMobile || isDark || themeColors.isDark ? 'text-white' : 'text-gray-900'}`}
                    style={{ color: (isMobile || isDark || themeColors.isDark) ? 'white' : '#111827' }}
                >Task Management</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-end justify-between">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className={`text-sm font-medium`} style={{ color: isMobile || isDark ? 'white' : '#374151' }}>Filter by Status</label>
                        <select
                            className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500`}
                            style={{ 
                                backgroundColor: isMobile || isDark ? themeColors.sidebarBg : 'white', 
                                borderColor: isMobile || isDark ? themeColors.sidebarBorder : '#d1d5db',
                                color: isMobile || isDark ? 'white' : '#111827'
                            }}
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all" style={{ backgroundColor: themeColors.sidebarBg }}>All Statuses</option>
                            <option value="To Do" style={{ backgroundColor: themeColors.sidebarBg }}>To Do</option>
                            <option value="In Progress" style={{ backgroundColor: themeColors.sidebarBg }}>In Progress</option>
                            <option value="Done" style={{ backgroundColor: themeColors.sidebarBg }}>Done</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={`text-sm font-medium`} style={{ color: isMobile || isDark ? 'white' : '#374151' }}>Filter by Priority</label>
                        <select
                            className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500`}
                            style={{ 
                                backgroundColor: isMobile || isDark ? themeColors.sidebarBg : 'white', 
                                borderColor: isMobile || isDark ? themeColors.sidebarBorder : '#d1d5db',
                                color: isMobile || isDark ? 'white' : '#111827'
                            }}
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value as any)}
                        >
                            <option value="all" style={{ backgroundColor: themeColors.sidebarBg }}>All Priorities</option>
                            <option value="Low" style={{ backgroundColor: themeColors.sidebarBg }}>Low</option>
                            <option value="Medium" style={{ backgroundColor: themeColors.sidebarBg }}>Medium</option>
                            <option value="High" style={{ backgroundColor: themeColors.sidebarBg }}>High</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={`text-sm font-medium`} style={{ color: isMobile || isDark ? 'white' : '#374151' }}>Filter by Assignee</label>
                        <select
                            className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500`}
                            style={{ 
                                backgroundColor: isMobile || isDark ? themeColors.sidebarBg : 'white', 
                                borderColor: isMobile || isDark ? themeColors.sidebarBorder : '#d1d5db',
                                color: isMobile || isDark ? 'white' : '#111827'
                            }}
                            value={assignedToFilter}
                            onChange={e => setAssignedToFilter(e.target.value)}
                        >
                            <option value="all" style={{ backgroundColor: themeColors.sidebarBg }}>All Users</option>
                            <option value="unassigned" style={{ backgroundColor: themeColors.sidebarBg }}>Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.id} style={{ backgroundColor: themeColors.sidebarBg }}>{u.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-4 md:mt-0">
                    {areFiltersActive && (
                        <Button variant="secondary" onClick={clearFilters} className={isMobile ? '!bg-card !border-border' : '!text-white !border-white/10'} style={!isMobile && isDark ? { backgroundColor: themeColors.sidebarBg } : {}}>
                            <X className="mr-2 h-4 w-4" /> Clear Filters
                        </Button>
                    )}
                    <button
                        onClick={handleAdd}
                        className={`flex items-center justify-center transition-colors ${isMobile ? mobileAddBtnClass + ' !font-bold !border-none shadow-none text-sm py-3 px-6 rounded-xl' : desktopAddBtnClass + ' rounded-lg px-6 py-2.5 font-medium'}`}
                        style={isMobile ? mobileAddBtnStyle : desktopAddBtnStyle}
                    >
                        <Plus className="mr-2 h-5 w-5" /> Add Task
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="overflow-x-auto">
                <table className="min-w-full responsive-table">
                    <thead className={isMobile ? 'hidden' : 'bg-transparent border-b'} style={{ 
                        backgroundColor: !isMobile && isDark ? 'rgba(255,255,255,0.05)' : undefined, 
                        color: isMobile || isDark ? 'white' : '#6b7280',
                        borderColor: isMobile || isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'
                    }}>
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Task Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Next Due Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Assigned To</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Escalation</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y md:divide-y-0 ${isMobile ? 'space-y-4 block' : ''}`} style={{ borderColor: isMobile || isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
                        {isLoading ? (
                            isMobile
                                ? <tr><td colSpan={7}><TableSkeleton rows={3} cols={7} isMobile /></td></tr>
                                : <TableSkeleton rows={5} cols={7} />
                        ) : filteredTasks.map((task) => {
                            const { date: nextDueDate, isOverdue } = getNextDueDateInfo(task);

                            if (isMobile) {
                                return (
                                    <div key={task.id} className="p-4 rounded-xl border mb-4" style={{ 
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                                        color: isDark ? 'white' : '#111827'
                                    }}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">{task.name}</h3>
                                                <p className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Due: <span className={isOverdue ? 'text-red-400 font-bold' : ''}>{nextDueDate || '-'}</span></p>
                                            </div>
                                            {getPriorityChip(task.priority)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                            <div>
                                                <span className="block text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Assigned To</span>
                                                <span className="">{task.assignedToName || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Status</span>
                                                <span className="">{task.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
                                            <button onClick={() => handleEdit(task)} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', color: isDark ? '#d1d5db' : '#6b7280' }}><Edit className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(task)} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: isDark ? '#f87171' : '#dc2626' }}><Trash2 className="h-4 w-4" /></button>
                                            {task.assignedToId === user?.id && task.status !== 'Done' && (
                                                <button onClick={() => handleComplete(task)} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
                                                    <CheckCircle className="h-4 w-4 mr-1.5" /> Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <tr key={task.id} className={`${isOverdue ? 'bg-red-50' : 'hover:bg-black/5'} transition-colors`} style={!isOverdue && isDark ? { backgroundColor: 'transparent' } : {}}>
                                    <td data-label="Task Name" className="px-6 py-4 font-medium" style={{ color: isDark ? 'white' : '#111827' }}>{task.name}</td>
                                    <td data-label="Priority" className="px-6 py-4">{getPriorityChip(task.priority)}</td>
                                    <td data-label="Next Due Date" className={`px-6 py-4 text-sm ${isOverdue ? 'font-bold text-red-600' : ''}`} style={{ color: !isOverdue ? (isDark ? '#9ca3af' : '#6b7280') : undefined }}>{nextDueDate || '-'}</td>
                                    <td data-label="Assigned To" className="px-6 py-4 text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{task.assignedToName || '-'}</td>
                                    <td data-label="Status" className="px-6 py-4 text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{getStatusChip(task.status)}</td>
                                    <td data-label="Escalation" className="px-6 py-4 text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{getEscalationChip(task.escalationStatus)}</td>
                                    <td data-label="Actions" className="px-6 py-4">
                                        <div className="flex items-center gap-2 justify-end md:justify-start">
                                            <Button variant="icon" size="sm" onClick={() => handleEdit(task)} title="Edit Task"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="icon" size="sm" onClick={() => handleDelete(task)} title="Delete Task"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                                            {task.assignedToId === user?.id && task.status !== 'Done' && (
                                                <Button variant="outline" size="sm" onClick={() => handleComplete(task)} style={{ borderColor: themeColors.primary, color: themeColors.primary }}>
                                                    <CheckCircle className="h-4 w-4 mr-2" /> Complete
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!isLoading && filteredTasks.length === 0 && (
                    <div className="text-center py-10 text-muted">
                        <p className={isMobile || isDark ? 'text-gray-400' : ''}>No tasks found matching your criteria.</p>
                        {areFiltersActive && <Button variant="secondary" size="sm" className="mt-2" onClick={clearFilters}>Clear filters</Button>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskManagement;