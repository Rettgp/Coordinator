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
        this.name = name;
        this.socket = socket;
        this.procs = procs;
        this.sync_state = SyncState.DEFAULT;
        this.completion_state = CompletionState.WAITING;
        this.main_job = main_job;
        this.sub_job = sub_job;
    }

    get name()
    {
        return this.name
    }
    set name(val)
    {
        this.name = name
    }

    get socket()
    {
        return this.socket
    }
    set socket(val)
    {
        this.socket = val
    }

    get procs()
    {
        return this.procs
    }
    set procs(val)
    {
        this.procs = val
    }

    get sync_state()
    {
        return this.sync_state
    }
    set sync_state(val)
    {
        this.sync_state = val
    }

    get completion_state()
    {
        return this.completion_state
    }
    set completion_state(val)
    {
        this.completion_state = val
    }

    get main_job()
    {
        return this.main_job
    }
    set main_job(val)
    {
        this.main_job = val
    }

    get sub_job()
    {
        return this.sync_state
    }
    set sub_job(val)
    {
        this.sub_job = val
    }

    IsRunning()
    {
        return this.completion_state === CompletionState.RUNNING;
    }
    IsWaiting()
    {
        return this.completion_state === CompletionState.WAITING;
    }

    CompleteTask()
    {
        this.completion_state = CompletionState.TASK_COMPLETED_WAITING;
    }

    StartTask()
    {
        this.completion_state = CompletionState.RUNNING;
    }

    Synced()
    {
        this.sync_state = SyncState.SYNCED;
    }

    SyncWait()
    {
        this.sync_state = SyncState.SYNCING;
    }

    IsSynced()
    {
        return this.sync_state = SyncState.SYNCED;
    }

    IsSyncing()
    {
        return this.sync_state = SyncState.SYNCING;
    }

    Equals(character_class)
    {
        return this.name === character_class.name || this.socket === character_class.socket;
    }
}