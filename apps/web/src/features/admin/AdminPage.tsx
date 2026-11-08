import { ModulePlaceholder } from '../../components/ModulePlaceholder';

export function AdminPage() {
  return (
    <ModulePlaceholder
      title="Administración"
      description="Gestión de cartas, reglas, erratas, rulings, fuentes y publicaciones. La API administrativa se protegerá con Cloudflare Access."
      note="En la Etapa 1 no existe formulario de acceso ni bypass local. Sin Cloudflare Access configurado, la API administrativa responde 503; sin token válido, 401."
    />
  );
}
