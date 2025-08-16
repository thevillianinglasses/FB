import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import toast from 'react-hot-toast';

// Department Hooks
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/api/departments');
      return response.data;
    },
    staleTime: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: false,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (departmentData) => {
      const response = await api.post('/api/departments', departmentData);
      return response.data;
    },
    onMutate: async (newDepartment) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['departments'] });
      
      // Snapshot the previous value
      const previousDepartments = queryClient.getQueryData(['departments']);
      
      // Optimistically update to the new value
      const optimisticDepartment = {
        id: `temp-${Date.now()}`,
        name: newDepartment.name.toUpperCase(),
        description: newDepartment.description || '',
        headDoctorId: newDepartment.headDoctorId,
        location: newDepartment.location || '',
        contactPhone: newDepartment.contactPhone || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: true // Mark as pending
      };
      
      queryClient.setQueryData(['departments'], old => 
        old ? [...old, optimisticDepartment] : [optimisticDepartment]
      );
      
      return { previousDepartments, optimisticDepartment };
    },
    onError: (err, newDepartment, context) => {
      // Rollback on error
      if (context?.previousDepartments) {
        queryClient.setQueryData(['departments'], context.previousDepartments);
      }
      
      // Show error toast
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create department';
      toast.error(errorMessage);
    },
    onSuccess: (data, variables, context) => {
      toast.success('Department created successfully!');
      
      // Replace the optimistic update with real data
      queryClient.setQueryData(['departments'], old => {
        if (!old) return [data];
        return old.map(dept => 
          dept.id === context?.optimisticDepartment?.id ? data : dept
        );
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    }
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...departmentData }) => {
      const response = await api.put(`/api/departments/${id}`, departmentData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Department updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update department';
      toast.error(errorMessage);
    }
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (departmentId) => {
      const response = await api.delete(`/api/departments/${departmentId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Department deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete department';
      toast.error(errorMessage);
    }
  });
};

// Doctor Hooks
export const useDoctors = (departmentId = null) => {
  return useQuery({
    queryKey: departmentId ? ['doctors', departmentId] : ['doctors'],
    queryFn: async () => {
      const params = departmentId ? { departmentId } : {};
      const response = await api.get('/api/doctors', { params });
      return response.data;
    },
    staleTime: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: false,
  });
};

export const useCreateDoctor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (doctorData) => {
      const response = await api.post('/api/doctors', doctorData);
      return response.data;
    },
    onMutate: async (newDoctor) => {
      // Cancel any outgoing refetches
      const doctorQueries = [['doctors']];
      if (newDoctor.departmentId) {
        doctorQueries.push(['doctors', newDoctor.departmentId]);
      }
      
      await Promise.all(
        doctorQueries.map(queryKey => 
          queryClient.cancelQueries({ queryKey })
        )
      );
      
      // Snapshot the previous values
      const previousData = {};
      doctorQueries.forEach(queryKey => {
        previousData[JSON.stringify(queryKey)] = queryClient.getQueryData(queryKey);
      });
      
      // Optimistically update
      const optimisticDoctor = {
        id: `temp-${Date.now()}`,
        name: newDoctor.name,
        degree: newDoctor.degree || '',
        departmentId: newDoctor.departmentId,
        phone: newDoctor.phone || '',
        email: newDoctor.email || '',
        fee: newDoctor.fee || '500',
        availabilityNote: newDoctor.availabilityNote || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: true
      };
      
      doctorQueries.forEach(queryKey => {
        queryClient.setQueryData(queryKey, old => 
          old ? [...old, optimisticDoctor] : [optimisticDoctor]
        );
      });
      
      return { previousData, optimisticDoctor };
    },
    onError: (err, newDoctor, context) => {
      // Rollback on error
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKeyStr, data]) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create doctor';
      toast.error(errorMessage);
    },
    onSuccess: (data, variables, context) => {
      toast.success('Doctor created successfully!');
      
      // Replace optimistic update with real data
      const doctorQueries = [['doctors']];
      if (data.departmentId) {
        doctorQueries.push(['doctors', data.departmentId]);
      }
      
      doctorQueries.forEach(queryKey => {
        queryClient.setQueryData(queryKey, old => {
          if (!old) return [data];
          return old.map(doctor => 
            doctor.id === context?.optimisticDoctor?.id ? data : doctor
          );
        });
      });
    },
    onSettled: (data) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      if (data?.departmentId) {
        queryClient.invalidateQueries({ queryKey: ['doctors', data.departmentId] });
      }
    }
  });
};

export const useUpdateDoctor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...doctorData }) => {
      const response = await api.put(`/api/doctors/${id}`, doctorData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Doctor updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update doctor';
      toast.error(errorMessage);
    }
  });
};

export const useDeleteDoctor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (doctorId) => {
      const response = await api.delete(`/api/doctors/${doctorId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Doctor deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
    onError: (err) => {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete doctor';
      toast.error(errorMessage);
    }
  });
};