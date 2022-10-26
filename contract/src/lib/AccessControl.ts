import { assert, LookupMap, near } from 'near-sdk-js';

import { EventLogData } from '../nep/NEP-297';
import { emit } from '../util';

export const DEFAULT_ADMIN_ROLE = 'DEFAULT_ADMIN_ROLE';

export type RoleAdminChangedEventLogData = EventLogData<
  'role_admin_changed',
  { role: string; previousAdminRole: string; adminRole: string }[]
>;

export type RoleGrantedEventLogData = EventLogData<
  'role_granted',
  { role: string; account: string; sender: string }[]
>;

export type RoleRevokedEventLogData = EventLogData<
  'role_revoked',
  { role: string; account: string; sender: string }[]
>;

export type RoleData = {
  members: { [key: string]: boolean | undefined };
  adminRole: string;
};

export interface AccessControl {
  roles: LookupMap;
}

export function hasRole(
  contract: AccessControl,
  role: string,
  account: string,
): boolean {
  const roleData = contract.roles.get(role) as RoleData | null;
  if (!roleData) {
    return false;
  }
  return !!roleData.members[account];
}

export function assertRole(
  contract: AccessControl,
  role: string,
  account: string,
): void {
  assert(
    hasRole(contract, role, account),
    `AccessControl: account ${account} is missing role ${role}`,
  );
}

export function getRoleAdmin(contract: AccessControl, role: string): string {
  const roleData = contract.roles.get(role) as RoleData | null;
  if (roleData) {
    return roleData.adminRole;
  }
  return DEFAULT_ADMIN_ROLE;
}

export function grantRole(
  contract: AccessControl,
  role: string,
  account: string,
): boolean {
  assertRole(
    contract,
    getRoleAdmin(contract, role),
    near.predecessorAccountId(),
  );
  return setRole(contract, role, account);
}

export function revokeRole(
  contract: AccessControl,
  role: string,
  account: string,
): boolean {
  assertRole(
    contract,
    getRoleAdmin(contract, role),
    near.predecessorAccountId(),
  );
  return deleteRole(contract, role, account);
}

export function renounceRole(
  contract: AccessControl,
  role: string,
  account: string,
): boolean {
  assert(
    account == near.predecessorAccountId(),
    'AccessControl: can only renounce roles for self',
  );
  return deleteRole(contract, role, account);
}

export function setRoleAdmin(
  contract: AccessControl,
  role: string,
  adminRole: string,
): boolean {
  const previousAdminRole = getRoleAdmin(contract, role);
  let roleData = contract.roles.get(role) as RoleData | null;
  if (roleData) {
    if (previousAdminRole === roleData.adminRole) {
      return false;
    }
    roleData.adminRole = adminRole;
  } else {
    roleData = {
      adminRole: adminRole,
      members: {},
    };
  }
  contract.roles.set(role, roleData);
  const roleAdminChangedEventLogData: RoleAdminChangedEventLogData = {
    event: 'role_admin_changed',
    data: [
      {
        role,
        previousAdminRole,
        adminRole,
      },
    ],
  };
  emit(roleAdminChangedEventLogData);
  return true;
}

export function setRole(
  contract: AccessControl,
  role: string,
  account: string,
): boolean {
  if (!hasRole(contract, role, account)) {
    let roleData = contract.roles.get(role) as RoleData | null;
    if (roleData) {
      roleData.members[account] = true;
    } else {
      roleData = {
        adminRole: DEFAULT_ADMIN_ROLE,
        members: {
          [account]: true,
        },
      };
    }
    contract.roles.set(role, roleData);
    const roleGrantedEventLogData: RoleGrantedEventLogData = {
      event: 'role_granted',
      data: [
        {
          role,
          account,
          sender: near.predecessorAccountId(),
        },
      ],
    };
    emit(roleGrantedEventLogData);
    return true;
  }
  return false;
}

export function deleteRole(
  contract: AccessControl,
  role: string,
  account: string,
): boolean {
  if (hasRole(contract, role, account)) {
    const roleData = contract.roles.get(role) as RoleData | null;
    if (roleData && roleData.members) {
      delete roleData.members[account];
      const roleRevokedEventLogData: RoleRevokedEventLogData = {
        event: 'role_revoked',
        data: [
          {
            role,
            account,
            sender: near.predecessorAccountId(),
          },
        ],
      };
      emit(roleRevokedEventLogData);
      return true;
    }
  }
  return false;
}
