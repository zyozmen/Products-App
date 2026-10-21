import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import productosService from '../services/ProductosService.js';
import categoryService from '../services/categoryService.js';
import userService from '../services/UserService.js';
import orderService from '../services/OrderService.js';
import AuthenticationService from '../services/AuthenticationService.js';

export interface ProductListFilters {
  searchTerm?: string;
  categoryIds?: string[];
  sortBy?: string;
  sortDir?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxRating?: number;
}

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
  products: ['products'] as const,
  productList: (page: number, size: number, filters: ProductListFilters) =>
    ['products', 'list', page, size, filters] as const,
  product: (id: string) => ['products', 'detail', id] as const,
  featuredProducts: ['products', 'featured'] as const,
  categories: ['categories'] as const,
  adminUsers: ['adminUsers'] as const,
  myOrders: ['myOrders'] as const,
  adminOrders: ['adminOrders'] as const,
};

export function useProductList(page: number, size: number, filters: ProductListFilters) {
  return useQuery({
    queryKey: [...apiQueryKeys.productList(page, size, filters), AuthenticationService.isUserAdmin()],
    queryFn: () => productosService.listarProductos(page, size, filters),
    placeholderData: (previous) => previous,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: apiQueryKeys.product(id),
    queryFn: () => productosService.detalleProducto(id),
    enabled: Boolean(id),
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: apiQueryKeys.featuredProducts,
    queryFn: () => productosService.listarDestacados(),
    staleTime: 5 * 60 * 1000,
  });
}

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
export function useProductMutations() {
  const queryClient = useQueryClient();
  const invalidateProducts = () =>
    queryClient.invalidateQueries({ queryKey: apiQueryKeys.products });

  const createProduct = useMutation({
    mutationFn: (product: Parameters<typeof productosService.crearProducto>[0]) =>
      productosService.crearProducto(product),
    onSuccess: invalidateProducts,
  });
  const updateProduct = useMutation({
    mutationFn: ({ id, product }: {
      id: string;
      product: Parameters<typeof productosService.actualizarProducto>[1];
    }) => productosService.actualizarProducto(id, product),
    onSuccess: (_data, variables) => Promise.all([
      invalidateProducts(),
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.product(variables.id) }),
    ]),
  });
  const deleteProduct = useMutation({
    mutationFn: (id: string) => productosService.eliminarProducto(id),
    onSuccess: invalidateProducts,
  });
  const uploadProductImages = useMutation({
    mutationFn: ({ id, principal, secondary }: {
      id: string;
      principal: File | null;
      secondary: File[];
    }) => productosService.subirImagenesProducto(id, principal, secondary),
    onSuccess: (_data, variables) => Promise.all([
      invalidateProducts(),
      queryClient.invalidateQueries({ queryKey: apiQueryKeys.product(variables.id) }),
    ]),
  });

  return { createProduct, updateProduct, deleteProduct, uploadProductImages };
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
  return {
    create: useMutation({
      mutationFn: (order: Parameters<typeof orderService.createOrder>[0]) => orderService.createOrder(order),
      onSuccess: invalidateOrders,
    }),
    createPqr: useMutation({
      mutationFn: (order: Parameters<typeof orderService.createPqrOrder>[0]) => orderService.createPqrOrder(order),
      onSuccess: invalidateOrders,
    }),
    updateStatus: useMutation({
      mutationFn: ({ id, status, extra }: {
        id: string;
        status: string;
        extra?: Record<string, unknown>;
      }) => orderService.updateOrderStatus(id, status, extra),
      onSuccess: invalidateOrders,
    }),
  };
}
