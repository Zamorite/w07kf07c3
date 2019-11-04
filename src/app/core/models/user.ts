export interface Roles { 
    employee?: boolean;
    employer?: boolean;
    admin?: boolean;
 }
  
export interface User {
    uid: string;
    email: string;
    roles: Roles;
}