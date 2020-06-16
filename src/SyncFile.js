import Procedure from 'Procedure';

export default class SyncFile
{
    constructor(name, procedures = [], loop_count = 0)
    {
        this.m_name = name;
        this.m_procedures = procedures;
        this.m_loop_count = loop_count;
    }

    get name()
    {
        return this.m_name;
    }
    set name(val)
    {
        this.m_name = val;
    }

    get procedures()
    {
        return this.m_procedures
    }
    set procedures(val)
    {
        this.m_procedures = val;
    }

    get loop_count()
    {
        return this.m_loop_count;
    }
    set loop_count(val)
    {
        this.m_loop_count = val;
    }

    Save()
    {
        var data = {
            name: this.name,
            procedures: [],
            loop_count: this.m_loop_count
        }
        for (let i = 0; i < this.procedures.length; ++i)
        {
            let procedure = {
                name: this.procedures[i].name,
                repeat_count: this.procedures[i].repeat_count,
                characters: []
            }
            for (let j = 0; j < this.procedures[i].characters; ++j)
            {
                procedure.characters.push({
                    name: this.procedures[i].characters[j].name
                })
            }
            data.procedures.push(procedure)
        }
        let fs = require('fs');
        const {remote} = require('electron')
        let app_dir = remote.app.getPath('appData');
        if (!fs.existsSync(`${app_dir}/coordinator/templates`))
        {
            fs.mkdirSync(`${app_dir}/coordinator/templates`);
        }
        fs.writeFile(`${app_dir}/coordinator/templates/${this.name}.json`, JSON.stringify(data), function (err)
            {
                if (err) throw err;
            }
        );
    }
    
    Load()
    {
        let fs = require('fs');
        let Path = require('path');
        const {remote} = require('electron')
        let app_dir = remote.app.getPath('appData');
        let normalized_path = Path.normalize(`${app_dir}/coordinator/templates/${this.name}.json`)
        let raw = fs.readFileSync(normalized_path);
        let parsed_json = JSON.parse(raw);

        for (let i = 0; i < parsed_json.procedures.length; ++i)
        {
            let file_procedure = parsed_json.procedures[i];
            let procedure = new Procedure(file_procedure.name);
            procedure.repeat_count = file_procedure.repeat_count;
            this.procedures.push(procedure);
        }

        this.loop_count = parseInt(parsed_json.loop_count);
    }
}