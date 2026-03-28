import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/apiClient.js";

export const generationKeys = {
  generatedAssessments: ["generated-assessments"],
  generatedAssessment: (id) => ["generated-assessments", id],
  referenceMaterials: ["reference-materials"],
};

export const useGeneratedAssessments = () =>
  useQuery({
    queryKey: generationKeys.generatedAssessments,
    queryFn: async () => {
      const { data } = await apiClient.get("/api/generated-assessments");
      return data.assessments ?? [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useGeneratedAssessment = (id) =>
  useQuery({
    queryKey: generationKeys.generatedAssessment(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/generated-assessments/${id}`);
      return data.generatedAssessment;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useGenerateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        "/api/generated-assessments/generate",
        payload
      );
      return data.generatedAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: generationKeys.generatedAssessments,
      });
    },
  });
};

export const useReferenceMaterials = () =>
  useQuery({
    queryKey: generationKeys.referenceMaterials,
    queryFn: async () => {
      const { data } = await apiClient.get("/api/reference-materials");
      return data.materials ?? [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useUploadReferenceMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const { data } = await apiClient.post("/api/reference-materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return data.materials ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: generationKeys.referenceMaterials });
    },
  });
};
