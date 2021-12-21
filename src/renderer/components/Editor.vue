<template>
<v-container fluid grid-list-md fill-height>
    <v-layout row wrap v-resize="OnResize">
        <v-flex d-flex xs3 sm3 md2 lg2 fill-height>
            <v-list style="z-index: 1" flat :height="windowSize.y - 150">
                <v-subheader>Blocks</v-subheader>
                <v-list-item-group>
                    <!-- <draggable v-model="blocks" :options="{group:{name:'blocks_group', pull:'clone', put:true}}" style="min-height: 10px"> -->
                        <v-list-item v-for="(item, i) in blocks" :key="i">
							<CodeBlock :type="item" @drag-ended="OnCodeBlockMoved"/>
                        </v-list-item>
                    <!-- </draggable> -->
                </v-list-item-group>
            </v-list>
        </v-flex>
        <v-flex d-flex xs9 sm9 md10 lg10 fill-height fill-width>
            <v-sheet id="codeArea" flat :height="windowSize.y - 150" :width="windowSize.x - 150">
                <!-- <draggable v-model="assigned_blocks" :options="{group:'blocks_group', pull:'move', put:true}" :move="OnAssignedBlockMove"> -->
					<!-- <CodeBlock class="assigned-block" v-for="(item, i) in assigned_blocks" :key="i">
					</CodeBlock> -->
				<!-- </draggable> -->
			</v-sheet>
        </v-flex>
    </v-layout>
</v-container>
</template>

<script>
const Fs = require("fs");
const Path = require("path");
import EventBus from 'EventBus';
import DataStore from "DataStore";
import draggable from 'vuedraggable'
import CodeBlock from './CodeBlock';
import Vue from 'vue'
var CodeBlockClass = Vue.extend(CodeBlock)

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults: null
});

export default
{
    name: "editor",
    components:
    {
        draggable,
		CodeBlock
    },
    data: function ()
    {
        return {
            windowSize:
            {
                x: 0,
                y: 0,
            },
            blocks: ["TestBlock", "TestBlock"],
            assigned_blocks: [],
        };
    },

    mounted()
    {
    },
    created: function ()
    {
    },
    methods:
    {
        OnResize()
        {
			// TODO (Garrett): need to resize assigned blocks bounding rect
            this.windowSize = {
                x: window.innerWidth,
                y: window.innerHeight
            };
        },

		OnAssignedBlockMove(event, original_event)
		{
			console.log(event);
			console.log(original_event);
		},

		OnCodeBlockMoved(block, absolute_position)
		{
			let parent_el = document.getElementById("codeArea");
			let parent_rect = document.getElementById("codeArea").getBoundingClientRect();

			let new_block = new CodeBlockClass(
				{
					propsData: { 
						type: "TestBlock",
						assigned: true,
						boundingRect: {
							top: parent_rect.top, 
							left: parent_rect.left, 
							right: parent_rect.right, 
							bottom: parent_rect.bottom,
						}
					}
				}
			)
			new_block.$mount();
			new_block.$el.className += " assigned-block";
			new_block.$el.style.top = (absolute_position.top - parent_el.getBoundingClientRect().y) + "px";
			new_block.$el.style.left = (absolute_position.left - parent_el.getBoundingClientRect().x) + "px";
			parent_el.appendChild(new_block.$el);
			this.assigned_blocks.push(new_block);
		},
    }
};
</script>

<style>
.v-list {
    min-width: 100px;
    width: 100%;
    overflow-y: auto;
}

.v-sheet {
	position: relative;
}

.assigned-block {
	position: absolute;
	top: 0;
	left: 0;
}

draggable {
	height: 100%
}
</style>
