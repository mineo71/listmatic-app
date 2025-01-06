import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import type { Hive } from '@/types';

interface HeaderProps {
  allHives: Hive[];
  isSidebarOpen: boolean;
}

export const Header = ({ allHives, isSidebarOpen }: HeaderProps) => {
  const { t } = useTranslation();

  const calculateTotalCompletion = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    const processHive = (hive: Hive) => {
      hive.honeycombs.forEach((honeycomb) => {
        totalTasks += honeycomb.tasks.length;
        completedTasks += honeycomb.tasks.filter(task => task.completed).length;
      });
      hive.subHives.forEach(processHive);
    };

    allHives.forEach(processHive);
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 right-0 left-0 z-40">
      <div className={`transition-all duration-300 flex items-center justify-between h-16 px-8 ${
        isSidebarOpen ? 'pl-72' : 'pl-24'
      }`}>
        <div className="max-w-md w-full flex items-center gap-4">
          <div className="relative flex-1">
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

        {/* Progress Indicator */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">{t('totalProgress')}</span>
            <div className="flex items-center space-x-2">
              <div className="w-48 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${calculateTotalCompletion()}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {calculateTotalCompletion()}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};