import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Sprout } from 'lucide-react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import { marketplaceKeys } from '../../../hooks/useMarketplaceQueries';
import { useCategories } from '../../../hooks/useApiQueries';
import type { Cepa } from '../../../Interfaces/marketplace';
import { marketplaceService } from '../../../services/marketplaceService';
import { presentationPhotoSrc } from '../../../utils/presentationPhoto';
import { Button, Card, ErrorNotice, Field, Input } from '../../ui/shadcn';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
const PAGE_SIZE = 20;
type CategoryOption = { category_id: string; name: string };

function categoryNumbers(ids: string[]): number[] {
  const numbers = ids.map(Number);
  if (numbers.length > 100 || numbers.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error('Selecciona hasta 100 categorías con IDs numéricos válidos.');
  }
  return numbers;
}

const pillBase = 'hu-box-border hu-inline-flex hu-min-h-10 hu-cursor-pointer hu-items-center hu-justify-center hu-gap-2 hu-rounded-full hu-border-2 hu-border-solid hu-px-5 hu-py-2 hu-text-sm hu-font-bold hu-transition-colors disabled:hu-cursor-not-allowed disabled:hu-opacity-50 focus-visible:hu-outline focus-visible:hu-outline-[3px] focus-visible:hu-outline-offset-2 focus-visible:hu-outline-green-300';
const pillPrimary = `${pillBase} hu-border-[#16833b] hu-bg-[#16833b] hu-text-white enabled:hover:hu-border-[#116b30] enabled:hover:hu-bg-[#116b30]`;
const pillOutline = `${pillBase} hu-border-[#5c9b6d] hu-bg-transparent hu-text-white enabled:hover:hu-border-[#16833b] enabled:hover:hu-bg-[#16833b]`;

function CategorySelection({ categories, selected, onChange, disabled, tone = 'light' }: {
  categories: CategoryOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <fieldset disabled={disabled} className="hu-m-0 hu-min-w-0 hu-border-0 hu-p-0 disabled:hu-opacity-60">
      <legend className={`hu-mb-2 hu-p-0 hu-text-sm hu-font-semibold ${dark ? 'hu-text-[#dce9d9]' : 'hu-text-slate-700 dark:hu-text-white'}`}>Categorías de la cepa</legend>
      <div className="hu-flex hu-flex-wrap hu-gap-2">
        {categories.map((category) => {
          const checked = selected.includes(category.category_id);
          const chip = dark
            ? (checked ? 'hu-border-green-300 hu-bg-[#16833b] hu-text-white' : 'hu-border-[#5c9b6d] hu-bg-transparent hu-text-[#dce9d9]')
            : (checked ? 'hu-border-green-700 hu-bg-green-50 hu-text-green-800' : 'hu-border-slate-300 hu-bg-white hu-text-slate-700');
          return (
            <label key={category.category_id} className={`hu-inline-flex hu-max-w-full hu-cursor-pointer hu-items-center hu-gap-2 hu-rounded-full hu-border hu-border-solid hu-px-3 hu-py-1.5 hu-text-sm hu-font-medium hu-transition-colors focus-within:hu-outline focus-within:hu-outline-2 focus-within:hu-outline-offset-2 focus-within:hu-outline-green-400 ${chip}`}>
              <input type="checkbox" className="hu-m-0 hu-h-4 hu-w-4 hu-shrink-0 hu-accent-green-700" checked={checked}
                disabled={!checked && selected.length >= 100}
                onChange={() => onChange(checked
                  ? selected.filter((id) => id !== category.category_id) : [...selected, category.category_id])} />
              <span className="hu-truncate">{category.name}</span>
            </label>
          );
        })}
        {categories.length === 0 && <span className={`hu-text-sm ${dark ? 'hu-text-[#dce9d9]' : 'hu-text-slate-600'}`}>No hay categorías disponibles.</span>}
      </div>
    </fieldset>
  );
}

function cepaErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { message?: string; validationErrors?: string[] } | undefined;
    if (status === 409) {
      return `${body?.message ?? 'La versión cambió o el nombre ya está registrado.'} Recarga la lista e inténtalo nuevamente.`;
    }
    if (body?.validationErrors?.length) return body.validationErrors.join(' ');
    if (body?.message) return body.message;
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (status === 403) return 'No tienes permiso para administrar cepas.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar la solicitud de cepas.';
}

function validatePhoto(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return 'Usa una imagen PNG, JPG, JPEG o WebP.';
  const mime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
  if (file.type !== mime) return 'El tipo MIME no coincide con la extensión de la imagen.';
  if (file.size === 0 || file.size > 2 * 1024 * 1024) return 'La imagen debe tener contenido y pesar máximo 2 MiB.';
  return null;
}

function CepaRow({ cepa, onRename, onUpload, categories, categoriesUnavailable }: {
  cepa: Cepa;
  onRename: (cepa: Cepa, nombre: string, categoryIds: string[]) => Promise<void>;
  onUpload: (cepa: Cepa, photo: File) => Promise<void>;
  categories: CategoryOption[];
  categoriesUnavailable: boolean;
}) {
  const [nombre, setNombre] = useState(cepa.nombre);
  const [categoryIds, setCategoryIds] = useState((cepa.categoryIds ?? []).map(String));
  const [photo, setPhoto] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setNombre(cepa.nombre);
    setCategoryIds((cepa.categoryIds ?? []).map(String));
  }, [cepa.nombre, cepa.version, cepa.categoryIds]);

  const rename = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await onRename(cepa, nombre.trim(), categoryIds);
      setNombre(nombre.trim());
      setNotice('Cepa actualizada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo renombrar la cepa.');
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    if (!photo) return;
    const validation = validatePhoto(photo);
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await onUpload(cepa, photo);
      setNotice('Fotografía cargada.');
      setPhoto(null);
      setFileInputKey((key) => key + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La cepa existe, pero no se pudo cargar la fotografía. Puedes reintentar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="hu-flex hu-min-w-0 hu-flex-col hu-overflow-hidden hu-rounded-2xl hu-bg-[#12301e] hu-text-white hu-shadow-md dark:hu-border dark:hu-border-solid dark:hu-border-[#2f4a38] dark:hu-bg-[#18251e]">
      {cepa.fotografia ? (
        <img className="hu-block hu-aspect-[5/4] hu-w-full hu-bg-[#dfe5dc] hu-object-cover" src={presentationPhotoSrc(cepa.fotografia)} alt={`Fotografía de ${cepa.nombre}`} />
      ) : (
        <div className="hu-grid hu-aspect-[5/4] hu-w-full hu-place-items-center hu-bg-[#1d4029] hu-text-sm hu-font-semibold hu-text-[#dce9d9]">Sin foto</div>
      )}
      <div className="hu-grid hu-flex-1 hu-content-start hu-gap-4 hu-p-4">
        <form className="hu-grid hu-gap-4" onSubmit={rename}>
          <label htmlFor={`cepa-name-${cepa.id}`} className="hu-grid hu-gap-1.5 hu-text-sm hu-font-semibold hu-text-[#dce9d9]">
            Nombre de la cepa
            <Input id={`cepa-name-${cepa.id}`} value={nombre} maxLength={100} required onChange={(event) => setNombre(event.target.value)} />
          </label>
          <CategorySelection tone="dark" categories={categories} selected={categoryIds} onChange={setCategoryIds} disabled={busy || categoriesUnavailable} />
          <button type="submit" className={`${pillPrimary} hu-w-full`} disabled={busy || categoriesUnavailable || !nombre.trim()}>Guardar cambios</button>
        </form>
        <div className="hu-grid hu-gap-2 hu-border-0 hu-border-t hu-border-solid hu-border-[#2f4a38] hu-pt-4">
          <span className="hu-text-sm hu-font-semibold hu-text-[#dce9d9]">Fotografía principal</span>
          <div className="hu-flex hu-min-w-0 hu-items-center hu-gap-3">
            <label className={`${pillOutline} hu-shrink-0 focus-within:hu-outline focus-within:hu-outline-[3px] focus-within:hu-outline-offset-2 focus-within:hu-outline-green-300`}>
              <input key={fileInputKey} id={`cepa-photo-${cepa.id}`} className="hu-sr-only" type="file" accept="image/png,image/jpeg,image/webp"
                disabled={busy} onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
              Elegir archivo
            </label>
            <span className="hu-min-w-0 hu-truncate hu-text-xs hu-text-[#dce9d9]" title={photo?.name}>{photo?.name ?? 'Ningún archivo seleccionado'}</span>
          </div>
          <span className="hu-text-xs hu-text-green-300">PNG, JPG o WebP; máximo 2 MiB.</span>
          <button type="button" className={`${pillOutline} hu-w-full`} disabled={busy || !photo} onClick={() => void upload()}>Cargar fotografía</button>
        </div>
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {notice && <p className="hu-m-0 hu-text-sm hu-font-semibold hu-text-green-300" role="status">{notice}</p>}
      </div>
    </article>
  );
}

