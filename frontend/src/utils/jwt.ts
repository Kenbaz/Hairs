interface JWTPayload {
    user_id: number;
    email: string;
    is_staff: boolean;
    is_superuser: boolean;
    exp: number;
}

export class JWTUtil {
    static decodeToken(token: string): JWTPayload | null {
        try {
            // Split the token and get the payload
            const base64Payload = token.split('.')[1];
            const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }

    static isTokenExpired(token: string): boolean {
        const payload = this.decodeToken(token);
        if (!payload) return true;

        return payload.exp * 1000 < Date.now();
    }

    static isAdminUser(token: string): boolean {
        const payload = this.decodeToken(token);
        if (!payload) return false;

        return payload.is_staff || payload.is_superuser;
    }
}