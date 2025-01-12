import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import type { Hive } from '@/types';

interface HeaderProps {
  allHives: Hive[];
  isSidebarOpen: boolean;
}

export const Header = ({ isSidebarOpen }: HeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm  top-0 right-0 left-0 z-40">
      <div className={`transition-all duration-300 flex items-center h-16 px-8 ${
        isSidebarOpen ? 'pl-72' : 'pl-24'
      }`}>
        {/* Search Bar with max-width */}
        <div className="w-96"> {/* Fixed width for search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder={t('placeholders.search')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                       placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 
                       focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
};