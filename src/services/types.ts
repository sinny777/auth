import { UserProfile } from "@loopback/security";

export interface TokenServiceI {

    generateRefreshToken(userProfile: UserProfile): Promise<string> ;
   
}