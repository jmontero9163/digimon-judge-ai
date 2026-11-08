import { ModulePlaceholder } from '../../components/ModulePlaceholder';

export function UsersPage() {
  return (
    <ModulePlaceholder
      title="Usuarios y acceso administrativo"
      description="Roles, permisos y sincronización de identidades de Cloudflare Access con la tabla de usuarios de D1."
      note="Los usuarios de la aplicación se incorporarán después del MVP administrativo. No se almacenarán contraseñas."
    />
  );
}
