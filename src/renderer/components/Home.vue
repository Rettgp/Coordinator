<template>
<v-container fluid grid-list-md fill-height>
    <v-layout row wrap v-resize="OnResize">
        <v-flex d-flex xs3 sm3 md2 lg2 fill-height>
            <v-list flat :height="windowSize.y - 150">
                <v-subheader>Characters</v-subheader>
                <v-list-item-group>
                    <draggable v-model="characters" :options="{group:{name:'tasked_characters', pull:'clone', put:false}}" style="min-height: 10px">
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
        <v-flex d-flex xs3 sm3 md3 lg3 fill-height>
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
        <v-flex d-flex xs6 sm6 md7 lg7 fill-height>
            <v-list flat expand :height="windowSize.y - 150">
                <v-subheader>Active Procedures
                    <v-icon class="pl-3" v-if="active_procedures.length > 0" color="white" @click="show_save_template = true">save</v-icon>
                    <v-spacer />
                    <v-text-field v-model="loop_count" label="Loop Count" dense outlined :min="0" hide-details type="number" style="width: 100px"></v-text-field>
                </v-subheader>
                <draggable v-model="active_procedures" :empty-insert-threshold="500" :options="{group:'tasks'}">
                    <v-list-group v-for="(item, i) in active_procedures" :key="i" v-model="item.selected" no-action>
                        <template v-slot:activator>
                            <v-icon v-if="!item.running" color="white" @click="RemoveActiveProcedure(item, $event)" class="pr-2">cancel</v-icon>
                            <v-list-item-content :disabled="item.running">
                                <v-list-item-title v-text="item.name"></v-list-item-title>
                                <v-progress-linear absolute bottom stream buffer-value="0" v-if="item.running" v-model="item.progress" color="blue"></v-progress-linear>
                            </v-list-item-content>
                            <v-scroll-x-transition>
                                <v-icon size=15 v-if="item.done" color="success" class="pr-2">
                                    check
                                </v-icon>
                            </v-scroll-x-transition>
                            <v-text-field absolute right v-on:click.stop class="pr-2" v-model="item.repeat_count" label="Repeat" dense outlined :min="0" hide-details type="number" style="width: 5px"></v-text-field>
                            <v-progress-circular size=15 v-if="item.queued" indeterminate color="primary" class="pr-8"></v-progress-circular>
                            <v-icon v-on:click.stop v-if="!item.running && !item.queued" color="green" @click="StartProcedure(item)">play_circle_outline</v-icon>
                            <v-icon v-on:click.stop v-if="item.running || item.queued" color="red" @click="StopProcedure(item)">stop</v-icon>
                            <v-icon right v-on:click.stop v-if="!item.running && !item.queued" color="white" @click="AddAllCharacters(item)">people</v-icon>
                        </template>
                        <draggable v-model="item.characters" :disabled="item.running" @change="CharacterAddedToProcedure" :empty-insert-threshold="50" :options="{group:{name:'tasked_characters'}}" style="min-height: 10px">
                            <v-list-item dense v-for="(char, char_key) in item.characters" :key="char_key">
                                <v-list-item-content>
                                    <v-list-item-subtitle v-text="char.name"> </v-list-item-subtitle>
                                </v-list-item-content>
                                <v-icon v-if="!item.running" color="white" @click="RemoveCharacter(item, char.name, $event)" class="pl-2">close</v-icon>
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
    <v-dialog v-model="show_save_template" width="50%">
        <v-card class="mx-auto" width="100%" raised>
            <v-list-item one-line>
                <v-list-item-title class="headline mb-1">Template Name</v-list-item-title>
            </v-list-item>
            <v-list-item>
                <v-text-field v-model="save_template_name" label="Name" single-line clearable></v-text-field>
            </v-list-item>
            <v-card-actions>
                <v-btn @click="SaveProcedures()" text>Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
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
import SyncFile from 'SyncFile';

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults: null
});

