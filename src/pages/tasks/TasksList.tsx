import { useState, useRef, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import  authApi  from '../../utils/axios';
import { Box, Typography, TextField, Paper, Table, TableHead, TableRow, TableCell, CircularProgress } from '@mui/material';
interface User {
  id: number;
  name: string;
  email: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  assignedTo?: User;
  assignedBy?: User;
}

export const fetchTasks = async ({ pageParam = 1, keyword = "" }) => {
  const res = await authApi.get("/admin/tasks", {
    params: { keyword, page: pageParam, limit: 10 },
  });
  return res.data;
};

const TaskList = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['tasks', debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      fetchTasks({ pageParam, keyword: debouncedSearch }),
    getNextPageParam: (lastPage, all) => {
      const totalPages = Math.ceil(lastPage.total / 10);
      const next = all.length + 1;
      return next <= totalPages ? next : undefined;
    },
    initialPageParam: 1,
  });

  const allTasks = data?.pages.flatMap(p => p.data) || [];

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: allTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 50, []),
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      virtualItems.length > 0 &&
      virtualItems[virtualItems.length - 1].index >= allTasks.length - 1
    ) {
      fetchNextPage();
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPage, allTasks.length]);
useEffect(() => {
  console.log("Tasks loaded:", allTasks.length);
}, [allTasks.length]);

  
           
  return (
    <Box display="flex" flexDirection="column" height="100vh" bgcolor="#f5f5f5">
      {/* Header */}
      <Box p={3} bgcolor="white" boxShadow={1}>
        <Typography variant="h6" gutterBottom color="primary">
          Tất cả task trong hệ thống
        </Typography>
        <TextField
          fullWidth
          placeholder="Tìm theo tiêu đề, Intern, Mentor, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Table */}
      <Box flex={1} overflow="auto" ref={parentRef} component={Paper}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Intern</TableCell>
              <TableCell>Mentor</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Hạn chót</TableCell>
            </TableRow>
          </TableHead>
        </Table>

        <Box
          sx={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const task = allTasks[virtualRow.index];
            return (
              <Box
                key={task.id}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: 'white',
                  '&:hover': { bgcolor: '#f9f9f9' },
                }}
              >
                <Box flex={1} px={2}>{task.id}</Box>
                <Box flex={2} px={2}>{task.title}</Box>
                <Box flex={2} px={2}>
                  {task.assignedTo?.name || '---'} (# {task.assignedTo?.id || '-'})
                </Box>
                <Box flex={2} px={2}>
                  {task.assignedBy?.name || '---'} (# {task.assignedBy?.id || '-'})
                </Box>
                <Box flex={1} px={2} textTransform="capitalize">
                  {task.status}
                </Box>
                <Box flex={1} px={2}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Footer */}
      <Box textAlign="center" py={1} bgcolor="white" boxShadow={1}>
        {isFetchingNextPage && <CircularProgress size={20} color="primary" />}
        {!hasNextPage && (
          <Typography variant="body2" color="textSecondary" fontStyle="italic">
            Đã tải toàn bộ task.
          </Typography>
        )}
      </Box>
    </Box>
  );

}


export default TaskList;