export default function CepaManagementPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [nombre, setNombre] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const categories = useCategories();
  const categoriesUnavailable = categories.isPending || categories.isError;
  const query = useQuery({
    queryKey: marketplaceKeys.cepas(page, PAGE_SIZE),
    queryFn: () => marketplaceService.listCepas(page, PAGE_SIZE),
  });
  const invalidateCepas = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['cepas'] }),
      client.invalidateQueries({ queryKey: marketplaceKeys.all }),
    ]);
  };
  const create = useMutation({
    mutationFn: ({ nombre: nextName, categoryIds: ids }: { nombre: string; categoryIds: number[] }) =>
      marketplaceService.createCepa(nextName, ids),
    onSuccess: invalidateCepas,
  });
  const rename = useMutation({
    mutationFn: ({ cepa, nombre: nextName, categoryIds: ids }: { cepa: Cepa; nombre: string; categoryIds: number[] }) =>
      marketplaceService.renameCepa(cepa, nextName, ids),
    onSuccess: invalidateCepas,
  });
  const upload = useMutation({
    mutationFn: ({ cepa, photo }: { cepa: Cepa; photo: File }) => marketplaceService.uploadCepaPhoto(cepa.id, photo),
    onSuccess: invalidateCepas,
  });

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await create.mutateAsync({ nombre: nombre.trim(), categoryIds: categoryNumbers(categoryIds) });
      setNombre('');
      setCategoryIds([]);
      setPage(0);
    } catch (cause) {
      setError(cepaErrorMessage(cause));
    }
  };

  const handleRename = async (cepa: Cepa, nextName: string, ids: string[]) => {
    try {
      await rename.mutateAsync({ cepa, nombre: nextName, categoryIds: categoryNumbers(ids) });
    } catch (cause) {
      throw new Error(cepaErrorMessage(cause));
    }
  };

  const handleUpload = async (cepa: Cepa, photo: File) => {
    try {
      await upload.mutateAsync({ cepa, photo });
    } catch (cause) {
      throw new Error(`No se pudo cargar la fotografía: ${cepaErrorMessage(cause)} La cepa sigue guardada y puedes reintentar.`);
    }
  };

  const totalPages = Math.ceil((query.data?.total ?? 0) / PAGE_SIZE);
  return (
    <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
      <HeaderComponentWithNavigation />
      <AdminNav />
      <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
        <div className="hu-mb-6">
          <h1 className="hu-m-0 hu-font-display hu-text-3xl hu-text-green-800 admin-title">Administración de cepas</h1>
          <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-[#3f4a41] dark:hu-text-white">Crea cepas, asígnalas a categorías y gestiona sus fotografías.</p>
        </div>
        {categories.isPending && <p role="status" className="hu-text-slate-600 dark:hu-text-white">Cargando categorías…</p>}
        {categories.isError && <div className="hu-mb-5"><ErrorNotice>
          {cepaErrorMessage(categories.error)}
          <Button type="button" variant="secondary" onClick={() => void categories.refetch()}>Reintentar categorías</Button>
        </ErrorNotice></div>}
        <div className="hu-grid hu-items-start hu-gap-6 lg:hu-grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
          <Card className="hu-min-w-0 hu-overflow-hidden kanban-board lg:hu-sticky lg:hu-top-4">
            <div className="hu-border-0 hu-border-b hu-border-solid hu-border-slate-100 hu-p-6">
              <span className="hu-mb-4 hu-flex hu-h-11 hu-w-11 hu-items-center hu-justify-center hu-rounded-xl hu-bg-green-100 hu-text-green-800"><Sprout size={21} aria-hidden="true" /></span>
              <h2 className="hu-mb-1 hu-mt-0 hu-text-lg hu-font-bold dark:hu-text-white">Registrar cepa</h2>
              <p className="hu-m-0 hu-text-sm hu-text-slate-500 dark:hu-text-slate-300">Registra la cepa antes de recibir lotes. Podrás cargar su fotografía después de crearla.</p>
            </div>
            <form className="hu-grid hu-gap-5 hu-p-6" onSubmit={(event) => void handleCreate(event)}>
              <Field label="Nueva cepa" htmlFor="new-cepa-name" hint="El nombre normalizado debe ser único.">
                <Input id="new-cepa-name" value={nombre} maxLength={100} required placeholder="Ej. Tangerine" onChange={(event) => setNombre(event.target.value)} />
              </Field>
              <CategorySelection categories={categories.data ?? []} selected={categoryIds} onChange={setCategoryIds} disabled={create.isPending || categoriesUnavailable} />
              <button type="submit" className={`${pillPrimary} hu-w-full`} disabled={!nombre.trim() || create.isPending || categoriesUnavailable}>Crear cepa</button>
              {error && <ErrorNotice>{error}</ErrorNotice>}
            </form>
          </Card>
          <section className="hu-grid hu-min-w-0 hu-gap-4" aria-label="Cepas registradas">
            <div className="hu-flex hu-flex-wrap hu-items-baseline hu-justify-between hu-gap-2">
              <h2 className="hu-m-0 hu-text-xl hu-font-bold hu-text-green-800 admin-title">Cepas registradas</h2>
              {query.data && <span className="hu-text-sm hu-text-[#3f4a41] dark:hu-text-white">{query.data.total} en total</span>}
            </div>
            {query.isPending && <p role="status" className="hu-m-0 hu-text-slate-600 dark:hu-text-white">Cargando cepas…</p>}
            {query.isError && <Card className="hu-grid hu-gap-3 hu-p-5"><ErrorNotice>{cepaErrorMessage(query.error)}</ErrorNotice><Button className="hu-w-fit" variant="secondary" onClick={() => void query.refetch()}>Reintentar</Button></Card>}
            {query.data && query.data.cepas.length === 0 && <p className="hu-m-0 hu-text-slate-600 dark:hu-text-white">No hay cepas registradas.</p>}
            <div className="hu-grid hu-gap-5 sm:hu-grid-cols-2 2xl:hu-grid-cols-3">
              {query.data?.cepas.map((cepa) => <CepaRow key={cepa.id} cepa={cepa}
                onRename={handleRename} onUpload={handleUpload} categories={categories.data ?? []}
                categoriesUnavailable={categoriesUnavailable} />)}
            </div>
            {totalPages > 1 && (
              <nav className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3" aria-label="Paginación de cepas">
                <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
                <span className="hu-text-sm hu-text-slate-700 dark:hu-text-white">Página {page + 1} de {totalPages}</span>
                <Button type="button" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</Button>
              </nav>
            )}
          </section>
        </div>
      </main>
      <FooterComponent />
    </div>
  );
}
