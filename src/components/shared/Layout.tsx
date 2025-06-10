/* eslint-disable react-hooks/exhaustive-deps */
// src/components/shared/Layout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CreateItemModal } from './Modal';
import { useAuth } from '@/context/AuthContext';
import { 
  getUserHives, 
  createHive, 
  createHoneycomb, 
  updateHive, 
  updateHoneycomb, 
  deleteHive, 
  deleteHoneycomb,
  checkIfHoneycombIsCloned,
} from '@/services/database';
import type { Hive, Honeycomb } from '@/types';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export const Layout = () => {
  const [hives, setHives] = useState<Hive[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modalType, setModalType] = useState<'hive' | 'honeycomb' | null>(null);
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setCreateLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  // Load hives when component mounts
  useEffect(() => {
    loadHives();
  }, []);

  const loadHives = async () => {
    setLoading(true);
    try {
      const { data, error } = await getUserHives();
      if (error) {
        console.error('Error loading hives:', error);
        toast.error(t('messages.loadError'));
      } else {
        setHives(data || []);
      }
    } catch (error) {
      console.error('Error loading hives:', error);
      toast.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (id: string, type: 'hive' | 'honeycomb' | 'settings') => {
    if (type === 'hive') {
      setSelectedHiveId(id);
    } else if (type === 'honeycomb') {
      if (id) {
        navigate(`/honeycomb/${id}`);
      } else {
        navigate('/');
        setSelectedHiveId(null);
      }
    } else if (type === 'settings') {
      if (id === 'settings') {
        navigate('/settings');
      } else if (id === 'profile') {
        navigate('/profile');
      }
    }
  };

  const handleUpdateHoneycomb = (updatedHoneycomb: Honeycomb) => {
    const updateHoneycombs = (hive: Hive): Hive => ({
      ...hive,
      honeycombs: hive.honeycombs.map(hc =>
        hc.id === updatedHoneycomb.id ? updatedHoneycomb : hc
      ),
      subHives: hive.subHives.map(updateHoneycombs)
    });

    setHives(hives.map(updateHoneycombs));
  };

  const handleDeleteHive = async (hiveId: string) => {
    try {
      const { error } = await deleteHive(hiveId);
      if (error) {
        console.error('Error deleting hive:', error);
        // Check if it's a foreign key constraint error
        if ((error as { code?: string }).code === '23503') {
          toast.error('Cannot delete this hive as it contains honeycombs that have been shared or cloned. Please delete the shared copies first.');
        } else {
          toast.error(t('messages.deleteError'));
        }
      } else {
        setHives(prevHives => prevHives.filter(hive => hive.id !== hiveId));
        toast.success(t('messages.hiveDeleted'));
        
        if (selectedHiveId === hiveId) {
          setSelectedHiveId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting hive:', error);
      toast.error(t('messages.deleteError'));
    }
  };

  const handleDeleteHoneycomb = async (honeycombId: string) => {
    try {
      // Check if this honeycomb is a clone
      const { data: isCloned } = await checkIfHoneycombIsCloned(honeycombId);

      const { error } = await deleteHoneycomb(honeycombId);
      if (error) {
        console.error('Error deleting honeycomb:', error);
        // Check if it's a foreign key constraint error
        if ((error as { code?: string }).code === '23503') {
          if (isCloned) {
            toast.error('Error deleting the cloned honeycomb. Please try again.');
          } else {
            toast.error('Cannot delete this honeycomb as it has been shared or cloned. Please delete the shared copies first, or contact support.');
          }
        } else {
          toast.error(t('messages.deleteError'));
        }
      } else {
        // Remove honeycomb from local state
        const updateHive = (hive: Hive): Hive => ({
          ...hive,
          honeycombs: hive.honeycombs.filter(hc => hc.id !== honeycombId),
          subHives: hive.subHives.map(updateHive)
        });

        setHives(hives.map(updateHive));
        
        if (isCloned) {
          toast.success('Cloned honeycomb deleted successfully.');
        } else {
          toast.success(t('messages.honeycombDeleted'));
        }
        
        if (location.pathname === `/honeycomb/${honeycombId}`) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error deleting honeycomb:', error);
      toast.error(t('messages.deleteError'));
    }
  };

  const handleRenameItem = async (id: string, newName: string, type: 'hive' | 'honeycomb') => {
    try {
      if (type === 'hive') {
        const { error } = await updateHive(id, { name: newName });
        if (error) {
          console.error('Error updating hive:', error);
          toast.error(t('messages.updateError'));
        } else {
          setHives(prevHives =>
            prevHives.map(hive =>
              hive.id === id
                ? { ...hive, name: newName, updatedAt: new Date() }
                : hive
            )
          );
          toast.success(t('messages.hiveUpdated'));
        }
      } else {
        const { error } = await updateHoneycomb(id, { name: newName });
        if (error) {
          console.error('Error updating honeycomb:', error);
          toast.error(t('messages.updateError'));
        } else {
          const updateHive = (hive: Hive): Hive => ({
            ...hive,
            honeycombs: hive.honeycombs.map(hc =>
              hc.id === id
                ? { ...hc, name: newName, updatedAt: new Date() }
                : hc
            ),
            subHives: hive.subHives.map(updateHive)
          });

          setHives(hives.map(updateHive));
          toast.success(t('messages.honeycombUpdated'));
        }
      }
    } catch (error) {
      console.error('Error renaming item:', error);
      toast.error(t('messages.updateError'));
    }
  };

  const handleCreateItem = async (name: string) => {
    if (!name.trim()) return;

    setCreateLoading(true);
    
    try {
      if (modalType === 'hive') {
        const { data, error } = await createHive({
          name: name.trim(),
          description: '',
          icon: 'None',
          color: '#FDE68A',
        });

        if (error) {
          console.error('Error creating hive:', error);
          toast.error(t('messages.createError'));
        } else if (data) {
          setHives(prev => [data, ...prev]);
          toast.success(t('messages.hiveCreated'));
          
          // Automatically select and open the newly created hive
          setSelectedHiveId(data.id);
          handleSelectItem(data.id, 'hive');
        }
      } else if (modalType === 'honeycomb' && selectedHiveId) {
        const { data, error } = await createHoneycomb(
          {
            name: name.trim(),
            description: '',
            icon: 'None',
            color: '#FDE68A',
          },
          selectedHiveId
        );

        if (error) {
          console.error('Error creating honeycomb:', error);
          toast.error(t('messages.createError'));
        } else if (data) {
          const updateHive = (hive: Hive): Hive => {
            if (hive.id === selectedHiveId) {
              return {
                ...hive,
                honeycombs: [...hive.honeycombs, data],
                updatedAt: new Date()
              };
            }
            return {
              ...hive,
              subHives: hive.subHives.map(updateHive)
            };
          };

          setHives(hives.map(updateHive));
          toast.success(t('messages.honeycombCreated'));
          
          // Automatically select and open the newly created honeycomb
          handleSelectItem(data.id, 'honeycomb');
        }
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error(t('messages.createError'));
    } finally {
      setCreateLoading(false);
      setModalType(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        hives={hives}
        selectedHiveId={selectedHiveId}
        selectedHoneycombId={location.pathname.includes('/honeycomb/') ? 
          location.pathname.split('/').pop() : undefined}
        onSelectItem={handleSelectItem}
        onCreateHive={() => setModalType('hive')}
        onCreateHoneycomb={() => setModalType('honeycomb')}
        onDeleteHive={handleDeleteHive}
        onDeleteHoneycomb={handleDeleteHoneycomb}
        onRenameItem={handleRenameItem}
        onLogout={handleLogout}
        loading={loading}
      />

      <div className={`fixed right-0 top-0 bottom-0 transition-all duration-300 
      ${ isSidebarOpen ? 'left-64' : 'left-0'}
      `}>
        <main className="h-[100%] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                <p className="text-gray-600">{t('messages.loading')}</p>
              </div>
            </div>
          ) : (
            <Outlet context={{ 
              hives,
              selectedHiveId,
              onUpdateHoneycomb: handleUpdateHoneycomb,
              isSidebarOpen,
              onToggleSidebar: toggleSidebar
            }} />
          )}
        </main>
      </div>

      <CreateItemModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onSubmit={handleCreateItem}
        type={modalType || 'hive'}
      />
    </div>
  );
};