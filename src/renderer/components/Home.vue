<template>
<v-container fluid grid-list-md fill-height>
    <v-layout row wrap v-resize="OnResize">
        <v-flex d-flex xs4 sm4 md3 lg2 fill-height>
            <v-list flat :height="windowSize.y - 150">
                <v-subheader>Characters</v-subheader>
                <v-list-item-group>
                    <draggable v-model="characters" :clone="CloneCharacter" :options="{group:{name:'tasked_characters', pull:'clone', put:false}}" style="min-height: 10px">
                        <v-list-item v-for="(item, i) in characters" :key="i" @mouseover="ExpandActiveProcedures(true)">
                            <v-list-item-content>
                                <v-list-item-title>{{item.name}}</v-list-item-title>
                                <v-list-item-subtitle>{{item.main_job + "/" + item.sub_job}}</v-list-item-subtitle>
                            </v-list-item-content>
                        </v-list-item>
                    </draggable>
                </v-list-item-group>
            </v-list>
        </v-flex>
        <v-flex d-flex xs4 sm4 md3 lg2 fill-height>
            <v-list flat :height="windowSize.y - 150">
                <v-subheader>Procedures</v-subheader>
                <v-list-item-group>
                    <draggable v-model="procedures" :clone="CloneProcedure" :options="{group:{name:'tasks', pull:'clone', put:false}}" style="min-height: 10px">
                        <div v-for="(item, i) in procedures" :key="i">
                            <v-divider v-if="i !== 0" :key="`${i}-divider`"></v-divider>
                            <v-list-item :key="i">{{item.name}}</v-list-item>
                        </div>
                    </draggable>
                </v-list-item-group>
            </v-list>
        </v-flex>
        <v-flex d-flex xs4 sm4 md4 lg3 fill-height>
            <v-list flat expand :height="windowSize.y - 150">
                <v-subheader>Active Procedures
                    <v-spacer/>
                    <v-text-field v-model="loop_count" label="Loop Count" dense outlined :min="0" hide-details type="number" style="width: 100px"></v-text-field>
                </v-subheader>
                <draggable v-model="active_procedures" :empty-insert-threshold="500" :options="{group:'tasks'}">
                    <v-list-group v-for="(item, i) in active_procedures" :key="i" v-model="item.selected" no-action>
                        <template v-slot:activator>
                            <v-icon v-if="!item.running" color="white" @click="RemoveActiveProcedure(item, $event)" class="pr-2">cancel</v-icon>
                            <v-list-item-content :disabled="item.running">
                                <v-list-item-title v-text="item.name"></v-list-item-title>
                            </v-list-item-content>
                            <v-progress-circular size=15 v-if="item.running" indeterminate color="primary" class="pr-5"></v-progress-circular>
                            <v-scroll-x-transition>
                                <v-icon size=15 v-if="item.done" color="success" class="pr-5">
                                    check
                                </v-icon>
                            </v-scroll-x-transition>
                            <v-icon v-on:click.stop v-if="!item.running" color="green" @click="LoadProcedure(item)">play_circle_outline</v-icon>
                            <v-icon v-on:click.stop v-if="item.running" color="red" @click="StopProcedure(item)">stop</v-icon>
                        </template>
                        <draggable v-model="item.characters" :disabled="item.running" @change="CharacterAddedToProcedure" :empty-insert-threshold="50" :options="{group:{name:'tasked_characters'}}" style="min-height: 10px">
                            <v-list-item dense v-for="(char, char_key) in item.characters" :key="char_key">
                                <v-list-item-content>
                                    <v-list-item-subtitle v-text="char.name"> </v-list-item-subtitle>
                                </v-list-item-content>
                            </v-list-item>
                        </draggable>
                        <v-divider :key="`${i}-divider`"></v-divider>
                    </v-list-group>
                </draggable>
            </v-list>
        </v-flex>
        <v-btn style="z-index: 1000" class="mx-2" top right absolute fab dark large color="blue" @click="ToggleAllLoop()">
            <v-icon v-if="!all_tasks_running" dark>play_arrow</v-icon>
            <v-icon v-if="all_tasks_running" dark>stop</v-icon>
        </v-btn>
    </v-layout>
    <Log ref="LogComponent" />
</v-container>
</template>

<script>
var net = require("net");
const Fs = require("fs");
const Path = require("path");
import Log from "./Log";
import
{
    HintProcs
}
from 'Constants';
import EventBus from 'EventBus';
import DataStore from "DataStore";
import draggable from 'vuedraggable'
import Character from 'Character';
import Procedure from 'Procedure';

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults: null
});

