export default class Procedure
{
    constructor(name)
    {
        this.m_name = name;
        this.m_running = false;
        this.m_queued = false;
        this.m_done = false;
        this.m_characters = [];
        this.m_selected = false;
        this.m_repeat_count = 1;
        this.m_current_it = this.m_repeat_count;
        this.m_progress = 0;
    }

    get name()
    {
        return this.m_name;
    }
    set name(val)
    {
        this.m_name = val;
    }

    get running()
    {
        return this.m_running;
    }
    set running(val)
    {
        this.m_running = val;
    }

    get done()
    {
        return this.m_done;
    }
    set done(val)
    {
        this.m_done = val;
    }

    get selected()
    {
        return this.m_selected;
    }
    set selected(val)
    {
        this.m_selected = val;
    }

    get repeat_count()
    {
        return this.m_repeat_count;
    }
    set repeat_count(val)
    {
        this.m_repeat_count = val;
    }
    
    get queued()
    {
        return this.m_queued;
    }
    set queued(val)
    {
        this.m_queued = val;
    }
    
    get current_it()
    {
        return this.m_current_it;
    }
    set current_it(val)
    {
        this.m_current_it = val;
        this.m_progress = (this.m_current_it / this.m_repeat_count) * 100;
    }

    get progress()
    {
        return this.m_progress;
    }
    set progress(val)
    {
        this.m_progress = val;
    }

    get characters()
    {
        return this.m_characters;
    }
    set characters(val)
    {
        this.m_characters = val;
    }
    AddCharacter(character)
    {
        this.m_characters.push(character);
    }
    FindCharacter(character)
    {
        for (let i = 0; i < this.m_characters.length; ++i)
        {
            if (this.m_characters[i].Equals(character))
            {
                return this.m_characters[i];
            }
        }

        return null
    }
    IsSyncronized()
    {
        for (let i = 0; i < this.m_characters.length; ++i)
        {
            if (!this.m_characters[i].IsSynced())
            {
                console.log(`${this.m_characters[i].name} is not synced`)
                return false;
            }
        }

        return true;
    }
    Load()
    {
        if (this.repeat_count <= 0)
        {
            this.done = true;
            this.running = false;
            this.queued = false;
            return false;
        }
        this.done = false;
        this.queued = false;

        let any_character_running = this.characters.some((element) => element.IsRunning());
        if (any_character_running)
        {
            this.queued = true;
            return false;
        }

        for (let i = 0; i < this.characters.length; ++i)
        {
            this.characters[i].StartTask()
            this.characters[i].socket.write(`load,${this.name}\n`);
        }

        this.running = true;
        return true;
    }
    Stop()
    {
        this.done = true
        this.running = false
        for (let i = 0; i < this.characters.length; ++i)
        {
            this.characters[i].CompleteTask()
            this.characters[i].socket.write(`unload\n`);
        }
    }
}
