import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, BarChart3, ListChecks, Activity } from "lucide-react";
import KanbanBoard from "../components/projects/KanbanBoard";
import GanttChart from "../components/projects/GanttChart";
import ProjectMetrics from "../components/projects/ProjectMetrics";
import ProjectDetailHeader from "../components/projects/ProjectDetailHeader";
import TaskDetailModal from "../components/projects/TaskDetailModal";
import TaskForm from "../components/tasks/TaskForm";
import ProjectForm from "../components/projects/ProjectForm";
import TaskItem from "../components/tasks/TaskItem";

export default function ProjectDetail({ projectId, onBack }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState("pending");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }).then(r => r[0]),
    enabled: !!projectId,
  });

  const { data: allProjects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const task = tasks.find(t => t.id === result.draggableId);
    if (!task) return;
    updateTask.mutate({ id: task.id, data: { ...task, status: result.destination.droppableId } });
  };

  const handleAddTask = (status) => {
    setNewTaskStatus(status);
    setShowTaskForm(true);
  };

  const handleCreateTask = (data) => {
    createTask.mutate({ ...data, status: data.status || newTaskStatus });
  };

  const completedCount = tasks.filter(t => t.status === "completed").length;

  if (!project) return <div className="p-8 text-center text-muted-foreground">Cargando proyecto...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-full">
      <ProjectDetailHeader
        project={project}
        taskCount={tasks.length}
        completedCount={completedCount}
        onBack={onBack}
        onEdit={() => setShowProjectForm(true)}
      />

      <Tabs defaultValue="kanban">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban" className="gap-2"><LayoutGrid className="w-4 h-4" /> Kanban</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><ListChecks className="w-4 h-4" /> Lista</TabsTrigger>
          <TabsTrigger value="gantt" className="gap-2"><BarChart3 className="w-4 h-4" /> Gantt</TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2"><Activity className="w-4 h-4" /> Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <KanbanBoard
            tasks={tasks}
            onTaskClick={setSelectedTask}
            onAddTask={handleAddTask}
            onDragEnd={handleDragEnd}
          />
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-2">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => { setNewTaskStatus("pending"); setShowTaskForm(true); }} className="gap-2">
                + Nueva Tarea
              </Button>
            </div>
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={(t) => setSelectedTask(t)}
                onDelete={(t) => deleteTask.mutate(t.id)}
                onStatusChange={(t, status) => updateTask.mutate({ id: t.id, data: { ...t, status } })}
              />
            ))}
            {tasks.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Sin tareas aún</div>}
          </div>
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart tasks={tasks} project={project} />
        </TabsContent>

        <TabsContent value="metrics">
          <ProjectMetrics project={project} tasks={tasks} />
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={(data) => {
          updateTask.mutate({ id: selectedTask.id, data });
          setSelectedTask(null);
        }}
        onDelete={(t) => {
          deleteTask.mutate(t.id);
          setSelectedTask(null);
        }}
      />

      {/* Create Task Form */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        onSave={handleCreateTask}
        task={{ status: newTaskStatus, project_id: projectId }}
        projects={allProjects}
      />

      {/* Edit Project Form */}
      <ProjectForm
        open={showProjectForm}
        onOpenChange={setShowProjectForm}
        onSave={(data) => updateProject.mutate({ id: project.id, data })}
        project={project}
      />
    </div>
  );
}