import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import categoryService from '../services/categoryService.js';
import userService from '../services/UserService.js';
import orderService from '../services/OrderService.js';
import { settlementKeys } from './useSettlementQueries';
import { marketplaceKeys } from './useMarketplaceQueries';

export interface AdminUser {
  username: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  direccion?: string;
  telefono?: string;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string;
  role?: string;
  state?: string;
}

export const apiQueryKeys = {
  categories: ['categories'] as const,
  adminUsers: ['adminUsers'] as const,
  myOrders: ['myOrders'] as const,
  adminOrders: ['adminOrders'] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: apiQueryKeys.categories,
    queryFn: () => categoryService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

export interface CategoryPayload {
  id?: string;
  name: string;
  description: string;
  image?: File | null;
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();
  return {
    saveCategory: useMutation({
      mutationFn: (category: CategoryPayload) => categoryService.saveCategory(category),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: apiQueryKeys.categories }),
    }),
  };
}

export function useAdminUsers(enabled = true) {
  return useQuery<AdminUser[]>({
    queryKey: apiQueryKeys.adminUsers,
    queryFn: () => userService.getUsers(),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: apiQueryKeys.adminUsers });
  return {
    updateState: useMutation({
      mutationFn: ({ username, state }: { username: string; state: string }) =>
        userService.updateUserState(username, state),
      onMutate: async ({ username, state }) => {
        await queryClient.cancelQueries({ queryKey: apiQueryKeys.adminUsers });
        const previousUsers = queryClient.getQueryData<AdminUser[]>(apiQueryKeys.adminUsers);
        queryClient.setQueryData<AdminUser[]>(apiQueryKeys.adminUsers, (users = []) =>
          users.map((user) => user.username === username ? { ...user, state } : user),
        );
        return { previousUsers };
      },
      onError: (_error, _variables, context) => {
        if (context?.previousUsers) {
          queryClient.setQueryData(apiQueryKeys.adminUsers, context.previousUsers);
        }
      },
      onSettled: invalidateUsers,
    }),
    resetPassword: useMutation({
      mutationFn: ({ username, password }: { username: string; password: string }) =>
        userService.resetPassword(username, password),
    }),
    updateProfile: useMutation({
      mutationFn: (profile: Parameters<typeof userService.updateProfile>[0]) =>
        userService.updateProfile(profile),
      onSuccess: invalidateUsers,
    }),
    register: useMutation({
      mutationFn: (user: Parameters<typeof userService.registerUser>[0]) => userService.registerUser(user),
    }),
  };
}

export function useMyOrders() {
  return useQuery({
    queryKey: apiQueryKeys.myOrders,
    queryFn: () => orderService.getMyOrders(),
  });
}

export function useAdminOrders(enabled = true) {
  return useQuery({
    queryKey: apiQueryKeys.adminOrders,
    queryFn: () => orderService.getAllOrders(),
    enabled,
    refetchInterval: 30 * 1000,
  });
}

export function useOrderMutations() {
  const queryClient = useQueryClient();
  const invalidateOrders = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.adminOrders }),
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.myOrders }),
  ]);
  // Una respuesta de error o incierta pudo haber cambiado orden, stock y acumulados en el servidor.
  const refreshServerState = () => Promise.all([
    invalidateOrders(),
    queryClient.invalidateQueries({ queryKey: settlementKeys.all }),
    queryClient.invalidateQueries({ queryKey: marketplaceKeys.all }),
  ]);
  return {
    create: useMutation({
      mutationFn: (order: Parameters<typeof orderService.createOrder>[0]) => orderService.createOrder(order),
      onSuccess: invalidateOrders,
    }),
    createPqr: useMutation({
      mutationFn: (order: Parameters<typeof orderService.createPqrOrder>[0]) => orderService.createPqrOrder(order),
      onSettled: refreshServerState,
    }),
    updateStatus: useMutation({
      mutationFn: ({ id, status, extra }: {
        id: string;
        status: string;
        extra?: Record<string, unknown>;
      }) => orderService.updateOrderStatus(id, status, extra),
      onSettled: refreshServerState,
    }),
  };
}
