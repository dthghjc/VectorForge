// function Review() {
//     return (
//         <div>
//             <h1>Review</h1>
//         </div>
//     )
// }

// export default Review;

import React, { useState, useMemo } from 'react';
import { ConfigProvider, Layout, Typography, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import TaskTable from '../../components/annotation/TaskTable';
import AnnotationModal from '../../components/annotation/AnnotationModal';
import { mockTasks } from '../../data/mockData';
import { theme } from '../../components/annotation/theme';
import type { AnnotationTask } from '../../components/annotation/types.ts';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [tasks, setTasks] = useState<AnnotationTask[]>(mockTasks);
  const [currentTask, setCurrentTask] = useState<AnnotationTask | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 过滤任务
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchText || 
        task.id.toLowerCase().includes(searchText.toLowerCase()) ||
        task.dialoguePreview.toLowerCase().includes(searchText.toLowerCase()) ||
        task.annotator.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesStatus = !statusFilter || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchText, statusFilter]);

  const handleAnnotate = (task: AnnotationTask) => {
    setCurrentTask(task);
    setCurrentTaskIndex(tasks.findIndex(t => t.id === task.id));
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentTask(null);
  };

  const handleSave = (updatedTask: AnnotationTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id 
          ? { ...updatedTask, status: 'annotated' as const, lastUpdate: new Date().toLocaleString() }
          : task
      )
    );
    setCurrentTask(updatedTask);
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length - 1) {
      const nextIndex = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      setCurrentTask(tasks[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      const prevIndex = currentTaskIndex - 1;
      setCurrentTaskIndex(prevIndex);
      setCurrentTask(tasks[prevIndex]);
    }
  };

  const hasNext = currentTaskIndex < tasks.length - 1;
  const hasPrevious = currentTaskIndex > 0;

  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#FFFFFF', 
          borderBottom: '1px solid #E0E0E0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Space align="center">
            <FileTextOutlined style={{ fontSize: 24, color: '#00BFA5' }} />
            <Title level={3} style={{ margin: 0, color: '#222222' }}>
              LLM 对话标注系统
            </Title>
          </Space>
        </Header>
        <Content style={{ padding: '24px' }}>
          <TaskTable
            tasks={filteredTasks}
            onAnnotate={handleAnnotate}
            searchText={searchText}
            onSearchChange={setSearchText}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </Content>
        <AnnotationModal
          visible={modalVisible}
          task={currentTask}
          allTasks={tasks}
          onClose={handleModalClose}
          onSave={handleSave}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </Layout>
    </ConfigProvider>
  );
}

export default App;