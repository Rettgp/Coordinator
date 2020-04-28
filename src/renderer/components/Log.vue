<template>
<div id="container">
    <v-icon large @click="sheet = !sheet">bug_report</v-icon>
    <v-bottom-sheet v-model="sheet">
        <v-sheet id="log-sheet" class="text-left" height="200px">
            <v-container>
                <p v-for="(entry, i) in entries" :key="i">[{{entry.timestamp}}] {{entry.text}}</p>
            </v-container>
        </v-sheet>
    </v-bottom-sheet>
</div>
</template>

<script>
export default
{
    name: "log",
    data: function ()
    {
        return {
            sheet: false,
            entries: [],
        };
    },
    created: function () {},
    methods:
    {
        Log(log_string)
        {
            let time_obj = new Date();
            let time_string =
                time_obj.toLocaleString('en-US',
                {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: true
                });
            this.entries.push(
            {
                text: log_string,
                timestamp: time_string
            });
        }
    }
};
</script>

<style>
#container {
    position: fixed;
    bottom: 0px;
    right: 50%;
    z-index: 1000;
}

#log-sheet {
    overflow-y: scroll;
}
</style>
