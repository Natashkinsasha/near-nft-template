import {assert, LookupMap, near} from "near-sdk-js";
import {EventLogData} from "../nep/NEP-297";

export type RoleAdminChangedEventLogData = EventLogData<"role_admin_changed",{role, previousAdminRole, adminRole}[]>;

export type RoleGrantedEventLogData = EventLogData<"role_granted",{role, account, sender}[]>

export type RoleRevokedEventLogData = EventLogData<"role_revoked",{role, account, sender}[]>

export type RoleData  = {
    members: {[key: string]: boolean | undefined};
    adminRole: string;
}

export class AccessControl {

    private readonly roles: LookupMap = new LookupMap('roles');

    static DEFAULT_ADMIN_ROLE = 'DEFAULT_ADMIN_ROLE';


    hasRole(role: string, account: string): boolean {
        const roleData = this.roles.get(role) as RoleData | null;
        if(!roleData){
            return false;
        }
        return !!roleData.members[account];
    }


    assertRole(role: string, account: string): void {
        assert(this.hasRole(role, account), `AccessControl: account ${account} is missing role ${role}`);
    }

    getRoleAdmin(role: string): string  {
        const roleData = this.roles.get(role) as RoleData | null;
        if(roleData){
            return roleData.adminRole;
        }
        return AccessControl.DEFAULT_ADMIN_ROLE;
    }


    grantRole(role: string, account: string): boolean {
        this.assertRole(this.getRoleAdmin(role), near.predecessorAccountId())
        return this.setRole(role, account);
    }

    revokeRole(role: string, account: string): boolean {
        this.assertRole(this.getRoleAdmin(role), near.predecessorAccountId())
        return this.deleteRole(role, account);
    }

   renounceRole(role: string, account: string): boolean{
        assert(account == near.predecessorAccountId(), "AccessControl: can only renounce roles for self");
        return this.deleteRole(role, account);
    }


    setRoleAdmin(role: string, adminRole: string): boolean{
        const previousAdminRole = this.getRoleAdmin(role);
        let roleData = this.roles.get(role) as RoleData | null;
        if(roleData) {
            if(previousAdminRole === roleData.adminRole){
                return false;
            }
            roleData.adminRole = adminRole;
        } else {
            roleData = {
                adminRole: adminRole,
                members: {}
            }
        }
        this.roles.set(role, roleData);
        const roleAdminChangedEventLogData: RoleAdminChangedEventLogData  = {
            event: "role_admin_changed",
            data: [{
                role, previousAdminRole, adminRole
            }]
        }
        near.log(`EVENT_JSON:${JSON.stringify(roleAdminChangedEventLogData)}`);
        return true;
    }

    setRole(role: string, account: string): boolean{
        if (!this.hasRole(role, account)) {
            let roleData = this.roles.get(role) as RoleData | null;
            if(roleData){
                roleData.members[account] = true;
            } else {
                roleData = {
                    adminRole: AccessControl.DEFAULT_ADMIN_ROLE,
                    members: {
                        [account]: true
                    }
                }
            }
            this.roles.set(role, roleData);
            const roleGrantedEventLogData: RoleGrantedEventLogData  = {
                event: "role_granted",
                data: [{
                    role, account, sender: near.predecessorAccountId()
                }]
            }
            near.log(`EVENT_JSON:${JSON.stringify(roleGrantedEventLogData)}`);
            return true;
        }
        return false;
    }

    deleteRole(role: string, account: string): boolean{
        if (this.hasRole(role, account)) {
            const roleData = this.roles.get(role) as RoleData | null;
            if(roleData && roleData.members){
                delete roleData.members[account];
                const roleRevokedEventLogData: RoleRevokedEventLogData  = {
                    event: "role_revoked",
                    data: [{
                        role, account, sender: near.predecessorAccountId()
                    }]
                }
                near.log(`EVENT_JSON:${JSON.stringify(roleRevokedEventLogData)}`);
                return true;
            }
        }
        return false
    }
}