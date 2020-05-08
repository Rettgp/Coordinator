const CompletionState = {
    WAITING: "Waiting",
    RUNNING: "Running",
    TASK_COMPLETED_WAITING: "TaskCompletedWaiting",
}
const SyncState = {
    DEFAULT: "Default",
    SYNCING: "Syncing",
    SYNCED: "Synced"
}

export default class Character
{
    constructor(name, socket, procs, main_job, sub_job)
    {
        this.m_name = name;
        this.m_socket = socket;
        this.m_procs = procs;
        this.m_sync_state = SyncState.DEFAULT;
        this.m_completion_state = CompletionState.WAITING;
        this.m_main_job = main_job;
        this.m_sub_job = sub_job;
    }

    get name()
    {
        return this.m_name;
    }
    set name(val)
    {
        this.m_name = val;
    }

    get socket()
    {
        return this.m_socket
    }
    set socket(val)
    {
        this.m_socket = val;
    }

    get procs()
    {
        return this.m_procs;
    }
    set procs(val)
    {
        this.m_procs = val;
    }

    get sync_state()
    {
        return this.m_sync_state;
    }
    set sync_state(val)
    {
        this.m_sync_state = val;
    }

    get completion_state()
    {
        return this.m_completion_state;
    }
    set completion_state(val)
    {
        this.m_completion_state = val;
    }

    get main_job()
    {
        return this.m_main_job;
    }
    set main_job(val)
    {
        this.m_main_job = val;
    }

    get sub_job()
    {
        return this.m_sub_job;
    }
    set sub_job(val)
    {
        this.m_sub_job = val;
    }

    IsRunning()
    {
        return this.m_completion_state === CompletionState.RUNNING;
    }
    IsWaiting()
    {
        return this.m_completion_state === CompletionState.WAITING;
    }

    CompleteTask()
    {
        this.m_completion_state = CompletionState.TASK_COMPLETED_WAITING;
    }

    StartTask()
    {
        this.m_completion_state = CompletionState.RUNNING;
    }

    Synced()
    {
        this.m_sync_state = SyncState.SYNCED;
    }

    SyncWait()
    {
        this.m_sync_state = SyncState.SYNCING;
    }

    IsSynced()
    {
        return this.m_sync_state = SyncState.SYNCED;
    }

    IsSyncing()
    {
        return this.m_sync_state = SyncState.SYNCING;
    }

    ResetStates()
    {
        this.ResetSyncState();
        this.completion_state = CompletionState.WAITING;
    }

    ResetSyncState()
    {
        this.m_sync_state = SyncState.DEFAULT;
    }

    Equals(character_class)
    {
        return this.m_name === character_class.name || this.m_socket === character_class.socket;
    }
}