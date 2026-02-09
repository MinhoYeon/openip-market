export type UserRole = 'Owner' | 'Buyer' | 'Broker' | 'Valuator' | 'Admin';

export interface Permission {
  action: string;
  resource: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Owner: ['ip:create', 'ip:view_own', 'deal:negotiate', 'doc:upload'],
  Buyer: ['ip:view_all', 'demand:create', 'deal:propose', 'deal:negotiate'],
  Broker: ['ip:view_all', 'mandate:manage', 'deal:mediating', 'doc:upload'],
  Valuator: ['ip:view_assigned', 'ip:evaluate', 'doc:view'],
  Admin: ['*']
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const hasPermission = (user: User, permission: string): boolean => {
  if (user.role === 'Admin') return true;
  const permissions = ROLE_PERMISSIONS[user.role];
  return permissions.includes(permission) || permissions.includes('*');
};
