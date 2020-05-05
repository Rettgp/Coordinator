export default class Procedure
{
    constructor(name)
    {
        this.name = name
        this.active = false;
        this.done = false
        this.characters = [];
    }

    get name()
    {
        return this.name;
    }
    set name(val)
    {
        this.name = val;
    }

    get active()
    {
        return this.active;
    }
    set active(val)
    {
        this.active = val;
    }

    get done()
    {
        return this.done;
    }
    set done(val)
    {
        this.done = val;
    }

    get characters()
    {
        return this.characters;
    }
    set characters(val)
    {
        this.characters = val;
    }
    AddCharacter(character)
    {
        this.characters.push(character);
    }
    FindCharacter(character)
    {
        for (let i = 0; i < this.characters.length; ++i)
        {
            if (this.characters[i].Equals(character))
            {
                return this.characters[i];
            }
        }

        return null
    }
    IsSyncronized()
    {
        for (let i = 0; i < this.characters.length; ++i)
        {
            if (!this.characters[i].Synced())
            {
                return false;
            }
        }

        return true;
    }
}
