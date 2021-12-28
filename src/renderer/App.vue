<template>
<div id="app">
    <v-app id="inspire">
        <v-navigation-drawer mobile-break-point=600, v-model="drawer" app clipped>
            <v-list dense>
                <v-list-item link @click.stop="show_path_card = !show_path_card">
                    <v-list-item-action>
                        <v-icon large>folder_open</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Procedure Folder</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item link @click.stop="show_command_card = !show_command_card">
                    <v-list-item-action>
                        <v-icon large>input</v-icon>
                    </v-list-item-action>
                    <v-list-item-content>
                        <v-list-item-title>Test Command</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item v-for="(item, i) in templates" :key="i" @click.stop="LoadTemplate(item)">
                    <v-list-item-content>
                        <v-list-item-title>{{item}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app dense clipped-left>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
            <v-toolbar-title>Coordinator</v-toolbar-title>
        </v-app-bar>

        <v-content>
            <v-container id="tabs" class="fill-height" fluid>
                <v-tabs>
                    <v-tab v-on:click="active_tab=-1" v-bind:class="[ active_tab === -1 ? 'active' : '' ]">
                        Runner
                    </v-tab>
                    <v-tab v-for="(name, i) in procedure_tabs" :key="i" v-on:click="active_tab=i" v-bind:class="[ active_tab === i ? 'active' : '' ]">
                        {{name}}
                        <v-btn icon color="white" @click="SaveTab(i)"><font-awesome-icon icon="save" /></v-btn> 
                        <v-btn icon color="white" @click="CloseTab(i)"><font-awesome-icon icon="times" /></v-btn> 
                    </v-tab>
                    <v-btn icon color="white" @click="CreateProcedure()"><font-awesome-icon icon="file-alt" /></v-btn> 
                    <v-btn icon color="white"><font-awesome-icon icon="folder-open" /></v-btn> 
                </v-tabs>
                <v-content style="padding: 0">
                    <div v-show="active_tab === -1" class="tabcontent">
                        <Home/>
                    </div>
                    <div class="tabcontent" v-for="(name, i) in procedure_tabs" :key="i" v-show="active_tab === i">
                        <Editor :ref="'editor' + i"/>
                    </div>
                </v-content>
            
            </v-container>
        </v-content>

        <v-dialog v-model="show_path_card" width="50%">
            <v-card class="mx-auto" width="100%" raised>
                <v-list-item three-line>
                    <v-list-item-title class="headline mb-1">Path To Procedures</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-text-field v-model="procedure_path" label="Absolute Path" :value="procedure_path" single-line clearable></v-text-field>
                </v-list-item>
                <v-card-actions>
                    <v-btn @click="SaveProcedureFolder()" text>Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="show_command_card" width="50%">
            <v-card class="mx-auto" width="100%" raised>
                <v-list-item three-line>
                    <v-list-item-title class="headline mb-1">Test Command</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-text-field v-model="test_command" label="local_event,test" :value="test_command" single-line clearable></v-text-field>
                </v-list-item>
                <v-card-actions>
                    <v-btn @click="RunTestCommand()" text>Run</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-footer app>
            <span style="white-space: pre">{{app_version}}   {{auto_updater_status}}</span>
            <v-btn v-if="update_available" @click="InstallUpdate()" text>Install</v-btn>
        </v-footer>
    </v-app>
</div>
</template>

<script>
import Home from './components/Home';
import Editor from './components/Editor';
import DataStore from "DataStore";
import EventBus from "EventBus";
import SyncFile from 'SyncFile';
import CodeBlockFile from 'CodeBlockFile'
import {ipcRenderer} from "electron";
window.$ = window.jQuery = require('jquery');

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults:
    {
        procedurePath: "C:/",
    }
});

export default
{
    name: "coordinator",
    components:
    {
        Home,
        Editor
    },
    props:
    {
        source: String,
    },
    data()
    {
        return {
            drawer: false,
            show_path_card: null,
            show_command_card: null,
            procedure_path: String,
            test_command: "",
            app_version: 'V' + require('../../package.json').version + "       ",
            auto_updater_status: '',
            update_available: false,
            templates: [],
            procedure_tabs: [],
            active_tab: -1
        };
    },
    created: function ()
    {
        this.procedure_path = data_store.Get('procedurePath');
        this.PopulateTemplates();
        EventBus.$on('saveTemplate', (name) =>
        {
            this.PopulateTemplates();
        });
        ipcRenderer.on("auto-updater-event", (event, args) => 
        {
            this.auto_updater_status = args;
        });
        ipcRenderer.on("update-available-event", (event, args) => 
        {
            this.update_available = true;
        });
    },
    methods:
    {
        CreateProcedure()
        {
            let name = `New Procedure *`;
            this.procedure_tabs.push(name);
        },
        CloseTab(tab_index)
        {
            this.procedure_tabs.splice(tab_index - 1, 1);
            this.active_tab = this.procedure_tabs.length - 1;
        },
        SaveTab(tab_index)
        {
            let block_path = this.$refs[`editor${tab_index}`][0].GetCodePath();
            if (block_path.length === 0)
            {
                return;
            }

            if (!this.$refs[`editor${tab_index}`][0].ValidateBlocks())
            {
                return;
            }

            let procedure_path = data_store.Get('procedurePath');
            let options = {
                title: "Save file - Procedure",
                defaultPath: procedure_path,
                buttonLabel : "Save Procedure File",
                filters :[
                    {name: 'LUA Script', extensions: ['lua']}
                ]
            }
            const {remote} = require('electron');
            let file_path = remote.dialog.showSaveDialogSync(remote.getCurrentWindow(), options);
            if (file_path)
            {
                CodeBlockFile.WriteFile(file_path, block_path);
            }
        },
        SaveProcedureFolder()
        {
            data_store.Set('procedurePath', this.procedure_path);
            this.show_path_card = false;
            EventBus.$emit('procedurePath', this.procedure_path);
        },
        RunTestCommand()
        {
            this.show_command_card = false;
            EventBus.$emit('testCommand', this.test_command);
        },
        InstallUpdate()
        {
            this.update_available = false;
            ipcRenderer.send("install-update-event");
        },
        PopulateTemplates()
        {
            const Path = require("path");
            const Fs = require("fs");
            const {remote} = require('electron');
            let app_dir = remote.app.getPath('appData');
            let normalized_path = Path.normalize(`${app_dir}/coordinator/templates`)
            if (Fs.existsSync(normalized_path))
            {
                let dir = Fs.readdirSync(normalized_path);
                let files = dir.filter(function (file)
                {
                    return file.match(/.*\.(json)/ig);
                });
                let file_names = [];
                files.forEach(element => file_names.push(Path.basename(`${normalized_path}/${element}`, '.json')));

                this.templates = file_names;
            }
        },
        LoadTemplate(name)
        {
            EventBus.$emit('loadTemplate', name);
        }
    }
};
</script>

<style scoped>
</style>