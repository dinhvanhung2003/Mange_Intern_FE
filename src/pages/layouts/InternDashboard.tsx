// src/pages/intern/InternDashboard.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useInternTaskStore } from '../../stores/useInternTaskStore';
import { useAuth } from '../../hooks/useAuth';
import iconComplete from '../../assets/status_task/complete.png';
import iconAssigned from '../../assets/status_task/assigned.png';
import iconProgress from '../../assets/status_task/progress.png';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import viLocale from '@fullcalendar/core/locales/vi';
import dayjs from 'dayjs';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/axios';
import {Box,Skeleton,LinearProgress } from '@mui/material';
type Deadline = {
  id: number;
  date: string;             // ISO
  topicId: number;
  topicTitle: string;
  requirement: string;
  submittedAt: string | null;
};

export default function InternDashboard() {
  const user = useAuth();
  const { fetchTasks, hasFetched } = useInternTaskStore();
  const tasks = useInternTaskStore((s) => s.tasks);

  // fetch task 1 lần cho intern
  useEffect(() => {
    if (user?.type === 'intern' && !hasFetched) fetchTasks();
  }, [user?.type, hasFetched, fetchTasks]);

  // Đếm 1-pass
  const { complete, assigned, progress, hold, total } = useMemo(() => {
    const acc = { complete: 0, assigned: 0, progress: 0, hold: 0, total: 0 };
    const list = Array.isArray(tasks) ? tasks : [];
    for (let i = 0, n = list.length; i < n; i++) {
      acc.total++;
      const s = list[i].status as string;
      if (s === 'completed') acc.complete++;
      else if (s === 'assigned') acc.assigned++;
      else if (s === 'in_progress') acc.progress++;
      else if (s === 'hold') acc.hold++;
    }
    return acc;
  }, [tasks]);

  // Debounced callback helper
  function useDebouncedCallback<T extends any[]>(
    fn: (...args: T) => void,
    delay = 400
  ) {
    const fnRef = useRef(fn);
    useEffect(() => { fnRef.current = fn; }, [fn]);
    const timer = useRef<number | null>(null);
    return (...args: T) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => fnRef.current(...args), delay);
    };
  }

  const calRef = useRef<FullCalendar>(null);
  const [range, setRange] = useState<{ start: string; end: string }>(() => ({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  }));

  // chỉ set range sau khi user dừng bấm 400ms
  const debouncedUpdateRange = useDebouncedCallback(
    (start: string, end: string) => setRange({ start, end }),
    400
  );

  const onDatesSet = (info: { start: Date; end: Date }) => {
    debouncedUpdateRange(
      dayjs(info.start).format('YYYY-MM-DD'),
      dayjs(info.end).format('YYYY-MM-DD')
    );
  };

  // Query deadlines: cancel request cũ bằng signal, cache 5'
  const { data: deadlines = [], isFetching,isLoading } = useQuery<Deadline[]>({
    queryKey: ['intern-deadlines', range.start, range.end],
    queryFn: ({ signal }) =>
      api
        .get('/interns/dashboard/deadlines', {
          params: { from: range.start, to: range.end },
          signal, // <-- quan trọng để hủy request cũ
        })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 0,
  });

  const events = useMemo(
    () =>
      deadlines.map((d) => ({
        id: String(d.id),
        title: d.topicTitle,
        start: d.date,
        allDay: false,
        backgroundColor: d.submittedAt ? '#16a34a' : '#ef4444', // xanh: đã nộp, đỏ: chưa nộp
        borderColor: 'transparent',
        extendedProps: d,
      })),
    [deadlines]
  );

  const apiCal = () => calRef.current?.getApi();

  // Prefetch tháng trước/sau để next/prev mượt hơn mà không tăng tải đột biến
  const qc = useQueryClient();
  useEffect(() => {
    const curr = dayjs(range.start, 'YYYY-MM-DD');
    const next = {
      start: curr.add(1, 'month').startOf('month').format('YYYY-MM-DD'),
      end: curr.add(1, 'month').endOf('month').format('YYYY-MM-DD'),
    };
    const prev = {
      start: curr.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      end: curr.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
    };

    qc.prefetchQuery({
      queryKey: ['intern-deadlines', next.start, next.end],
      queryFn: ({ signal }) =>
        api.get('/interns/dashboard/deadlines', { params: { from: next.start, to: next.end }, signal }).then(r => r.data),
      staleTime: 5 * 60 * 1000,
    });
    qc.prefetchQuery({
      queryKey: ['intern-deadlines', prev.start, prev.end],
      queryFn: ({ signal }) =>
        api.get('/interns/dashboard/deadlines', { params: { from: prev.start, to: prev.end }, signal }).then(r => r.data),
      staleTime: 5 * 60 * 1000,
    });
  }, [qc, range.start]);

  useEffect(() => {
    // debug nhẹ nếu cần
    // console.log('range', range);
    // console.table(deadlines.map(d => ({ id: d.id, date: d.date })));
  }, [range, deadlines]);
