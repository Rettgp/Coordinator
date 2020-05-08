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
            </v-list>
        </v-navigation-drawer>

        <v-app-bar app dense clipped-left>
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
            <v-toolbar-title>Coordinator</v-toolbar-title>
        </v-app-bar>

        <v-content>
            <v-container class="fill-height" fluid>
                <router-view />
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
        <v-footer app>
            <span>{{app_version}}</span>
        </v-footer>
    </v-app>
</div>
</template>

<script>
import DataStore from "DataStore";
import EventBus from "EventBus";

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults:
    {
        procedurePath: "C:/Games/PlayOnline/Windower4/addons/sync/data"
    }
});

export default
{
    name: "coordinator",
    props:
    {
        source: String,
    },
    data()
    {
        return {
            drawer: false,
            show_path_card: null,
            procedure_path: String,
            app_version: 'V' + require('../../package.json').version
        };
    },
    created: function ()
    {
        this.procedure_path = data_store.Get('procedurePath');
    },
    methods:
    {
        SaveProcedureFolder()
        {
            data_store.Set('procedurePath', this.procedure_path);
            this.show_path_card = false;
            EventBus.$emit('procedurePath', this.procedure_path);
        }
    }
};
</script>
