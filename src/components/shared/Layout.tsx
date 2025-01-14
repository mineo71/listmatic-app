// src/components/shared/Layout.tsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CreateItemModal } from './Modal';
import { initialHives } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import type { Hive, Honeycomb } from '@/types';

export const Layout = () => {
  const [hives, setHives] = useState<Hive[]>(initialHives);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modalType, setModalType] = useState<'hive' | 'honeycomb' | null>(null);
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

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

  const handleDeleteHive = (hiveId: string) => {
    if (window.confirm('Are you sure you want to delete this hive?')) {
      setHives(prevHives => prevHives.filter(hive => hive.id !== hiveId));
      if (selectedHiveId === hiveId) {
        setSelectedHiveId(null);
      }
    }
  };

  const handleDeleteHoneycomb = (honeycombId: string) => {
    if (window.confirm('Are you sure you want to delete this honeycomb?')) {
      const updateHive = (hive: Hive): Hive => ({
        ...hive,
        honeycombs: hive.honeycombs.filter(hc => hc.id !== honeycombId),
        subHives: hive.subHives.map(updateHive)
      });

      setHives(hives.map(updateHive));
      if (location.pathname === `/honeycomb/${honeycombId}`) {
        navigate('/');
      }
    }
  };

  const handleRenameItem = (id: string, newName: string, type: 'hive' | 'honeycomb') => {
    if (type === 'hive') {
      setHives(prevHives =>
        prevHives.map(hive =>
          hive.id === id
            ? { ...hive, name: newName, updatedAt: new Date() }
            : hive
        )
      );
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
    }
  };

  const handleCreateItem = (name: string) => {
    if (modalType === 'hive') {
      const newHive: Hive = {
        id: Date.now().toString(),
        name,
        honeycombs: [],
        subHives: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        icon: 'None',
        color: ''
      };
      setHives([...hives, newHive]);
    } else if (modalType === 'honeycomb' && selectedHiveId) {
      const newHoneycomb: Honeycomb = {
        id: Date.now().toString(),
        name,
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        description: '',
        icon: 'None',
        color: ''
      };

      const updateHive = (hive: Hive): Hive => {
        if (hive.id === selectedHiveId) {
          return {
            ...hive,
            honeycombs: [...hive.honeycombs, newHoneycomb],
            updatedAt: new Date()
          };
        }
        return {
          ...hive,
          subHives: hive.subHives.map(updateHive)
        };
      };

      setHives(hives.map(updateHive));
    }
    setModalType(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        hives={hives}
        selectedHiveId={selectedHiveId}
        selectedHoneycombId={location.pathname.startsWith('/honeycomb/') ? 
          location.pathname.split('/').pop() : undefined}
        onSelectItem={handleSelectItem}
        onCreateHive={() => setModalType('hive')}
        onCreateHoneycomb={() => setModalType('honeycomb')}
        onDeleteHive={handleDeleteHive}
        onDeleteHoneycomb={handleDeleteHoneycomb}
        onRenameItem={handleRenameItem}
        onLogout={handleLogout}
      />

      <div className={`fixed right-0 top-0 bottom-0 transition-all duration-300 ${
        isSidebarOpen ? 'left-64' : 'left-0'
      }`}>
        <div className='border-gray-200 border-b'>
          <Header 
            allHives={hives}
            isSidebarOpen={isSidebarOpen}
          />
        </div>

        <main className="h-[calc(100vh-4rem)] overflow-auto">
          <Outlet context={{ 
            hives,
            selectedHiveId,
            onUpdateHoneycomb: handleUpdateHoneycomb
          }} />
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