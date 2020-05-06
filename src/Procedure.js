export default class Procedure
{
    constructor(name)
    {
        this.m_name = name
        this.m_running = false;
        this.m_done = false
        this.m_characters = [];
        this.m_selected = false
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
}
