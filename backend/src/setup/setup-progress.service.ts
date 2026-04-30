import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

/**
 * Shape of one progress event surfaced to the wizard's terminal.
 *
 * `stage` is a short machine identifier — the frontend uses it to
 * group successive `started` / `progress` / `completed` events under
 * the same step heading. `message` is the human-facing line shown in
 * the terminal exactly as written.
 */
export interface SetupProgressEvent {
    /** Stable id like 'license' / 'schema-build' / 'db-push' / 'admin-user'. */
    stage: string;
    /** Where the stage is in its lifecycle. */
    status: 'started' | 'progress' | 'completed' | 'failed';
    /** Operator-facing description ("Pushing schema to database…"). */
    message: string;
    /** Optional structured payload — e.g. error stack or count. */
    detail?: string;
    /** Server time the event was emitted. */
    timestamp: string;
}

/**
 * Process-global event bus the setup wizard streams through SSE.
 *
 * Why a singleton Subject and not per-request:
 *   The wizard's flow is "open SSE first, THEN POST /setup/complete".
 *   The two requests are different HTTP transactions, so we need a
 *   shared bus they can both reach. First-boot setup is by definition
 *   single-tenant and single-admin (the wizard refuses to run a second
 *   time once `setup_complete` is true), so concurrency isn't a
 *   concern — only one stream is ever active at once.
 *
 * If we ever need to support concurrent setups (e.g. Mero-Cloud demo
 * provisioning), we can swap the Subject for a Map<sessionId, Subject>
 * keyed by a token the wizard sends in both requests. For now, KISS.
 */
@Injectable()
export class SetupProgressService {
    private subject = new Subject<SetupProgressEvent>();

    /** Observable consumed by the @Sse() endpoint. */
    get events$(): Observable<SetupProgressEvent> {
        return this.subject.asObservable();
    }

    emit(event: Omit<SetupProgressEvent, 'timestamp'>) {
        this.subject.next({
            ...event,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Convenience helpers — keep `completeSetup` callsites readable.
     * The `started`/`completed` pair brackets a unit of work; `failed`
     * is for when an exception is about to be thrown so the UI can
     * paint the bad line red before the request actually 500s.
     */
    started(stage: string, message: string) {
        this.emit({ stage, status: 'started', message });
    }
    progress(stage: string, message: string) {
        this.emit({ stage, status: 'progress', message });
    }
    completed(stage: string, message: string) {
        this.emit({ stage, status: 'completed', message });
    }
    failed(stage: string, message: string, detail?: string) {
        this.emit({ stage, status: 'failed', message, detail });
    }
}
