import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectForm from "../components/projects/ProjectForm";

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const handleSave = (data) => {
    if (editProject) {
      updateMutation.mutate({ id: editProject.id, data });
    } else {
      createMutation.mutate(data);
    }
    setEditProject(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
        </div>
        <Button onClick={() => { setEditProject(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const projectTasks = tasks.filter(t => t.project_id === project.id);
          const completedTasks = projectTasks.filter(t => t.status === "completed");
          return (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={projectTasks.length}
              completedCount={completedTasks.length}
              onClick={() => { setEditProject(project); setShowForm(true); }}
            />
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aún no tienes proyectos. ¡Crea tu primer proyecto!</p>
        </div>
      )}

      <ProjectForm
        open={showForm}
        onOpenChange={setShowForm}
        onSave={handleSave}
        project={editProject}
      />
    </div>
  );
}