export default
{
    name: "home",
    components:
    {
        draggable,
        Log
    },
    data: function ()
    {
        return {
            characters: [],
            current_procedure_index: null,
            procedures: [],
            active_procedures: [],
            all_tasks_running: false,
            unclaimed_sockets: [],
            loop_count: 1,
            windowSize:
            {
                x: 0,
                y: 0,
            },
        };
    },

    mounted()
    {
        this.PopulateProcedures(data_store.Get("procedurePath"));
        EventBus.$on('procedurePath', (path) =>
        {
            this.PopulateProcedures(path);
        });
    },
    created: function ()
    {
        document.addEventListener('beforeunload', () =>
        {
            for (let i = 0; i < this.characters; ++i)
            {
                this.characters[i].socket.destroy();
            }
        })
        let self = this;
        net.createServer(function (connection)
        {
            self.unclaimed_sockets.push(connection);
            connection.on("data", function (data)
            {
                self.unclaimed_sockets = self.unclaimed_sockets.filter((conn) =>
                {
                    conn != connection;
                });
                let data_string = data.toString();
                let commands = data_string.split("\n");
                for (let i = 0; i < commands.length; ++i)
                {
                    let data_words = commands[i].split(",");
                    self.ProcessCommand(connection, data_words);
                }
            });
            connection.on("close", function (error)
            {
                console.log(error);
                let character = self.characters.find(element => element.socket === connection)
                self.RemoveConnection(connection);
            });
            connection.on("error", function (error)
            {
                console.log(error);
                let character = self.characters.find(element => element.socket === connection)
                self.RemoveConnection(connection);
            });
        }).listen(100);

        setInterval(this.Heartbeat, 1000);
    },
    methods:
    {
        CharacterAddedToProcedure(evt)
        {
            // let character = evt
            if (evt.added)
            {
                for (let i = 0; i < this.active_procedures.length; ++i)
                {
                    let proc_characters = this.active_procedures[i].characters;
                    this.active_procedures[i].characters = Array.from(new Set(proc_characters.map(a => a.name)))
                        .map(name =>
                        {
                            return proc_characters.find(a => a.name === name)
                        })
                }
            }
        },
        ExpandActiveProcedures(expand)
        {
            for (let i = 0; i < this.active_procedures.length; ++i)
            {
                this.active_procedures[i].selected = expand;
            }
        },
        Heartbeat()
        {
            for (let i = 0; i < this.unclaimed_sockets.length; ++i)
            {
                this.unclaimed_sockets[i].write(`heartbeat\n`);
            }
        },
        ProcessCommand(connection, data_words)
        {
            if (data_words.length > 1 && data_words[0] === "connection")
            {
                this.NewConnection(connection, data_words[1], data_words[2], data_words[3]);
            }

            let commanded_procedure = null;
            let commanded_character = this.characters.find(element => element.socket === connection)
            let active_character = null;
            for (let i = 0; i < this.active_procedures.length; ++i)
            {
                let active_procedure = this.active_procedures[i];
                if (!active_procedure.running)
                {
                    continue;
                }

                active_character = active_procedure.FindCharacter(commanded_character);
                if (active_character !== null)
                {
                    commanded_procedure = active_procedure;
                    break;
                }
            }
            if (!commanded_procedure || !active_character)
            {
                console.log("No procedure or character");
                return;
            }

            if (data_words.length > 1 && data_words[0] === "!procedure")
            {
                this.Acknowledge(connection, "procedure", data_words[2]);
            }
            else if (data_words.length > 1 && data_words[0] === "!complete")
            {
                this.Acknowledge(connection, "complete", data_words[1]);
                let task_still_running = false;

                if (commanded_procedure !== null)
                {
                    let characters_in_completed_task = commanded_procedure.characters;
                    active_character.CompleteTask();
                    for (let i = 0; i < characters_in_completed_task.length; ++i)
                    {
                        if (characters_in_completed_task[i].IsRunning() || characters_in_completed_task[i].IsWaiting())
                        {
                            task_still_running = true;
                        }
                    }

                    if (!task_still_running)
                    {
                        commanded_procedure.running = false;
                        commanded_procedure.done = true;
                    }
                }

                if (this.all_tasks_running && !task_still_running)
                {
                    this.current_procedure_index++;
                    if (this.current_procedure_index >= this.active_procedures.length)
                    {
                        --this.loop_count;
                        if (this.loop_count <= 0)
                        {
                            this.$refs.LogComponent.Log(`ALL DONE!`);
                            this.all_tasks_running = false;
                            return;
                        }
                        
                        this.current_procedure_index = 0;
                    }
                    const next_procedure = this.active_procedures[this.current_procedure_index];
                    this.LoadProcedure(next_procedure);
                }
            }
            else if (data_words.length > 1 && data_words[0] === "!sync")
            {
                this.Acknowledge(connection, "sync", data_words[1]);
                active_character.SyncWait();
                this.$refs.LogComponent.Log(`${active_character.name} Syncing...`);
            }
            else if (data_words.length > 1 && data_words[0] === "!finished_sync")
            {
                this.Acknowledge(connection, "finished_sync", data_words[1]);
                active_character.Synced();
                this.$refs.LogComponent.Log(`${active_character.name} Synced`);

                if (commanded_procedure && commanded_procedure.IsSyncronized())
                {
                    for (let i = 0; i < commanded_procedure.characters.length; ++i)
                    {
                        commanded_procedure.characters[i].ResetSyncState();
                        commanded_procedure.characters[i].socket.write(`synchronized\n`);
                    }
                    this.$refs.LogComponent.Log(`All synchronized. Continue`);
                }
            }
            else if (data_words[0] === "!procs")
            {
                // TODO: This overall needs to be smarter. If a BLM initializes its procs
                // first it will have A SHIT TON of procs. Maybe find shared procs between characters
                // then run a redistribute function to distribute those out.
                let procs = data_words[1].split("|");
                for (let i = 0; i < commanded_procedure.characters.length; ++i)
                {
                    if (commanded_procedure.characters[i].name !== active_character.name)
                    {
                        // TODO: This is empty because this character probably hasnt initialized its procs yet.
                        console.log(`Procs: ${commanded_procedure.characters[i].procs}`);
                        procs = procs.filter(proc => commanded_procedure.characters[i].procs.length === 0 || !commanded_procedure.characters[i].procs.includes(proc));
                        commanded_procedure.characters[i].procs = procs;
                        connection.write(`procs,${commanded_procedure.characters[i].procs.join('|')}\n`);
                    }
                }
            }
            else if (data_words[0] === "!local_event")
            {
                switch (commanded_procedure.name)
                {
                    case "vw":
                    {
                        if (data_words.length !== 4)
                        {
                            this.$refs.LogComponent.Log(`${commanded_procedure.name}: Local Event - Incorrect number of arguments`);
                            return;
                        }
                        this.HandleVoidWatchEvent(commanded_procedure.characters, data_words[1], data_words[2], data_words[3]);
                        break;
                    }
                    case "genkai":
                    {
                        if (data_words.length === 2 && data_words[1] === "testimonyObtained")
                        {
                            this.$refs.LogComponent.Log(`Testimony Obtained - Replying`);
                            for (let i = 0; i < commanded_procedure.characters.length; ++i)
                            {
                                commanded_procedure.characters[i].socket.write(`local_event,testimonyObtained\n`);
                            }
                        }
                        if (data_words.length === 2 && data_words[1] === "help")
                        {
                            this.$refs.LogComponent.Log(`Genkai 10 - HALP`);
                            for (let i = 0; i < commanded_procedure.characters.length; ++i)
                            {
                                commanded_procedure.characters[i].socket.write(`local_event,help\n`);
                            }
                        }
                        break;
                    }
                    case "einherjar":
                    {
                        if (data_words.length === 2)
                        {
                            this.$refs.LogComponent.Log(`Einherjar Chamber Selected: ${data_words[1]}`);
                            for (let i = 0; i < commanded_procedure.characters.length; ++i)
                            {
                                commanded_procedure.characters[i].socket.write(`local_event,${data_words[1]}\n`);
                            }
                        }
                        break;
                    }
                    default:
                    {
                        this.$refs.LogComponent.Log(`${commanded_procedure.name}: Local Event - Unhandled ${data_words[0]}`);
                        break;
                    }
                }
            }
        },
        NewConnection(connection, name, main_job, sub_job)
        {
            let character = this.characters.find(element => element.name === name);
            if (character !== undefined)
            {
                character.socket = connection;
                character.procs = [];
                character.ResetStates();
                return;
            }

            this.characters.push(new Character(name, connection, [], main_job, sub_job));
            connection.write(`connection,established ${name}\n`);
            this.$refs.LogComponent.Log(`${name} Connected`);
        },
        CloneProcedure(procedure)
        {
            return new Procedure(procedure.name, false, false);
        },
        CloneCharacter(character)
        {
            let clone = new Character(character.name, character.socket, character.procs, character.main_job, character.sub_job);
            clone.completion_state = character.completion_state;
            clone.sync_state = character.sync_state;
            return clone;
        },
        RemoveConnection(connection)
        {
            this.characters = this.characters.filter((element) =>
            {
                return element.socket !== connection;
            });
            for (let i = 0; i < this.active_procedures.length; ++i)
            {
                let active_procedure = this.active_procedures[i];
                active_procedure.characters = active_procedure.characters.filter((element) =>
                {
                    return element.socket !== connection;
                });
            }
        },
        ToggleAllLoop()
        {
            for (let i = 0; i < this.active_procedures.length; ++i)
            {
                this.active_procedures[i].done = false;
                this.active_procedures[i].running = false;
            }

            if (this.all_tasks_running)
            {
                this.all_tasks_running = false;
                let active_procedure = this.active_procedures[this.current_procedure_index];
                for (let i = 0; i < active_procedure.characters.length; ++i)
                {
                    active_procedure.characters[i].socket.write(`unload\n`);
                }
                return;
            }

            if (this.active_procedures.length <= 0)
            {
                this.$refs.LogComponent.Log(`No active procedures`);
                return;
            }

            this.current_procedure_index = 0;
            this.all_tasks_running = true;

            this.LoadProcedure(this.active_procedures[this.current_procedure_index]);
        },
        LoadProcedure(procedure)
        {
            procedure.done = false
            procedure.running = true
            this.$refs.LogComponent.Log(`Starting ${procedure.name}`);
            for (let i = 0; i < procedure.characters.length; ++i)
            {
                if (procedure.characters[i].IsRunning())
                {
                    this.$refs.LogComponent.Log(`${procedure.characters[i].name} IS ALREADY RUNNING A TASK!`);
                    return;
                }
                procedure.characters[i].StartTask()
                procedure.characters[i].socket.write(`load,${procedure.name}\n`);
            }
        },
        StopProcedure(procedure)
        {
            procedure.done = true
            procedure.running = false
            this.$refs.LogComponent.Log(`Stopping ${procedure.name}`);
            for (let i = 0; i < procedure.characters.length; ++i)
            {
                procedure.characters[i].CompleteTask()
                procedure.characters[i].socket.write(`unload\n`);
            }
        },
        Acknowledge(connection, command, ts)
        {
            connection.write(`rcvd,${command},${ts}\n`);
        },
        HandleVoidWatchEvent(procedure_characters, job, elemental, vulnerability)
        {
            this.$refs.LogComponent.Log(`Hint: Job: ${job}  Element: ${elemental}  Vul: ${vulnerability}`);
            let procs = HintProcs[job][elemental];
            for (let i = 0; i < procedure_characters.length; ++i)
            {
                const found = procedure_characters[i].procs.some(proc => procs.includes(proc))
                if (found)
                {
                    this.$refs.LogComponent.Log(`${procedure_characters[i].name} Proc'ing`);
                    procedure_characters[i].socket.write(`local_event,${job},${elemental},${vulnerability}\n`);
                    return;
                }
            }
        },
        PopulateProcedures(procedure_path)
        {
            let normalized_path = Path.normalize(procedure_path)
            if (Fs.existsSync(normalized_path))
            {
                let dir = Fs.readdirSync(normalized_path);
                let files = dir.filter(function (file)
                {
                    return file.match(/.*\.(lua)/ig);
                });
                let file_names = [];
                files.forEach(element => file_names.push(Path.basename(`${normalized_path}/${element}`, '.lua')));

                let jobs_normalized_path = normalized_path + "/jobs"
                let jobs_dir = Fs.readdirSync(jobs_normalized_path);
                let job_files = jobs_dir.filter(function (file)
                {
                    return file.match(/.*\.(lua)/ig);
                });
                job_files.forEach(element => file_names.push("jobs/" + Path.basename(`${jobs_normalized_path}/${element}`, '.lua')));

                this.procedures = [];
                for (let i = 0; i < file_names.length; ++i)
                {
                    this.procedures.push(
                    {
                        name: file_names[i],
                        active: false,
                        done: false
                    });
                }
            }
            else
            {
                this.$refs.LogComponent.Log(`${procedure_path} Does Not Exist!`);
                this.procedures = [];
            }
        },
        OnResize()
        {
            this.windowSize = {
                x: window.innerWidth,
                y: window.innerHeight
            };
        },
        RemoveActiveProcedure(procedure)
        {
            this.active_procedures = this.active_procedures.filter(item => item !== procedure);
        }
    }
};
</script>

<style>
.v-list {
    min-width: 100px;
    width: 100%;
    overflow-y: auto;
}
</style>
