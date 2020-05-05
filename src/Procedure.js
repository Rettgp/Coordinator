export default class Procedure
{
    constructor(name)
    {
        this.m_name = name
        this.m_active = false;
        this.m_done = false
        this.m_characters = [];
    }

    get name()
    {
        return this.m_name;
    }
    set name(val)
    {
        this.m_name = val;
    }

    get active()
    {
        return this.m_active;
    }
    set active(val)
    {
        this.m_active = val;
    }

    get done()
    {
        return this.m_done;
    }
    set done(val)
    {
        this.m_done = val;
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
            if (!this.m_characters[i].Synced())
            {
                return false;
            }
        }

        return true;
    }
}