let reported_character_procs = 0;
let global_procs = new Set()
let most_procs_last = function(char1, char2)
{
    return char1.available_procs.length - char2.available_procs.length;
}

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
            queued_procedures: [],
            loop_count: 1,
            windowSize:
            {
                x: 0,
                y: 0,
            },
            save_template_name: "",
            show_save_template: false
        };
    },

    mounted()
    {
        this.PopulateProcedures(data_store.Get("procedurePath"));
        EventBus.$on('procedurePath', (path) =>
        {
            this.PopulateProcedures(path);
        });
        EventBus.$on('loadTemplate', (name) =>
        {
            this.LoadTemplate(name);
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
        setInterval(this.CheckQueuedProcedures, 1000);
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

                if (commanded_procedure === null)
                {
                    return;
                }

                let characters_in_completed_task = commanded_procedure.characters;
                active_character.CompleteTask();
                for (let i = 0; i < characters_in_completed_task.length; ++i)
                {
                    if (characters_in_completed_task[i].IsRunning() || characters_in_completed_task[i].IsWaiting())
                    {
                        characters_in_completed_task[i].socket.write(`character_completed,${active_character.name}\n`);
                        task_still_running = true;
                    }
                }

                if (!task_still_running)
                {
                    ++commanded_procedure.current_it;
                    if (commanded_procedure.current_it >= commanded_procedure.repeat_count)
                    {
                        commanded_procedure.running = false;
                        commanded_procedure.done = true;
                        if (this.all_tasks_running)
                        {
                            this.ProceedToNextProcedure()
                        }
                    }
                    else
                    {
                        this.RepeatProcedure(commanded_procedure);
                    }
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
                    }

                    for (let i = 0; i < commanded_procedure.characters.length; ++i)
                    {
                        commanded_procedure.characters[i].socket.write(`synchronized\n`);
                    }
                    this.$refs.LogComponent.Log(`All synchronized. Continue`);
                }
            }
            else if (data_words[0] === "!procs")
            {
                if (data_words[1] === false || data_words[1] === "")
                {
                    connection.write(`procs,nil\n`);
                    return;
                }

                let procs = data_words[1].split("|");
                active_character.available_procs = procs;
                procs.forEach(item => global_procs.add(item))

                reported_character_procs++;
                if (reported_character_procs >= commanded_procedure.characters.length)
                {
                    active_character.procs = []
                    this.$refs.LogComponent.Log(`Collected ${global_procs.size} procs - Distributing...`);
                    while (global_procs.size > 0)
                    {
                        const it = global_procs[Symbol.iterator]();
                        let global_proc_it = it.next();
                        while (!global_proc_it.done)
                        {
                            let possible_chars_for_proc = new Array()
                            for (let i = 0; i < commanded_procedure.characters.length; ++i)
                            {
                                let character = commanded_procedure.characters[i];
                                if (character.available_procs.includes(global_proc_it.value))
                                {
                                    possible_chars_for_proc.push(character);
                                }
                            }

                            possible_chars_for_proc.sort(most_procs_last);
                            if (possible_chars_for_proc.length !== 0)
                            {
                                possible_chars_for_proc[0].procs.push(global_proc_it.value);
                            }
                            global_procs.delete(global_proc_it.value);
                            global_proc_it = it.next();
                        }
                    }

                    for (let i = 0; i < commanded_procedure.characters.length; ++i)
                    {
                        let character = commanded_procedure.characters[i];
                        if (character.procs.length === 0)
                        {
                            character.socket.write(`procs,nil\n`);
                        }
                        else
                        {
                            character.socket.write(`procs,${character.procs.join('|')}\n`);
                            this.$refs.LogComponent.Log(`${character.name} Procs: ${character.procs.join('|')}`);
                        }
                    }
                    reported_character_procs = 0;
                }
            }
            else if (data_words[0] === "!all_characters")
            {
                let all_characters = [];
                for (let i = 0; i < commanded_procedure.characters.length; ++i)
                {
                    if (commanded_procedure.characters[i].name !== active_character.name)
                    {
                        all_characters.push(commanded_procedure.characters[i].name);
                    }
                }

                connection.write(`all_characters,${all_characters.join("|")}`);
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
                for (let i = 0; i < this.active_procedures.length; ++i)
                {
                    this.active_procedures[i].Stop();
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

            this.StartProcedure(this.active_procedures[this.current_procedure_index]);
        },
        ProceedToNextProcedure()
        {
            this.current_procedure_index++;
            if (this.current_procedure_index >= this.active_procedures.length)
            {
                --this.loop_count;
                this.loop_count = Math.max(this.loop_count, 0);

                if (this.loop_count <= 0)
                {
                    this.$refs.LogComponent.Log(`ALL DONE!`);
                    this.all_tasks_running = false;
                    return;
                }

                this.current_procedure_index = 0;
            }

            const next_procedure = this.active_procedures[this.current_procedure_index];
            this.StartProcedure(next_procedure);
        },
        CheckQueuedProcedures()
        {
            let new_queue = [];
            for (let i = 0; i < this.queued_procedures.length; ++i)
            {
                let queued_procedure = this.queued_procedures[i];
                if (!queued_procedure.queued)
                {
                    continue;
                }

                let any_character_running = queued_procedure.characters.some((element) => element.IsRunning());
                if (!any_character_running)
                {
                    this.StartProcedure(queued_procedure);
                }
                else
                {
                    new_queue.push(queued_procedure);
                }
            }

            this.queued_procedures = new_queue;
        },
        AddProcedureToQueue(procedure)
        {
            this.queued_procedures.push(procedure);
        },
        RepeatProcedure(procedure)
        {
            let loaded = procedure.Load();
            if (!loaded && procedure.queued)
            {
                this.AddProcedureToQueue(procedure);
            }
            if (!loaded && this.all_tasks_running)
            {
                this.ProceedToNextProcedure();
            }
        },
        StartProcedure(procedure)
        {
            procedure.current_it = 0;
            let loaded = procedure.Load();
            if (!loaded && procedure.queued)
            {
                this.AddProcedureToQueue(procedure);
            }
            if (!loaded && this.all_tasks_running)
            {
                this.ProceedToNextProcedure();
            }
        },
        StopProcedure(procedure)
        {
            if (procedure.queued)
            {
                procedure.queued = false;
            }
            else
            {
                procedure.Stop();
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

                let missions_normalized_path = normalized_path + "/missions"
                let missions_dir = Fs.readdirSync(missions_normalized_path);
                let missions_files = missions_dir.filter(function (file)
                {
                    return file.match(/.*\.(lua)/ig);
                });
                missions_files.forEach(element => file_names.push("missions/" + Path.basename(`${missions_normalized_path}/${element}`, '.lua')));

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
        },
        AddAllCharacters(procedure)
        {
            procedure.characters = Array.from(this.characters);
        },
        SaveProcedures()
        {
            let sync_file = new SyncFile(this.save_template_name, this.active_procedures, this.loop_count);
            sync_file.Save();
            this.show_save_template = false;
            EventBus.$emit('saveTemplate', name);
        },
        LoadTemplate(name)
        {
            let sync_file = new SyncFile(name);
            sync_file.Load();

            this.active_procedures = sync_file.procedures;
            this.loop_count = sync_file.loop_count;
        },
        RemoveCharacter(procedure, name)
        {
            procedure.characters = procedure.characters.filter((element) =>
            {
                return element.name !== name;
            });
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
