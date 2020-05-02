<template>
<v-container fluid grid-list-md fill-height>
    <v-layout row wrap v-resize="OnResize">
        <v-flex d-flex xs4 sm4 md3 lg2 fill-height>
            <v-list :height="windowSize.y - 150">
                <v-subheader>Characters</v-subheader>
                <v-list-item-group>
                    <v-list-item v-for="(item, i) in characters" :key="i" @click.capture.stop="ToggleCharacterToRun(item, $event)">
                        <v-list-item-action>
                            <v-checkbox color="primary" v-model="characters_to_run" 
                                :value="item"></v-checkbox>
                        </v-list-item-action>
                        <v-list-item-content>
                            <v-list-item-title>{{item.name}}</v-list-item-title>
                            <v-list-item-subtitle>{{item.main_job + "/" + item.sub_job}}</v-list-item-subtitle>
                        </v-list-item-content>
                    </v-list-item>
                </v-list-item-group>
            </v-list>
        </v-flex>
        <v-flex d-flex xs4 sm4 md3 lg3 fill-height>
            <v-layout row wrap>
                <v-flex d-flex>
                    <v-list :height="(windowSize.y/2) - 50">
                        <v-subheader>Procedures</v-subheader>
                        <v-list-item-group color="primary">
                            <draggable v-model="procedures" :clone="CloneProcedure" :options="{group:{name:'tasks', pull:'clone', put:false}}" style="min-height: 10px">
                                <div v-for="(item, i) in procedures" :key="i">
                                    <v-divider v-if="i !== 0" :key="`${i}-divider`"></v-divider>
                                    <v-list-item :key="i">{{item.name}}</v-list-item>
                                </div>
                            </draggable>
                        </v-list-item-group>
                    </v-list>
                </v-flex>
                <v-flex d-flex>
                    <v-list :height="(windowSize.y/2) - 110" :disabled="running">
                        <v-subheader>Active Procedures</v-subheader>
                        <v-list-item-group color="primary">
                            <draggable v-model="active_procedures" :options="{group:'tasks'}" style="min-height: 10px">
                                <div v-for="(item, i) in active_procedures" :key="i">
                                    <v-divider v-if="i !== 0" :key="`${i}-divider`"></v-divider>
                                    <v-list-item :key="i">
                                        <v-icon color="white" @click="RemoveActiveProcedure(item, $event)" class="pr-2">cancel</v-icon>
                                        {{item.name}}
                                        <v-spacer/>
                                        <v-progress-circular size=25 v-if="item.active" indeterminate color="primary"></v-progress-circular>
                                        <v-scroll-x-transition>
                                            <v-icon v-if="item.done" color="success">
                                                check
                                            </v-icon>
                                        </v-scroll-x-transition>
                                    </v-list-item>
                                </div>
                            </draggable>
                        </v-list-item-group>
                    </v-list>
                </v-flex>
            </v-layout>
        </v-flex>
        <v-btn class="mx-2" fab dark large color="blue" @click="ToggleProcedure()">
            <v-icon v-if="!running" dark>play_arrow</v-icon>
            <v-icon v-if="running" dark>stop</v-icon>
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

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults: null
});
const SyncState = {
    DEFAULT: "Default",
    SYNCING: "Syncing",
    SYNCED: "Synced"
}
const CompletionState = {
    RUNNING: "Running",
    TASK_COMPLETED_WAITING: "TaskCompletedWaiting",
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
            characters_to_run: [],
            running: false,
            unclaimed_sockets: [],
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
                console.log(data_string);
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
            else if (data_words.length > 1 && data_words[0] === "!procedure")
            {
                this.Acknowledge(connection, "procedure", data_words[2]);
            }
            else if (data_words.length > 1 && data_words[0] === "!complete")
            {
                this.Acknowledge(connection, "complete", data_words[1]);

                let character = this.characters_to_run.find(element => element.socket === connection)
                character.completion_state = CompletionState.TASK_COMPLETED_WAITING;
                for (let i = 0; i < this.characters_to_run.length; ++i)
                {
                    if (this.characters_to_run[i].completion_state !== CompletionState.TASK_COMPLETED_WAITING)
                    {
                        this.$refs.LogComponent.Log(`${this.characters_to_run[i].name} is not done with their procedure - Waiting...`);
                        return;
                    }
                }

                this.active_procedures[this.current_procedure_index].active = false;
                this.active_procedures[this.current_procedure_index].done = true;
                this.current_procedure_index++;
                if (this.current_procedure_index >= this.active_procedures.length)
                {
                    this.$refs.LogComponent.Log(`ALL DONE!`);
                    this.running = false;
                    return;
                }
                const next_procedure = this.active_procedures[this.current_procedure_index];
                this.LoadProcedure(next_procedure);
            }
            else if (data_words.length > 1 && data_words[0] === "!sync")
            {
                this.Acknowledge(connection, "sync", data_words[1]);
                let character = this.characters_to_run.find(element => element.socket === connection)
                character.sync_state = SyncState.SYNCING;
                this.$refs.LogComponent.Log(`${character.name} Syncing...`);
            }
            else if (data_words.length > 1 && data_words[0] === "!finished_sync")
            {
                this.Acknowledge(connection, "finished_sync", data_words[1]);
                let character = this.characters_to_run.find(element => element.socket === connection)
                character.sync_state = SyncState.SYNCED;
                this.$refs.LogComponent.Log(`${character.name} Synced`);
                if (this.IsSyncronized())
                {
                    for (let i = 0; i < this.characters_to_run.length; ++i)
                    {
                        this.characters_to_run.sync_state = SyncState.DEFAULT;
                        this.characters_to_run[i].socket.write(`synchronized\n`);
                    }
                    this.$refs.LogComponent.Log(`All synchronized. Continue`);
                }
            }
            else if (data_words[0] === "!procs")
            {
                // TODO: This overall needs to be smarter. If a BLM initializes its procs
                // first it will have A SHIT TON of procs. Maybe find shared procs between characters
                // then run a redistribute function to distribute those out.
                let character = this.characters_to_run.find(element => element.socket === connection)
                let procs = data_words[1].split("|");
                for (let i = 0; i < this.characters_to_run.length; ++i)
                {
                    if (this.characters_to_run[i].name !== character.name)
                    {
                        // TODO: This is empty because this character probably hasnt initialized its procs yet.
                        console.log(`Procs: ${this.characters_to_run[i].procs}`);
                        procs = procs.filter(proc => this.characters_to_run[i].procs.length === 0 || !this.characters_to_run[i].procs.includes(proc));
                    }
                }
                character.procs = procs;
                connection.write(`procs,${character.procs.join('|')}\n`);
            }
            else if (data_words[0] === "!local_event")
            {
                let current_procedure = this.active_procedures[this.current_procedure_index];
                switch (current_procedure.name)
                {
                    case "vw":
                    {
                        if (data_words.length !== 4)
                        {
                            this.$refs.LogComponent.Log(`${current_procedure.name}: Local Event - Incorrect number of arguments`);
                            return;
                        }
                        this.HandleVoidWatchEvent(data_words[1], data_words[2], data_words[3]);
                        break;
                    }
                    case "genkai":
                    {
                        if (data_words.length === 2 && data_words[1] === "testimonyObtained")
                        {
                            this.$refs.LogComponent.Log(`Testimony Obtained - Replying`);
                            for (let i = 0; i < this.characters_to_run.length; ++i)
                            {
                                this.characters_to_run[i].socket.write(`local_event,testimonyObtained\n`);
                            }
                        }
                        if (data_words.length === 2 && data_words[1] === "help")
                        {
                            this.$refs.LogComponent.Log(`Genkai 10 - HALP`);
                            for (let i = 0; i < this.characters_to_run.length; ++i)
                            {
                                this.characters_to_run[i].socket.write(`local_event,help\n`);
                            }
                        }
                        break;
                    }
                    case "einherjar":
                    {
                        if (data_words.length === 2)
                        {
                            this.$refs.LogComponent.Log(`Einherjar Chamber Selected: ${data_words[1]}`);
                            for (let i = 0; i < this.characters_to_run.length; ++i)
                            {
                                this.characters_to_run[i].socket.write(`local_event,${data_words[1]}\n`);
                            }
                        }
                        break;
                    }
                    default:
                    {
                        this.$refs.LogComponent.Log(`${current_procedure.name}: Local Event - Unhandled ${data_string}`);
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
                character.sync_state = SyncState.DEFAULT;
                character.completion_state = CompletionState.RUNNING;
                return;
            }

            this.characters.push(
            {
                name: name,
                socket: connection,
                procs: [],
                sync_state: SyncState.DEFAULT,
                completion_state: CompletionState.RUNNING,
                main_job: main_job,
                sub_job: sub_job,
            });
            connection.write(`connection,established ${name}\n`);
            this.$refs.LogComponent.Log(`${name} Connected`);
        },
        CloneProcedure(procedure)
        {
            return {
                name: procedure.name,
                active: false,
                done: false
            }
        },
        RemoveConnection(connection)
        {
            this.characters = this.characters.filter((element) =>
            {
                return element.socket !== connection;
            });
            this.characters_to_run = this.characters_to_run.filter((element) =>
            {
                return element.socket !== connection;
            });
        },
        ToggleProcedure()
        {
            if (this.running)
            {
                this.running = false;
                for (let i = 0; i < this.characters_to_run.length; ++i)
                {
                    this.characters_to_run[i].socket.write(`unload\n`);
                }
                for (let i = 0; i < this.active_procedures.length; ++i)
                {
                    this.active_procedures[i].done = false;
                    this.active_procedures[i].active = false;
                }
                return;
            }

            if (this.characters_to_run.length <= 0)
            {
                this.$refs.LogComponent.Log(`No characters selected`);
                return;
            }
            if (this.active_procedures.length <= 0)
            {
                this.$refs.LogComponent.Log(`No active procedures`);
                return;
            }

            for (let i = 0; i < this.active_procedures.length; ++i)
            {
                this.active_procedures[i].done = false;
                this.active_procedures[i].active = false;
            }
            this.current_procedure_index = 0;
            this.running = true;

            this.LoadProcedure(this.active_procedures[this.current_procedure_index]);
        },
        LoadProcedure(procedure)
        {
            procedure.done = false
            procedure.active = true
            this.$refs.LogComponent.Log(`Starting ${procedure.name}`);
            for (let i = 0; i < this.characters_to_run.length; ++i)
            {
                this.characters_to_run[i].completion_state = CompletionState.RUNNING;
                this.characters_to_run[i].socket.write(`load,${procedure.name}\n`);
            }
        },
        Acknowledge(connection, command, ts)
        {
            connection.write(`rcvd,${command},${ts}\n`);
        },
        IsSyncronized()
        {
            for (let i = 0; i < this.characters_to_run.length; ++i)
            {
                if (this.characters_to_run[i].sync_state !== SyncState.SYNCED)
                {
                    return false;
                }
            }

            return true;
        },
        HandleVoidWatchEvent(job, elemental, vulnerability)
        {
            this.$refs.LogComponent.Log(`Hint: Job: ${job}  Element: ${elemental}  Vul: ${vulnerability}`);
            let procs = HintProcs[job][elemental];
            for (let i = 0; i < this.characters_to_run.length; ++i)
            {
                const found = this.characters_to_run[i].procs.some(proc => procs.includes(proc))
                if (found)
                {
                    this.$refs.LogComponent.Log(`${this.characters_to_run[i].name} Proc'ing`);
                    this.characters_to_run[i].socket.write(`local_event,${job},${elemental},${vulnerability}\n`);
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
        },
        ToggleCharacterToRun(character)
        {
            if (this.characters_to_run.includes(character))
            {
                this.characters_to_run = 
                    this.characters_to_run.filter(elem => elem.name !== character.name);
            }
            else
            {
                this.characters_to_run.push(character);
            }
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
