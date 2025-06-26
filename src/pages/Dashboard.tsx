import { useEffect, useMemo } from 'react';
import { useInternTaskStore } from '../stores/useInternTaskStore';
import { useAuth } from '../hooks/useAuth';
import iconComplete from '../assets/status_task/complete.png';
import iconAssigned from '../assets/status_task/assigned.png';
import iconProgress from '../assets/status_task/progress.png';
import iconHold from '../assets/status_task/hold.png';

export default function InternDashboard() {
  const user = useAuth();
  const { fetchTasks, hasFetched } = useInternTaskStore();
  const tasks = useInternTaskStore((state) => state.tasks);

  useEffect(() => {
    if (user?.type === 'intern' && !hasFetched) {
      fetchTasks();
    }
  }, [user, hasFetched]);

  const { complete, assigned, progress, hold, total } = useMemo(() => {
    const complete = tasks.filter(t => t.status === 'completed').length;
    const assigned = tasks.filter(t => t.status === 'assigned').length;
    const progress = tasks.filter(t => t.status === 'in_progress').length;
    const hold = tasks.filter(t => ['hold', 'rejected'].includes(t.status)).length;
    const total = tasks.length;

    return { complete, assigned, progress, hold, total };
  }, [tasks]);

  if (!user || user.type !== 'intern') return null;

  return (
    <div className="container ht-6">
      <h1 className="text-2xl font-medium text-[#243874] mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <StatusCard
          iconPath={iconComplete}
          label="Total"
          value={total}
          bgColor="bg-gray-100"
          textColor="text-gray-800"
        />
        <StatusCard
          iconPath={iconComplete}
          label="Completed"
          value={complete}
          bgColor="bg-green-100"
          textColor="text-green-800"
        />
        <StatusCard
          iconPath={iconAssigned}
          label="Assigned"
          value={assigned}
          bgColor="bg-yellow-100"
          textColor="text-yellow-800"
        />
        <StatusCard
          iconPath={iconProgress}
          label="In Progress"
          value={progress}
          bgColor="bg-blue-100"
          textColor="text-blue-800"
        />
        {/* <StatusCard
          iconPath={iconHold}
          label="Hold/Reject"
          value={hold}
          bgColor="bg-red-100"
          textColor="text-red-800"
        /> */}
      </div>
    </div>
  );
}

function StatusCard({
  iconPath,
  label,
  value,
  bgColor,
  textColor,
}: {
  iconPath: string;
  label: string;
  value: number;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className="flex items-center space-x-4 px-4 py-3 rounded-md shadow border bg-white">
      <div className={`w-10 h-10 flex items-center justify-center rounded ${bgColor}`}>
        <img src={iconPath} alt={label} className="w-6 h-6" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">{value}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
    </div>
  );
}