const isTasksLoading = user?.type === 'intern' && !hasFetched && (tasks?.length ?? 0) === 0;
  return (
    <div className="container ht-6">
      <h1 className="text-2xl font-medium text-[#243874] mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {isTasksLoading ? (
          // 4 skeleton cards
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))
        ) : (
          <>
            <StatusCard iconPath={iconComplete} label="Total" value={total} bgColor="bg-gray-100" textColor="text-gray-800" />
            <StatusCard iconPath={iconComplete} label="Completed" value={complete} bgColor="bg-green-100" textColor="text-green-800" />
            <StatusCard iconPath={iconAssigned} label="Assigned" value={assigned} bgColor="bg-yellow-100" textColor="text-yellow-800" />
            <StatusCard iconPath={iconProgress} label="In Progress" value={progress} bgColor="bg-blue-100" textColor="text-blue-800" />
          </>
        )}
      </div>

      {/*  Lịch deadline */}
       {/*  Lịch deadline */}
      <Box className="bg-white mt-6 p-3 rounded shadow" sx={{ position: 'relative' }}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Lịch deadline</h2>
        </div>

        {isLoading ? (
          // Skeleton cho lần load đầu tiên của lịch
          <Skeleton variant="rounded" height={520} />
        ) : (
          <>
            <FullCalendar
              ref={calRef}
              timeZone="local"
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              // Khóa prev/next khi đang fetch để tránh spam
              headerToolbar={{
                left: 'myPrev,myNext today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              customButtons={{
                myPrev: { text: '‹', click: () => { if (!isFetching) apiCal()?.prev(); } },
                myNext: { text: '›', click: () => { if (!isFetching) apiCal()?.next(); } },
              }}
              buttonText={{ today: 'Hôm nay', month: 'Tháng', week: 'Tuần', day: 'Ngày' }}
              locale={viLocale}
              firstDay={1}
              height="auto"
              events={events}
              datesSet={onDatesSet}
              dayMaxEventRows={3}
              nowIndicator
              navLinks
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
              eventClick={(info) => {
                const d = info.event.extendedProps as Deadline;
                const text =
                  `${info.event.title}\n` +
                  `Hạn: ${dayjs(info.event.start!).format('DD/MM/YYYY HH:mm')}\n` +
                  (d.submittedAt ? `Đã nộp: ${dayjs(d.submittedAt).format('DD/MM HH:mm')}\n` : '') +
                  `Yêu cầu: ${(d.requirement || '').replace(/<[^>]*>/g, '')}`;
                alert(text);
              }}
              dayCellClassNames={(arg) => {
                const dayStr = dayjs(arg.date).format('YYYY-MM-DD');
                const hasDeadline = deadlines.some(d => dayjs(d.date).format('YYYY-MM-DD') === dayStr);
                return hasDeadline ? ['bg-yellow-200', 'font-bold'] : [];
              }}
            />

            {/* Overlay khi đang fetch tháng mới (không che nội dung cũ) */}
            {isFetching && (
              <Box sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.4)',
                pointerEvents: 'none'
              }}>
                <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
              </Box>
            )}
          </>
        )}
      </Box>
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
