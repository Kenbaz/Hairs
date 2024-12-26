import { store } from "../_redux/store";
import { logout } from "../_redux/authSlice";


export class SessionManager {
    private static instance: SessionManager;
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private readonly timeoutDuration: number = 30 * 60 * 1000; // 30 minutes
    private readonly events: readonly string[] = [
        'mousedown',
        'keydown',
        'touchstart',
        'scroll',
    ] as const;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.setUpEventListeners();
        }
    };


    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    };


    private setUpEventListeners(): void {
        this.events.forEach((event) => {
            window.addEventListener(event, () => this.resetTimer());
        });

        // Set up visibility change event
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkSession();
            }
        });
    }


    private resetTimer(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => this.handleTimeout(), this.timeoutDuration);
    };


    private handleTimeout(): void {
        store.dispatch(logout());
    };


    public startSession(): void { 
        this.resetTimer();
    };


    public endSession(): void { 
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    };


    private async checkSession(): Promise<void> { 
        const state = store.getState();
        const accessToken = state.auth.accessToken;

        if (!accessToken) {
            store.dispatch(logout());
        }
    };


    // Optional: Method to change the timeout duration
    // public setTimeoutDuration(duration: number): void { 
    //     if (duration < 0) {
    //         throw new Error('Timeout duration must be a positive number');
    //     }
    //     (this as { timeoutDuration: number }).timeoutDuration = duration;
    //     this.resetTimer();
    // }
}